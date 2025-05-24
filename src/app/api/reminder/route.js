// vercel-cron: 0 */15 * * * *

import { supabase } from '../../../utils/supabaseClient';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION });

function timeToDate(timeStr) {
  return timeStr ? new Date(timeStr) : null;
}

async function sendEmail(addresses, subject, body) {
  const params = {
    Source: 'dev-reminder@waveover.info',
    Destination: { ToAddresses: addresses },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } }
    }
  };
  await ses.send(new SendEmailCommand(params));
}

export async function GET() {
  // 1. Get all active arguments
  const { data: argumentsList, error } = await supabase
    .from('arguments')
    .select('*')
    .eq('argument_finished', false)
    .eq('spouse_accepted', true);

  if (error) {
    console.error('Supabase error:', error);
    return Response.json({ error: 'Failed to fetch arguments' }, { status: 500 });
  }

  const now = new Date();

  for (const argument of argumentsList) {
    const {
      id,
      user_email,
      spouse_email,
      user_firstname,
      spouse_firstname,
      argument_topic,
      last_email_sent,
      argument_deadline,
      reminder_time_two_days,
      reminder_time_one_days,
      reminder_time_twelve_hours,
      reminder_time_four_hours,
      user_response,
      spouse_response
    } = argument;

    // Parse times
    const deadline = timeToDate(argument_deadline);
    const reminders = {
      'two days reminder': timeToDate(reminder_time_two_days),
      'one day reminder': timeToDate(reminder_time_one_days),
      'twelve hours reminder': timeToDate(reminder_time_twelve_hours),
      'four hours reminder': timeToDate(reminder_time_four_hours)
    };

    // 2. If deadline passed, exchange responses and mark as finished
    if (deadline && now > deadline) {
      // Send responses to each participant
      await sendEmail(
        [spouse_email],
        `Response from ${user_firstname} for ${argument_topic}`,
        `Here is what ${user_firstname} had to say:<br>${user_response}`
      );
      await sendEmail(
        [user_email],
        `Response from ${spouse_firstname} for ${argument_topic}`,
        `Here is what ${spouse_firstname} had to say:<br>${spouse_response}`
      );
      // Mark as finished
      await supabase
        .from('arguments')
        .update({ argument_finished: true })
        .eq('id', id);
      continue;
    }

    // 3. Send reminders in order of priority
    let new_last_email_sent = null;
    if (
      reminders['four hours reminder'] &&
      now > reminders['four hours reminder'] &&
      ['invite email', 'two days reminder', 'one day reminder', 'twelve hours reminder'].includes(last_email_sent)
    ) {
      new_last_email_sent = 'four hours reminder';
    } else if (
      reminders['twelve hours reminder'] &&
      now > reminders['twelve hours reminder'] &&
      ['invite email', 'two days reminder', 'one day reminder'].includes(last_email_sent)
    ) {
      new_last_email_sent = 'twelve hours reminder';
    } else if (
      reminders['one day reminder'] &&
      now > reminders['one day reminder'] &&
      ['invite email', 'two days reminder'].includes(last_email_sent)
    ) {
      new_last_email_sent = 'one day reminder';
    } else if (
      reminders['two days reminder'] &&
      now > reminders['two days reminder'] &&
      last_email_sent === 'invite email'
    ) {
      new_last_email_sent = 'two days reminder';
    }

    if (new_last_email_sent) {
      // Compose and send reminder email
      const hoursLeft = deadline ? Math.round((deadline - now) / 36e5) : '?';
      const subject = `Discussion reminder for ${argument_topic}: ${new_last_email_sent.replace(' reminder', '')} left`;
      const body = `
        <p>Hi ${user_firstname} and ${spouse_firstname}!</p>
        <p>There are ${hoursLeft} hours left until responses are exchanged in your discussion about <b>${argument_topic}</b>.</p>
        <p>Get back into it by going to dev.waveover.info and clicking 'Display Current Discussions' -> 'Active' -> and click the discussion.</p>
      `;
      await sendEmail([user_email, spouse_email], subject, body);

      // Update last_email_sent
      await supabase
        .from('arguments')
        .update({ last_email_sent: new_last_email_sent })
        .eq('id', id);
    }
  }

  return Response.json({ status: 'reminders processed', count: argumentsList.length });
} 