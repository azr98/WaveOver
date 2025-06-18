import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { supabase } from '../../../utils/supabaseClient';
import { awsCredentialsProvider, getVercelOidcToken } from '@vercel/functions/oidc';

console.log('[Invite API] AWS_REGION:', process.env.AWS_REGION);
console.log('[Invite API] AWS_ROLE_ARN:', process.env.AWS_ROLE_ARN);

// Debug OIDC token
try {
  const token = getVercelOidcToken();
  if (token) {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('[Invite API] OIDC Token Info:', {
      iss: payload.iss,
      aud: payload.aud,
      sub: payload.sub,
      environment: payload.environment
    });
  } else {
    console.log('[Invite API] No OIDC token found');
  }
} catch (err) {
  console.error('[Invite API] Error reading OIDC token:', err);
}

let ses;
try {
  // Get credentials object first to debug
  const credentials = awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN });
  console.log('[Invite API] Got AWS credentials provider');
  
  // Try to get actual credentials
  const credentialsObj = await credentials();
  console.log('[Invite API] Successfully retrieved temporary credentials:', {
    accessKeyId: credentialsObj.accessKeyId ? '***' + credentialsObj.accessKeyId.slice(-4) : 'none',
    expiration: credentialsObj.expiration,
    hasSecretKey: !!credentialsObj.secretAccessKey,
    hasSessionToken: !!credentialsObj.sessionToken
  });

  ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials
  });
  console.log('[Invite API] SESClient instantiated successfully');
} catch (err) {
  console.error('[Invite API] Error instantiating SESClient:', err);
  if (err.Code === 'AccessDenied') {
    console.error('[Invite API] Access Denied Details:', {
      message: err.message,
      code: err.Code,
      requestId: err.RequestId,
      time: err.Time
    });
  }
}

async function sendEmail(addresses, subject, body) {
  const params = {
    Source: 'noreply@waveover.info',
    Destination: { ToAddresses: addresses },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } }
    }
  };
  console.log('[Invite API] Sending email with params:', JSON.stringify(params));
  await ses.send(new SendEmailCommand(params));
  console.log('[Invite API] Email sent via SES');
}

export async function POST(req) {
  try {
    const data = await req.json();
    console.log('[Invite API] POST data received:', data);
    // Expecting: user_email, user_firstname, user_lastname, spouse_email, spouse_firstname, spouse_lastname, argument_topic, submission_time

    // Compose email
    const email_subject = `${data.user_firstname} ${data.user_lastname} wants to discuss '${data.argument_topic}' with ${data.spouse_firstname} ${data.spouse_lastname}`;
    const email_body_html = `
      <!DOCTYPE html>
      <html>
      <head>
      <title>${email_subject}</title>
      </head>
      <body>
      <p>${data.user_firstname} ${data.user_lastname} wants to discuss '${data.argument_topic}' with ${data.spouse_firstname} ${data.spouse_lastname}.</p>
      <p>Once ${data.spouse_firstname} signs up or logs in at <a href="dev.waveover.info">dev.waveover.info</a> and accepts the discussion, a 3 day timer will start.</p>
      <p>Both of you have all that time to write your say in the text editor. No more, no less.</p>
      <p>Open the text editor by clicking 'Display Current Discussions' -> 'Active' -> and click the discussion.</p>
      <p>After 3 days what each of you wrote is sent to the other by email automatically.</p>
      <p>Both of ${data.user_firstname} and ${data.spouse_firstname} will receive a reminder 2 days, 1 day, 12 hours and 4 hours before the 3 day deadline.</p>
      <p>For a more detailed guide read here: <a href="https://waveover.me/help">https://waveover.me/help</a></p>
      <p>Thanks for using my app!,</p>
      <p>Azhar, creator of WaveOver</p>
      </body>
      </html>
    `;

    const addresses = [data.user_email, data.spouse_email];
    console.log('[Invite API] About to send email to:', addresses);
    await sendEmail(addresses, email_subject, email_body_html);
    console.log('[Invite API] Email send complete, updating Supabase...');

    // Update last_email_sent in Supabase
    const { error } = await supabase
      .from('arguments_production')
      .update({ last_email_sent: 'invite email' })
      .eq('user_email', data.user_email)
      .eq('submission_time', data.submission_time);

    if (error) {
      console.error('[Invite API] Supabase update error:', error);
      return Response.json({ error: 'Failed to update argument', details: error.message }, { status: 500 });
    }
    console.log('[Invite API] Supabase update successful');

    return Response.json({ message: 'Invite email sent successfully' }, { status: 200 });
  } catch (err) {
    console.error('[Invite API] Error in invite email:', err, err?.stack);
    return Response.json({ error: 'Failed to send invite email', details: err.message, stack: err.stack }, { status: 500 });
  }
} 