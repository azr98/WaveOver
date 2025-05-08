import { NextResponse } from 'next/server';

const DUMMY_ARGUMENTS = [
  {
    argument_topic: 'Active',
    submission_time: '2025-04-08T16:30:00',
    user_email: 'user@example.com',
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
    user_email: 'user@example.com',
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
    user_email: 'user@example.com',
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
  const user_email = searchParams.get('user_email');
  console.log('[API] /api/get_active_arguments called');
  console.log('[API] Query params:', Object.fromEntries(searchParams.entries()));

  let filtered = DUMMY_ARGUMENTS;
  if (user_email) {
    filtered = DUMMY_ARGUMENTS.filter(
      (a) => a.user_email === user_email || a.spouse_email === user_email
    );
    console.log(`[API] Filtered arguments for user_email=${user_email}:`, filtered);
  } else {
    console.log('[API] No user_email provided, returning all arguments.');
  }

  return NextResponse.json(filtered);
} 