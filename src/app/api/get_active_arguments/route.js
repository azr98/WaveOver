import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_email = searchParams.get('user_email');
    if (!user_email) {
      return NextResponse.json({ arguments: [] });
    }

    const { data, error } = await supabase
      .from('arguments_production')
      .select('*')
      .or(`user_email.eq.${user_email},spouse_email.eq.${user_email}`);

    if (error) {
      return NextResponse.json({ arguments: [], error: error.message }, { status: 500 });
    }

    const argumentsList = (data || []).map(item => ({
      argument_topic: item.argument_topic || '',
      user_email: item.user_email || '',
      spouse_email: item.spouse_email || '',
      last_email_sent: item.last_email_sent || '',
      argument_deadline: item.argument_deadline || '',
      submission_time: item.submission_time || '',
      spouse_accepted: item.spouse_accepted ?? false,
      argument_finished: item.argument_finished ?? false,
      user_firstname: item.user_firstname || '',
      user_lastname: item.user_lastname || '',
      spouse_firstname: item.spouse_firstname || '',
      spouse_lastname: item.spouse_lastname || '',
      user_response: item.user_response || '',
      spouse_response: item.spouse_response || ''
    }));
    return NextResponse.json({ arguments: argumentsList });
  } catch (err) {
    console.error('Error in get_active_arguments:', err);
    return NextResponse.json({ arguments: [], error: err.message }, { status: 500 });
  }
} 