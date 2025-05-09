import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_email = searchParams.get('user_email');
    if (!user_email) {
      return NextResponse.json({ arguments: [] });
    }

    const client = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION || 'eu-west-1' });
    // DynamoDB Scan with filter for user_email or spouse_email
    const params = {
      TableName: process.env.ARGUMENT_TABLE || 'WaveOver_Dev',
      FilterExpression: 'user_email = :user_email OR spouse_email = :user_email',
      ExpressionAttributeValues: {
        ':user_email': { S: user_email }
      },
      ProjectionExpression: [
        'user_email, spouse_email, argument_topic, reminder_time_two_days,',
        'reminder_time_one_days, reminder_time_twelve_hours, reminder_time_four_hours,',
        'argument_deadline, submission_time, argument_finished, last_email_sent,',
        'user_response, spouse_response, spouse_accepted, user_firstname, user_lastname,',
        'spouse_firstname, spouse_lastname'
      ].join(' ')
    };
    const command = new ScanCommand(params);
    const response = await client.send(command);
    // Convert DynamoDB format to plain JS objects for the frontend
    const argumentsList = (response.Items || []).map(item => ({
      argument_topic: item.argument_topic?.S || '',
      user_email: item.user_email?.S || '',
      spouse_email: item.spouse_email?.S || '',
      last_email_sent: item.last_email_sent?.S || '',
      argument_deadline: item.argument_deadline?.S || '',
      submission_time: item.submission_time?.S || '',
      spouse_accepted: item.spouse_accepted?.BOOL ?? false,
      argument_finished: item.argument_finished?.BOOL ?? false,
      user_firstname: item.user_firstname?.S || '',
      user_lastname: item.user_lastname?.S || '',
      spouse_firstname: item.spouse_firstname?.S || '',
      spouse_lastname: item.spouse_lastname?.S || '',
      user_response: item.user_response?.S || '',
      spouse_response: item.spouse_response?.S || ''
    }));
    return NextResponse.json({ arguments: argumentsList });
  } catch (err) {
    console.error('Error in get_active_arguments:', err);
    return NextResponse.json({ arguments: [], error: err.message }, { status: 500 });
  }
} 