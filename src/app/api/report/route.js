import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Initialize AWS clients
const s3Client = new S3Client({ region: 'eu-west-1' });
const snsClient = new SNSClient({ region: 'eu-west-1' });

export async function POST(request) {
  try {
    const data = await request.json();
    const { user_id, title, message, is_bug, bug_severity } = data;

    // Validate required fields
    if (!user_id || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format timestamp for filename and payload
    const now = new Date();
    const date_str = now.toISOString().split('T')[0];
    const time_str = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const timestamp_str = `${date_str}_${time_str}`;

    const report_payload = {
      user_id,
      title,
      message,
      is_bug,
      bug_severity,
      timestamp: timestamp_str,
      report_status: 'new'
    };

    // Determine the folder based on report type
    const folder = is_bug ? `bugs/${bug_severity}` : 'feedback';
    const file_key = `${folder}/${date_str}_report_${user_id}.json`;

    // Store in S3
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: 'waveover-development-user-reports',
          Key: file_key,
          Body: JSON.stringify(report_payload),
          StorageClass: 'STANDARD_IA'
        })
      );
    } catch (error) {
      console.error('S3 upload failed:', error);
      return NextResponse.json(
        { error: 'Failed to store report' },
        { status: 500 }
      );
    }

    // Notify via SNS only for major bugs
    if (is_bug && bug_severity === 'major') {
      const subject = `Major Bug WaveOver Dev - ${title} (${timestamp_str})`;
      const body = `New bug report received:\n\n` +
        `Title: ${title}\n` +
        `Severity: ${bug_severity}\n` +
        `Time: ${timestamp_str}\n` +
        `User ID: ${user_id}\n\n` +
        `Message:\n${message}\n`;

      try {
        await snsClient.send(
          new PublishCommand({
            TopicArn: 'arn:aws:sns:eu-west-1:058264329805:waveover-development-bugreports',
            Subject: subject,
            Message: body
          })
        );
      } catch (error) {
        console.error('SNS publish failed:', error);
        return NextResponse.json(
          { error: 'Failed to notify via SNS' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling report:', error);
    return NextResponse.json(
      { error: 'Failed to process report' },
      { status: 500 }
    );
  }
} 