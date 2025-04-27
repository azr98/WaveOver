import json
import boto3
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import re
import os
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

def check_clerk_user_exists(email):
    try:
        # Retrieve Clerk secret API key from AWS Parameter Store
        ssm = boto3.client('ssm', region_name='eu-west-1')
        parameter = ssm.get_parameter(Name='clerk-secret-api-key', WithDecryption=True)
        clerk_secret = parameter["Parameter"]["Value"]

        headers = {'Authorization': f'Bearer {clerk_secret}'}
        url = "https://api.clerk.com/v1/users/count"
        params = {"email_address": [email]}  # Note: emailAddress parameter expects an array
        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            count = response.json()
            return count['total_count'] > 0
        else:
            print(f"Error querying Clerk API: {response.status_code} {response.text}")
            return False
    except Exception as e:
        print(f"An error occurred when checking Clerk user: {e}")
        return False

def lambda_handler(event, context):
    if isinstance(event, list) and len(event) > 0 and 'eventName' in event[0]:  # This is a DynamoDB stream event from event pipe
        print(f"DynamoDB stream event triggered", event)
        record = event[0]  # Get the first (and only) record from the list
        if record['eventName'] == 'MODIFY':
            new_image = record['dynamodb']['NewImage']
            user_email = new_image['user_email']['S']
            spouse_email = new_image['spouse_email']['S']
            argument_topic = new_image['argument_topic']['S']
            submission_time = new_image['submission_time']['S']
            last_email_sent = new_image['last_email_sent']['S']
            spouse_accepted = new_image['spouse_accepted']['BOOL']
            argument_finished = new_image['argument_finished']['BOOL']
            
            # Check if both users exist in Clerk
            user_exists = check_clerk_user_exists(user_email)
            spouse_exists = check_clerk_user_exists(spouse_email)
            print(f"check_clerk_user_exists(): User : {user_exists}, spouse: {spouse_exists}")
            
            # If both users exist and spouse just accepted, set up reminder times
            if user_exists and spouse_exists and last_email_sent == 'invite email' and spouse_accepted:
                current_time = datetime.now()
                deadlines = {
                    "reminder_48_hours": (current_time + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "reminder_24_hours": (current_time + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "reminder_12_hours": (current_time + timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "reminder_4_hours": (current_time + timedelta(hours=4)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "final_deadline": (current_time + timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%S")
                }

                argument_key = {
                    'user_email': {'S': user_email},
                    'submission_time': {'S': submission_time}
                }
                
                reminder_time_update_expression = f"SET reminder_time_four_hours = :four_hours, reminder_time_twelve_hours = :twelve_hours, reminder_time_one_days = :one_days, reminder_time_two_days = :two_days, argument_deadline = :final_deadline"
                
                reminder_expression_attribute_values = {
                    ':four_hours': {'S': deadlines['reminder_4_hours']},
                    ':twelve_hours': {'S': deadlines['reminder_12_hours']},
                    ':one_days': {'S': deadlines['reminder_24_hours']},
                    ':two_days': {'S': deadlines['reminder_48_hours']},
                    ':final_deadline': {'S': deadlines['final_deadline']}
                }
                
                reminder_time_updates = update_argument(argument_key, reminder_time_update_expression, reminder_expression_attribute_values)
                print(f"Reminder times updated and set with {reminder_time_updates} for {argument_topic} between {user_email} and {spouse_email}")
                return
    elif 'Event bridge rule' in event and event['Event bridge rule'] == 'Email reminder scheduler':
        print(f"{event['Schedule']} triggered")
        # Define the filter expression
        filter_expression = 'argument_finished = :false_value AND spouse_accepted = :true_value'
        expression_attribute_values = {
            ':false_value': {'BOOL': False},
            ':true_value': {'BOOL': True}
        }
        
        projection_expression = 'user_email, spouse_email, argument_topic, reminder_time_two_days, reminder_time_one_days, reminder_time_twelve_hours, reminder_time_four_hours, argument_deadline, submission_time, argument_finished, last_email_sent, user_response, spouse_response, spouse_accepted'

        response = dynamodb.scan(
            TableName=table,
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ProjectionExpression=projection_expression,
        )

        arguments = response.get('Items', [])
        if len(arguments) > 0:
            print(f"The first 3 active arguments are : {arguments[:3]}")
        else:
            return "No reminders sent due to no active arguments"

        for argument in arguments:
            user_email = argument['user_email']['S']
            spouse_email = argument['spouse_email']['S']
            user_exists = check_clerk_user_exists(user_email)
            spouse_exists = check_clerk_user_exists(spouse_email)
            print(f"check_clerk_user_exists(): User : {user_exists}, spouse: {spouse_exists}")
            spouse_accepted = argument['spouse_accepted']['BOOL']
            submission_time = argument['submission_time']['S']
            addresses = [user_email, spouse_email]
            argument_topic = argument['argument_topic']['S']
            current_time = datetime.now()
            last_email_sent = argument['last_email_sent']['S']

            final_deadline_str = argument['argument_deadline']['S']
            
            if final_deadline_str != '':
                final_deadline = time_to_datetime(final_deadline_str)
            
            # Reminders are set so check which email to send
            elif current_time < final_deadline:
                current_time = datetime.now()
                final_deadline = time_to_datetime(argument['argument_deadline']['S'])
                hours_left = int((final_deadline - current_time).total_seconds() / 3600)
                print(f"Checking for reminders to send, last_email_sent is {last_email_sent} with currently {hours_left} hours left")

                reminder_times = {
                    'two_days': time_to_datetime(argument['reminder_time_two_days']['S']),
                    'one_days': time_to_datetime(argument['reminder_time_one_days']['S']),
                    'twelve_hours': time_to_datetime(argument['reminder_time_twelve_hours']['S']),
                    'four_hours': time_to_datetime(argument['reminder_time_four_hours']['S'])
                }
                
                new_last_email_sent = None
                
                print(f"current time is {current_time}")
                print(f"reminder times: two_days={reminder_times['two_days']}, one_days={reminder_times['one_days']}, twelve_hours={reminder_times['twelve_hours']}, four_hours={reminder_times['four_hours']}")
        
                # Check if we need to send the four_hours reminder (highest priority)
                if current_time > reminder_times['four_hours'] and last_email_sent in ['invite email', 'two days reminder', 'one day reminder', 'twelve hours reminder']:
                    new_last_email_sent = 'four hours reminder'
                    print(f"Sending four hours reminder email. Current time: {current_time}, Reminder time: {reminder_times['four_hours']}")
                # Check if we need to send the twelve_hours reminder
                elif current_time > reminder_times['twelve_hours'] and last_email_sent in ['invite email', 'two days reminder', 'one day reminder']:
                    new_last_email_sent = 'twelve hours reminder'
                    print(f"Sending twelve hours reminder email. Current time: {current_time}, Reminder time: {reminder_times['twelve_hours']}")
                # Check if we need to send the one_days reminder
                elif current_time > reminder_times['one_days'] and last_email_sent in ['invite email', 'two days reminder']:
                    new_last_email_sent = 'one day reminder'
                    print(f"Sending one day reminder email. Current time: {current_time}, Reminder time: {reminder_times['one_days']}")
                # Check if we need to send the two_days reminder
                elif current_time > reminder_times['two_days'] and last_email_sent == 'invite email':
                    new_last_email_sent = 'two days reminder'
                    print(f"Sending two days reminder email. Current time: {current_time}, Reminder time: {reminder_times['two_days']}")
                else:
                    # If none of the conditions are met, you may want to set default values or skip further execution
                    print('No reminder to send')
                    continue  # Skip to the next argument instead of returning

                if new_last_email_sent:
                    key = {
                        'user_email': {'S': user_email},
                        'submission_time': {'S': submission_time}
                    }
                    update_expression = "SET last_email_sent = :val"
                    expression_attribute_values = {
                        ':val': {'S': new_last_email_sent}
                    }
                    subject_reminder = re.sub(r'\sreminder$', '', new_last_email_sent)
                    subject_reminder = subject_reminder[0].upper() + subject_reminder[1:]

                    email_subject = f'Dev end to end test - Reminder for {argument_topic} : {subject_reminder} left in between {user_email} and {spouse_email}'
                    email_body = f'''This is a reminder that you have approximately {hours_left} hours left until responses are exchanged in the discussion between {user_email} and {spouse_email}'''

                    send_email(addresses, email_subject, email_body)
                    last_email_update = update_argument(key, update_expression, expression_attribute_values)
                    print(f"last_email_update happened response is: {last_email_update}")

            # Send final email if deadline is reached and mark argument as finished
            elif current_time > final_deadline:
                #Exchange the responses
                user_response = argument['user_response']['S']
                spouse_response = argument['spouse_response']['S']

                exchange_email_body = f'Here is what {addresses[0]} had to say on {argument_topic}:\n {user_response}'
                exchange_email_subject = f'Dev end to end test - Response from {addresses[0]} for {argument_topic}'

                send_email([addresses[1]], exchange_email_subject, exchange_email_body)

                exchange_email_body = f'Here is what {addresses[1]} had to say on {argument_topic}:\n {spouse_response}'
                exchange_email_subject = f'Dev end to end test - Response from {addresses[1]} for {argument_topic}'

                send_email([addresses[0]], exchange_email_subject, exchange_email_body)
                print('final email deadline sent')
                # Set the argument to finished
                key = {
                    'user_email': {'S': user_email},
                    'submission_time': {'S': submission_time}
                }
                final_deadline_update_expression = "SET argument_finished = :val"
                final_deadline_expression_attribute_values = {
                    ':val': {'BOOL': True}
                }
                argument_finished = update_argument(key, final_deadline_update_expression, final_deadline_expression_attribute_values)
                print(f"argument_finished ? updated with {argument_finished} for {argument_topic} between {user_email} and {spouse_email}")
    else:
        print(f"Unknown event type: {event}")
        return "Unknown event type"

def send_email(addresses, subject, body):
    ses.send_email(
        Source='dev-reminder@waveover.info',
        Destination={'ToAddresses': addresses},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )

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

def time_to_datetime(time_str):
    return datetime.fromisoformat(time_str)

{'Records': [{'eventID': '92c7b36dabc72b1994ccd48dd087e539', 'eventName': 'INSERT', 'eventVersion': '1.1', 'eventSource': 'aws:dynamodb', 
            'awsRegion': 'eu-west-1', 'dynamodb': {'ApproximateCreationDateTime': 1721756260.0, 'Keys': {'user_id': {'S': 'azhar981@gmail.com'}, 'deadline': {'S': '2024-07-23T18:38:38.234681'}}, 'NewImage': {'argument_topic': {'S': 'yer mamy'}, 'user_submission_time': {'S': '2024-07-23T18:38:13.234681'}, 'user_id': {'S': 'azhar981@gmail.com'}, 'spouse_email': {'S': 'azhar981@outlook.com'}, 'deadline': {'S': '2024-07-23T18:38:38.234681'}, 'user_response': {'S': ''}}, 'SequenceNumber': '385212900000000102007886361', 'SizeBytes': 231, 'StreamViewType': 'NEW_AND_OLD_IMAGES'}, 'eventSourceARN': 'arn:aws:dynamodb:eu-west-1:058264329805:table/waveover-dev/stream/2024-07-22T18:51:05.549'}]}

