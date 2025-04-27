import json
import boto3
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    db_event_trigger = event['Records'][0]['eventName']
    
    # For sending invite email when the trigger in DynamoDB INSERT
    if db_event_trigger == 'INSERT':
        try:
            # Extract date from INSERT trigger entry
            print('The trigger is DynamoDB INSERT', event['Records'][0]['eventName'] , event['Records'][0]['eventSource'])
            submission_time = event['Records'][0]['dynamodb']['NewImage']['submission_time']['S']
            user_email = event['Records'][0]['dynamodb']['Keys']['user_email']['S']
            user_firstname = event['Records'][0]['dynamodb']['NewImage']['user_firstname']['S']
            user_lastname = event['Records'][0]['dynamodb']['NewImage']['user_lastname']['S']
            spouse_email = event['Records'][0]['dynamodb']['NewImage']['spouse_email']['S']
            spouse_firstname = event['Records'][0]['dynamodb']['NewImage']['spouse_firstname']['S']
            spouse_lastname = event['Records'][0]['dynamodb']['NewImage']['spouse_lastname']['S']
            argument_topic = event['Records'][0]['dynamodb']['NewImage']['argument_topic']['S']

            # Initialize clients
            dynamodb = boto3.client('dynamodb')
            ses = boto3.client('ses', region_name='eu-west-1')
            table = 'WaveOver_Dev'

            # Composing email content
            email_body = f'''{user_firstname} {user_lastname} wants to discuss '{argument_topic}' with {spouse_firstname} {spouse_lastname}
            \n Once {spouse_firstname} signs up or logs in at dev.waveover.info and accepts the discussion, a 3 day timer will start.
            \n
            Both of you have all that time to write your say in the text editor. No more, no less.
            Open the text editor by clicking 'Display Current Discussions' -> 'Active' -> and click the discussion.
            \n After 3 days what each of you wrote is sent to the other by email automatically. 
            Both of {user_firstname} and {spouse_firstname} will receive a reminder 2 days, 1 day,, 12 hours and 4 hours before the 3 day deadline.

            For a more detailed guide read here: https://waveover.info/help
            \n
            Thanks for using my app!
            \n
            Azhar , creator of WaveOver
            '''
            email_subject = f'Discussion about {argument_topic} between {user_firstname} {user_lastname} and {spouse_firstname} {spouse_lastname}'
            
            addresses = [user_email, spouse_email]
            email_sent_response = send_email(ses, addresses, email_subject, email_body)

            argument_key = {
                'user_email': {'S': user_email},
                'submission_time': {'S': submission_time}
            }
            reminder_time_update_expression = "SET last_email_sent = :val"
            reminder_expression_attribute_values = {
                ':val': {'S': 'invite email'}
            }
            first_invite_sent_update = update_argument(dynamodb, table, argument_key, reminder_time_update_expression, reminder_expression_attribute_values)
            print(f"first_invite_sent updated with ses email message_id {email_sent_response['MessageId']}.\n Arg {first_invite_sent_update} updated for topic {argument_topic} between {user_email} and {spouse_email}")
            
            return {
                'statusCode': 200,
                'body': json.dumps('Invite email sent successfully')
            }
            
        except Exception as e:
            print(f"Error in lambda_handler: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps(f'Error: {str(e)}')
            }

def send_email(ses_client, addresses, subject, body):
    try:
        response = ses_client.send_email(
            Source='dev-invitation@waveover.info',
            Destination={'ToAddresses': addresses},
            Message={
                'Subject': {'Data': subject},
                'Body': {'Html': {'Data': body}}
            }
        )
        print(f"Email sent to {addresses} ")
        return response  # Return the SES response
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        raise e

def update_argument(dynamodb_client, table_name, key, update_expression, expression_attribute_values, expression_attribute_names=None):
    try:
        # Construct the base parameters
        update_params = {
            'TableName': table_name,
            'Key': key,
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values,
            'ReturnValues': 'UPDATED_NEW'
        }
        
        # Conditionally add ExpressionAttributeNames if provided
        if expression_attribute_names:
            update_params['ExpressionAttributeNames'] = expression_attribute_names
        
        # Perform the update
        response = dynamodb_client.update_item(**update_params)
        return response
    except Exception as e:
        print(f"Error updating argument: {str(e)}")
        raise e