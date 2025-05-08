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

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const argument_topic = searchParams.get('argument_topic');
  const submission_time = searchParams.get('submission_time');
  const userEmail = searchParams.get('userEmail');

  console.log('[API] /api/get_argument called with:', { 
    argument_topic, 
    submission_time, 
    userEmail,
    url: req.url,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  if (!argument_topic || !submission_time) {
    console.log('[API] Missing required parameters:', { argument_topic, submission_time });
    return NextResponse.json(
      { error: 'Both argument_topic and submission_time are required' },
      { status: 400 }
    );
  }

  // Find the argument in our dummy data
  const argument = DUMMY_ARGUMENTS.find(
    (arg) => arg.argument_topic === argument_topic && arg.submission_time === submission_time
  );

  if (!argument) {
    console.log('[API] Argument not found:', { argument_topic, submission_time });
    return NextResponse.json(
      { error: 'Argument not found' },
      { status: 404 }
    );
  }

  // Check if user is authorized to view this argument
  if (userEmail !== argument.user_email && userEmail !== argument.spouse_email) {
    console.log('[API] User not authorized:', { userEmail, argument_user: argument.user_email, argument_spouse: argument.spouse_email });
    return NextResponse.json(
      { error: 'Not authorized to view this argument' },
      { status: 403 }
    );
  }

  console.log('[API] Returning argument:', argument);
  return NextResponse.json(argument);
} 