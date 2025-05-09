import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_email = searchParams.get('user_email'); // Partition key
    const submission_time = searchParams.get('submission_time'); // Sort key
    const userEmail = searchParams.get('userEmail'); // The requesting user's email for auth

    if (!user_email || !submission_time) {
      return NextResponse.json(
        { error: 'Both user_email and submission_time are required' },
        { status: 400 }
      );
    }

    const client = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION || 'eu-west-1' });
    const params = {
      TableName: process.env.ARGUMENT_TABLE || 'WaveOver_Dev',
      Key: {
        user_email: { S: user_email },
        submission_time: { S: submission_time }
      }
    };
    const command = new GetItemCommand(params);
    const response = await client.send(command);
    if (!response.Item) {
      return NextResponse.json(
        { error: 'Argument not found' },
        { status: 404 }
      );
    }
    // Convert DynamoDB item to plain JS object
    const item = {
      argument_topic: response.Item.argument_topic?.S || '',
      user_email: response.Item.user_email?.S || '',
      spouse_email: response.Item.spouse_email?.S || '',
      last_email_sent: response.Item.last_email_sent?.S || '',
      argument_deadline: response.Item.argument_deadline?.S || '',
      submission_time: response.Item.submission_time?.S || '',
      spouse_accepted: response.Item.spouse_accepted?.BOOL ?? false,
      argument_finished: response.Item.argument_finished?.BOOL ?? false,
      user_firstname: response.Item.user_firstname?.S || '',
      user_lastname: response.Item.user_lastname?.S || '',
      spouse_firstname: response.Item.spouse_firstname?.S || '',
      spouse_lastname: response.Item.spouse_lastname?.S || '',
      user_response: response.Item.user_response?.S || '',
      spouse_response: response.Item.spouse_response?.S || ''
    };
    // Check if user is authorized to view this argument
    if (userEmail !== item.user_email && userEmail !== item.spouse_email) {
      return NextResponse.json(
        { error: 'Not authorized to view this argument' },
        { status: 403 }
      );
    }
    return NextResponse.json(item);
  } catch (err) {
    console.error('Error in get_argument:', err);
    return NextResponse.json({ error: 'Failed to get argument', details: err.message }, { status: 500 });
  }
} 