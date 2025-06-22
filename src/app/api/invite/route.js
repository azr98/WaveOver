import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { supabase } from '../../../utils/supabaseClient';
import { awsCredentialsProvider } from '@vercel/functions/oidc';

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
function capitalizeFirstLetter(str) {
  if (str.length === 0) {
    return ""; // Handle empty string
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
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
    const user_firstname = capitalizeFirstLetter(data.user_firstname);
    const user_lastname = capitalizeFirstLetter(data.user_lastname);
    const spouse_firstname = capitalizeFirstLetter(data.spouse_firstname);
    // Compose email
    const email_subject = `${user_firstname} ${user_lastname} wants to discuss '${data.argument_topic}' with you`;
    const email_body_html = `
      <!DOCTYPE html>
      <html>
      <head>
      <title>${email_subject}</title>
      </head>
      <body>
      <p>Hi ${spouse_firstname}!</p>
      <p>${user_firstname} ${user_lastname} wants to discuss'${data.argument_topic}' with you in writing. ${user_firstname} has used the WaveOver web app to facilitate this.</p>
      <p>It is very simple. The only actions you take start is just to sign up/log in at <a href="waveover.me">WaveOver</a> and a 3 day timer starts after you accept the discussion.
      Then both of you have all that time to write your say in the text editor. No more, no less. The text editor autosaves so you can just focus on writing.
      </p>

      <p>Both of you will receive an email reminder 2 days, 1 day, 12 hours and 4 hours before the 3 day timer is up. When it is up you are both sent what the other said by email. It is also viewable in the dashboard 'Finished' tab so don't worry if you delete that email.</p>
      
      <p>You accept the disucssion by clicking it in the 'Pending' section. Then click it again in 'Active' to open the editor start writing. <a href="https://waveover.me/writing">Here</a> are some writing tips.</p>

      <p>For a more visual guide on how WaveOver works see <a href="https://waveover.me/help_partner">this</a>. Remember to check spam and allow from 'noreply@waveover.info' for the reminders and final email.</p>  

      <p>If you have any questions or feedback please email me at <a href="mailto:azhar@waveover.info">azhar@waveover.info</a> or there is a product feedback form in the WaveOver dashboard.</p>

      <p>Thanks for using my app! I really hope you find it valuable</p>
      <p>Azhar,</p>
      <p>Creator of WaveOver</p>
      </body>
      </html>
    `;

    const addresses = [data.spouse_email];
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