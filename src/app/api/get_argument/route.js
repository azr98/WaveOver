import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_email = searchParams.get('user_email');
    const submission_time = searchParams.get('submission_time');
    const userEmail = searchParams.get('userEmail');

    if (!user_email || !submission_time) {
      return NextResponse.json(
        { error: 'Both user_email and submission_time are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('arguments')
      .select('*')
      .eq('user_email', user_email)
      .eq('submission_time', submission_time)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Argument not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this argument
    if (userEmail !== data.user_email && userEmail !== data.spouse_email) {
      return NextResponse.json(
        { error: 'Not authorized to view this argument' },
        { status: 403 }
      );
    }

    // Return the same shape as before
    const item = {
      argument_topic: data.argument_topic || '',
      user_email: data.user_email || '',
      spouse_email: data.spouse_email || '',
      last_email_sent: data.last_email_sent || '',
      argument_deadline: data.argument_deadline || '',
      submission_time: data.submission_time || '',
      spouse_accepted: data.spouse_accepted ?? false,
      argument_finished: data.argument_finished ?? false,
      user_firstname: data.user_firstname || '',
      user_lastname: data.user_lastname || '',
      spouse_firstname: data.spouse_firstname || '',
      spouse_lastname: data.spouse_lastname || '',
      user_response: data.user_response || '',
      spouse_response: data.spouse_response || ''
    };
    return NextResponse.json(item);
  } catch (err) {
    console.error('Error in get_argument:', err);
    return NextResponse.json({ error: 'Failed to get argument', details: err.message }, { status: 500 });
  }
} 