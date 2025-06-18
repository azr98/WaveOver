import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { supabase } from '../../../utils/supabaseClient';
import { awsCredentialsProvider } from '@vercel/functions/oidc';

console.log('[Invite API] AWS_REGION:', process.env.AWS_REGION);
console.log('[Invite API] AWS_ROLE_ARN:', process.env.AWS_ROLE_ARN);

let ses;
try {
  ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN })
  });
  console.log('[Invite API] SESClient instantiated successfully');
} catch (err) {
  console.error('[Invite API] Error instantiating SESClient:', err);
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
      <p>${data.user_firstname} wants to discuss'${data.argument_topic}' with you</p>
      <p>${data.user_firstname} ${data.user_lastname} has sent you an invitation to discuss '${data.argument_topic}'. 
      To accept and begin you just need to sign up or log in at <a href="waveover.me">WaveOver</a> and a 3 day timer will start.
      Both of you have all that time to write your say in the text editor. No more, no less. The text editor autosaves so you can just focus on writing.
      </p>
      
      <p>You can accept the disucssion by clicking it in the 'Pending'section and thenyou can begin writing. <a href="https://waveover.me/writing">Here</a> are some tips</p>
      <p>When the 3 day timer is up what each of you wrote is sent to the other by email automatically.</p>
      <p>Both of you will receive a reminder 2 days, 1 day, 12 hours and 4 hours before the 3 day timer is up.</p>
      <p>For a more detailed guide read <a href="https://waveover.me/help_spouse">here</a>. Remembder to check spam and allow from 'noreply@waveover.info' </p>
      <p>Thanks for using my app !</p>
      <p>Azhar,</p>
      <p>creator of WaveOver</p>
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