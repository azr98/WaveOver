import { createClient } from '@supabase/supabase-js';

// Import Supabase client from a utility file (to be created if not present)
import { supabase } from '../../../utils/supabaseClient';

export async function POST(req) {
  try {
    const data = await req.json();
    // Capitalize first and last names
    const user_firstname = data.user_firstname?.trim().charAt(0).toUpperCase() + data.user_firstname?.trim().slice(1);
    const user_lastname = data.user_lastname?.trim().charAt(0).toUpperCase() + data.user_lastname?.trim().slice(1);
    const spouse_firstname = data.spouse_firstname?.trim().charAt(0).toUpperCase() + data.spouse_firstname?.trim().slice(1);
    const spouse_lastname = data.spouse_lastname?.trim().charAt(0).toUpperCase() + data.spouse_lastname?.trim().slice(1);

    // Generate submission_time in UTC (Postgres TIMESTAMP WITH TIME ZONE)
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const submission_time = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`;

    const insertData = {
      user_email: data.user_email,
      user_firstname,
      user_lastname,
      spouse_email: data.spouse_email,
      spouse_firstname,
      spouse_lastname,
      submission_time,
      argument_topic: data.argument_topic,
      user_response: '<p>Write what you think here</p>',
      spouse_response: '<p>Write what you think here</p>',
      reminder_time_two_days: null,
      reminder_time_one_days: null,
      reminder_time_twelve_hours: null,
      reminder_time_four_hours: null,
      argument_deadline: null,
      argument_finished: false,
      spouse_accepted: false,
      last_email_sent: null
    };

    const { error } = await supabase
      .from('arguments')
      .insert([insertData]);

    if (error) {
      console.error('Supabase insert error:', error);
      return Response.json({ error: 'Failed to submit argument', details: error.message }, { status: 500 });
    }
    return Response.json({ message: 'Initial argument entry submitted' }, { status: 201 });
  } catch (err) {
    console.error('Error in submit_argument:', err);
    return Response.json({ error: 'Failed to submit argument', details: err.message }, { status: 500 });
  }
} 