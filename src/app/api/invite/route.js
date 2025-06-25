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
        <body>
          <p>Hi,</p>

          <p>${user_firstname} ${user_lastname} has invited you to thoughtfully discuss "${data.argument_topic}" using a unique tool called <a href="waveover.me">WaveOver</a>.</p>

          <p>WaveOver helps two people communicate clearly and calmly—especially when the topic matters. Once you accept the invite, a 3-day timer begins. During that time, you’ll both privately write your thoughts in a distraction-free editor. No instant replies. No interruptions. Just space to think and express yourself fully.</p>

          <p>The editor autosaves everything. You'll get helpful reminders at 2 days, 1 day, 12 hours, and 4 hours about the discussion before time's up. When the 3 days end, both of you receive what the other wrote , simultaneously by email. You can also find it in the ‘Finished’ tab on your dashboard so don't worry if you delete that email.</p>

          <p>To begin, sign up or log in at <a href="waveover.me">WaveOver</a>. Go to the ‘Pending’ section to accept the discussion. Then, head to the ‘Active’ tab to start writing. Need help? Check out these <a href="https://waveover.me/writing">writing tips</a>.</p>

          <p>Want a simple visual walkthrough of the app? Here’s a quick <a href="https://waveover.me/help_partner">how-to guide</a>. Be sure to check your spam folder and whitelist 'noreply@waveover.info' so you don't miss the reminders and the final exchange.</p>

          <p>Have questions? Feel free to reach out to me <a href="https://x.com/TheAzharSharif">on twitter</a>, or use the feedback form inside the app.</p>

          <p>Wishing you a meaningful and productive conversation,</p>
          <p>Azhar<br>Creator of WaveOver</p>
        </body>
        </html>`;

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