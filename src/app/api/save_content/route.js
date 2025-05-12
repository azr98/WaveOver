import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: 'eu-west-1' });
const argument_table = 'WaveOver_Dev';

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

    const params = {
      TableName: argument_table,
      Key: {
        user_email: { S: user_email },
        submission_time: { S: submission_time }
      },
      UpdateExpression: `SET ${updateField} = :content` ,
      ExpressionAttributeValues: {
        ':content': { S: content }
      }
    };

    await dynamo.send(new UpdateItemCommand(params));
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