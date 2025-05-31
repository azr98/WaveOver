import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function POST(req) {
  try {
    const data = await req.json();
    console.log('[API] save_content called with:', data);

    const { argument, content, userEmail } = data;
    const { submission_time, user_email, spouse_email } = argument;

    if (!submission_time || !user_email || !spouse_email || !content || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let updateField = null;
    if (userEmail === user_email) {
      updateField = 'user_response';
    } else if (userEmail === spouse_email) {
      updateField = 'spouse_response';
    } else {
      console.log('[API] User not authorized:', { userEmail, user_email, spouse_email });
      return NextResponse.json(
        { error: 'Not authorized to update this argument' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('arguments_development')
      .update({ [updateField]: content })
      .eq('user_email', user_email)
      .eq('submission_time', submission_time);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save content', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ message: 'Content saved successfully' });
  } catch (error) {
    console.error('[API] Error saving content:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}