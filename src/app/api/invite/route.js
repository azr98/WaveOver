import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { supabase } from '../../../utils/supabaseClient';

const ses = new SESClient({ region: process.env.AWS_REGION });

async function sendEmail(addresses, subject, body) {
  const params = {
    Source: 'invitationnoreply@waveover.info.info',
    Destination: { ToAddresses: addresses },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } }
    }
  };
  await ses.send(new SendEmailCommand(params));
}

export async function POST(req) {
  try {
    const data = await req.json();
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
      <p>For a more detailed guide read here: <a href="https://waveover.info/help">https://waveover.info/help</a></p>
      <p>Thanks for using my app!,</p>
      <p>Azhar, creator of WaveOver</p>
      </body>
      </html>
    `;

    const addresses = [data.user_email, data.spouse_email];
    await sendEmail(addresses, email_subject, email_body_html);

    // Update last_email_sent in Supabase
    const { error } = await supabase
      .from('arguments_production')
      .update({ last_email_sent: 'invite email' })
      .eq('user_email', data.user_email)
      .eq('submission_time', data.submission_time);

    if (error) {
      console.error('Supabase update error:', error);
      return Response.json({ error: 'Failed to update argument', details: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Invite email sent successfully' }, { status: 200 });
  } catch (err) {
    console.error('Error in invite email:', err);
    return Response.json({ error: 'Failed to send invite email', details: err.message }, { status: 500 });
  }
} 