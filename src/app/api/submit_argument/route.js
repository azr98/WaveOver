import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

export async function POST(req) {
  try {
    const data = await req.json();
    // Capitalize first and last names
    const user_firstname = data.user_firstname?.trim().charAt(0).toUpperCase() + data.user_firstname?.trim().slice(1);
    const user_lastname = data.user_lastname?.trim().charAt(0).toUpperCase() + data.user_lastname?.trim().slice(1);
    const spouse_firstname = data.spouse_firstname?.trim().charAt(0).toUpperCase() + data.spouse_firstname?.trim().slice(1);
    const spouse_lastname = data.spouse_lastname?.trim().charAt(0).toUpperCase() + data.spouse_lastname?.trim().slice(1);

    // Generate submission_time in UTC
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const submission_time = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;

    const item = {
      'user_email': { S: data.user_email },
      'user_firstname': { S: user_firstname },
      'user_lastname': { S: user_lastname },
      'spouse_email': { S: data.spouse_email },
      'spouse_firstname': { S: spouse_firstname },
      'spouse_lastname': { S: spouse_lastname },
      'submission_time': { S: submission_time },
      'argument_topic': { S: data.argument_topic },
      'user_response': { S: '' },
      'spouse_response': { S: '' },
      'reminder_time_two_days': { S: '' },
      'reminder_time_one_days': { S: '' },
      'reminder_time_twelve_hours': { S: '' },
      'reminder_time_four_hours': { S: '' },
      'argument_deadline': { S: '' },
      'argument_finished': { BOOL: false },
      'spouse_accepted': { BOOL: false },
      'last_email_sent': { S: '' }
    };

    const client = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION || 'eu-west-1' });
    const command = new PutItemCommand({
      TableName: process.env.ARGUMENT_TABLE || 'WaveOver_Dev',
      Item: item
    });
    await client.send(command);
    return Response.json({ message: 'Initial argument entry submitted' }, { status: 201 });
  } catch (err) {
    console.error('Error in submit_argument:', err);
    return Response.json({ error: 'Failed to submit argument', details: err.message }, { status: 500 });
  }
} 