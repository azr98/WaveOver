import { NextResponse } from 'next/server';

const DUMMY_ARGUMENTS = [
  {
    argument_topic: 'Active',
    submission_time: '2025-04-08T16:30:00',
    user_email: 'azhar981@gmail.com',
    user_firstname: 'Alice',
    user_lastname: 'Smith',
    spouse_email: 'spouse@example.com',
    spouse_firstname: 'Bob',
    spouse_lastname: 'Jones',
    user_response: '<p>This is the <b>user</b> response for the active argument.</p>',
    spouse_response: '<p>This is the <i>spouse</i> response for the active argument.</p>',
    argument_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days in future
    argument_finished: false,
    spouse_accepted: true,
  },
  {
    argument_topic: 'Pending',
    submission_time: '2025-04-08T16:30:00',
    user_email: 'azhar981@gmail.com',
    user_firstname: 'Alice',
    user_lastname: 'Smith',
    spouse_email: 'spouse@example.com',
    spouse_firstname: 'Bob',
    spouse_lastname: 'Jones',
    user_response: '<p>This is the <b>user</b> response for the pending argument.</p>',
    spouse_response: '<p>This is the <i>spouse</i> response for the pending argument.</p>',
    argument_deadline: '',
    argument_finished: false,
    spouse_accepted: false,
  },
  {
    argument_topic: 'Finished',
    submission_time: '2025-04-06T16:30:00',
    user_email: 'azhar981@gmail.com',
    user_firstname: 'Alice',
    user_lastname: 'Smith',
    spouse_email: 'spouse@example.com',
    spouse_firstname: 'Bob',
    spouse_lastname: 'Jones',
    user_response: '<p>This is the <b>user</b> response for the finished argument.</p>',
    spouse_response: '<p>This is the <i>spouse</i> response for the finished argument.</p>',
    argument_deadline: '2025-04-05T16:30:00', // 3 days in the past
    argument_finished: true,
    spouse_accepted: true,
  },
];

export async function POST(req) {
  try {
    const data = await req.json();
    console.log('[API] save_content called with:', data);

    const { argument, content, userEmail } = data;
    const { submission_time, user_email, spouse_email } = argument;

    // Find the argument in our dummy data
    const argumentIndex = DUMMY_ARGUMENTS.findIndex(
      (arg) => arg.submission_time === submission_time
    );

    if (argumentIndex === -1) {
      console.log('[API] Argument not found:', submission_time);
      return NextResponse.json(
        { error: 'Argument not found' },
        { status: 404 }
      );
    }

    // Determine which field to update based on the user's email
    if (userEmail === user_email) {
      DUMMY_ARGUMENTS[argumentIndex].user_response = content;
    } else if (userEmail === spouse_email) {
      DUMMY_ARGUMENTS[argumentIndex].spouse_response = content;
    } else {
      console.log('[API] User not authorized:', { userEmail, user_email, spouse_email });
      return NextResponse.json(
        { error: 'Not authorized to update this argument' },
        { status: 403 }
      );
    }

    console.log('[API] Content saved successfully');
    return NextResponse.json({ message: 'Content saved successfully' });
  } catch (error) {
    console.error('[API] Error saving content:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}