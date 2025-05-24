import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

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

    const { error } = await supabase
      .from('arguments')
      .update({
        spouse_accepted: accepted,
        spouse_firstname: spouseFirst,
        spouse_lastname: spouseLast
      })
      .eq('user_email', user_email)
      .eq('submission_time', submission_time);

    if (error) {
      return NextResponse.json({ error: 'Failed to update spouse acceptance status', details: error.message }, { status: 500 });
    }

    // Invoke AWS Lambda after successful update
    const lambda = new LambdaClient({ region: process.env.AWS_REGION });
    const payload = { user_email, submission_time };
    const command = new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_EMAIL_REMINDER_ARN_DEV,
      Payload: Buffer.from(JSON.stringify(payload)),
    });
    let lambdaResult;
    try {
      lambdaResult = await lambda.send(command);
    } catch (lambdaError) {
      return NextResponse.json({ error: 'Failed to invoke Lambda', details: lambdaError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Spouse acceptance status updated successfully', lambda: lambdaResult });
  } catch (error) {
    console.error('Error updating spouse acceptance:', error);
    return NextResponse.json({ error: 'Failed to update spouse acceptance status' }, { status: 500 });
  }
} 