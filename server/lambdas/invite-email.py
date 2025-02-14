import json
import boto3
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import requests

# Initialize clients
dynamodb = boto3.client('dynamodb')
ses = boto3.client('ses', region_name='eu-west-1')
table = 'WaveOver_Dev'

# Get Clerk API key from Parameter Store
ssm = boto3.client('ssm')
clerk_api_key = ssm.get_parameter(
    Name='clerk-secret-api-key',
    WithDecryption=True
)['Parameter']['Value']

def lambda_handler(event, context):
    print(f"The event is : {event}")
    db_event_trigger = event['Records'][0]['eventName']
    
    # For sending invite email when the trigger in DynamoDB INSERT
    if db_event_trigger == 'INSERT':
        # Extract date from INSERT trigger entry
        print('Trigger is DynamoDB INSERT')
        submission_time = event['Records'][0]['dynamodb']['NewImage']['submission_time']['S']
        user_email = event['Records'][0]['dynamodb']['Keys']['user_email']['S']
        spouse_email = event['Records'][0]['dynamodb']['NewImage']['spouse_email']['S']
        argument_topic = event['Records'][0]['dynamodb']['NewImage']['argument_topic']['S']

        # Composing email content
        email_body = f'''You are invited to write down your say in a discussion about '{argument_topic}' between {user_email} and {spouse_email}. \n Sign up or login here.
        After both of you have an account you will have 3 days to write what you want and will receive a reminder 48, 24, 12 and 4 horus before the deadline. 
        \n After 3 days each persons say is exchanfed and emailed to the other'''
        email_subject = f'Talk about {argument_topic} between {user_email} and {spouse_email}'
        
        addresses = [user_email, spouse_email]
        send_email(addresses, email_subject, email_body)

        argument_key = {
            'user_email': {'S': user_email},
            'submission_time': {'S': submission_time}
        }
        reminder_time_update_expression = "SET last_email_sent = :val"
        reminder_expression_attribute_values = {
            ':val': {'S': 'invite email'}
        }
        first_invite_sent_update = update_argument(argument_key, reminder_time_update_expression, reminder_expression_attribute_values)
        print(f"first_invite_sent updated with {first_invite_sent_update} for {argument_topic} between {user_email} and {spouse_email}")

def send_email(addresses, subject, body):
    ses.send_email(
        Source='dev@waveover.info',
        Destination={'ToAddresses': addresses},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )
    print(f"Email sent to {addresses} ")

def check_user_exists(email):
    try:
        headers = {
            'Authorization': f'Bearer {clerk_api_key}',
            'Content-Type': 'application/json'
        }
        response = requests.get(
            f'https://api.clerk.dev/v1/users',
            headers=headers,
            params={'email_address': email}
        )
        
        if response.status_code == 200:
            users = response.json()
            return len(users.get('data', [])) > 0
        return False
    except Exception as e:
        print(f"Error checking user existence: {str(e)}")
        return False

def update_argument(key, update_expression, expression_attribute_values, expression_attribute_names=None):
    # Construct the base parameters
    update_params = {
        'TableName': table,
        'Key': key,
        'UpdateExpression': update_expression,
        'ExpressionAttributeValues': expression_attribute_values,
        'ReturnValues': 'UPDATED_NEW'
    }
    
    # Conditionally add ExpressionAttributeNames if provided
    if expression_attribute_names:
        update_params['ExpressionAttributeNames'] = expression_attribute_names
    
    # Perform the update
    response = dynamodb.update_item(**update_params)
    return response