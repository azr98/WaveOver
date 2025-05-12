import { NextResponse } from 'next/server';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: 'eu-west-1' });
const argument_table = 'WaveOver_Dev';

export async function POST(request) {
  try {
    const data = await request.json();
    const { user_email, submission_time, accepted, spouse_firstname, spouse_lastname } = data;

    if (!user_email || !submission_time || typeof accepted !== 'boolean' || !spouse_firstname || !spouse_lastname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Capitalize spouse names
    const capFirst = (str) => str.trim().charAt(0).toUpperCase() + str.trim().slice(1);
    const spouseFirst = capFirst(spouse_firstname);
    const spouseLast = capFirst(spouse_lastname);

    const params = {
      TableName: argument_table,
      Key: {
        user_email: { S: user_email },
        submission_time: { S: submission_time }
      },
      UpdateExpression: 'SET spouse_accepted = :accepted, spouse_firstname = :spouse_firstname, spouse_lastname = :spouse_lastname',
      ExpressionAttributeValues: {
        ':accepted': { BOOL: accepted },
        ':spouse_firstname': { S: spouseFirst },
        ':spouse_lastname': { S: spouseLast }
      }
    };

    await dynamo.send(new UpdateItemCommand(params));
    return NextResponse.json({ message: 'Spouse acceptance status updated successfully' });
  } catch (error) {
    console.error('Error updating spouse acceptance:', error);
    return NextResponse.json({ error: 'Failed to update spouse acceptance status' }, { status: 500 });
  }
} 