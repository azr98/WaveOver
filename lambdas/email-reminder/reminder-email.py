import json
import boto3
from datetime import datetime, timedelta
import re
import os
import requests
import psycopg2
from psycopg2.extras import RealDictCursor

# Get Supabase transaction pooler string from Parameter Store
ssm = boto3.client('ssm', region_name='eu-west-1')
supabase_conn_str = ssm.get_parameter(
    Name='/waveover/development/supabase/transactionpooler',
    WithDecryption=True
)['Parameter']['Value']

def get_db_connection():
    return psycopg2.connect(supabase_conn_str, cursor_factory=RealDictCursor)

def check_clerk_user_exists(email):
    try:
        ssm = boto3.client('ssm', region_name='eu-west-1')
        parameter = ssm.get_parameter(Name='clerk-secret-api-key', WithDecryption=True)
        clerk_secret = parameter["Parameter"]["Value"]
        headers = {'Authorization': f'Bearer {clerk_secret}'}
        url = "https://api.clerk.com/v1/users/count"
        params = {"email_address": [email]}
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

def send_email(addresses, subject, body):
    ses = boto3.client('ses', region_name='eu-west-1')
    ses.send_email(
        Source='dev-reminder@waveover.info',
        Destination={'ToAddresses': addresses},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )

def update_argument(key, update_expression, expression_attribute_values, expression_attribute_names=None):
    # key: {'user_email': ..., 'submission_time': ...}
    # update_expression: SQL SET clause string
    # expression_attribute_values: dict of values for SET
    set_clause = update_expression.replace('SET ', '')
    set_fields = [f.strip() for f in set_clause.split(',')]
    set_columns = [f.split('=')[0].strip() for f in set_fields]
    set_values = [expression_attribute_values[k] for k in expression_attribute_values]
    sql = f"UPDATE arguments SET {', '.join([col + ' = %s' for col in set_columns])} WHERE user_email = %s AND submission_time = %s RETURNING *;"
    values = set_values + [key['user_email']['S'], key['submission_time']['S']]
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, values)
            result = cur.fetchone()
            conn.commit()
            return result

def time_to_datetime(time_str):
    return datetime.fromisoformat(time_str)

def lambda_handler(event, context):
    if isinstance(event, list) and len(event) > 0 and 'eventName' in event[0]:
        print(f"DynamoDB stream event triggered", event)
        record = event[0]
        if record['eventName'] == 'MODIFY':
            new_image = record['dynamodb']['NewImage']
            user_email = new_image['user_email']['S']
            spouse_email = new_image['spouse_email']['S']
            argument_topic = new_image['argument_topic']['S']
            submission_time = new_image['submission_time']['S']
            last_email_sent = new_image['last_email_sent']['S']
            spouse_accepted = new_image['spouse_accepted']['BOOL']
            argument_finished = new_image['argument_finished']['BOOL']
            user_exists = check_clerk_user_exists(user_email)
            spouse_exists = check_clerk_user_exists(spouse_email)
            print(f"check_clerk_user_exists(): User : {user_exists}, spouse: {spouse_exists}")
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
                    ':four_hours': deadlines['reminder_4_hours'],
                    ':twelve_hours': deadlines['reminder_12_hours'],
                    ':one_days': deadlines['reminder_24_hours'],
                    ':two_days': deadlines['reminder_48_hours'],
                    ':final_deadline': deadlines['final_deadline']
                }
                reminder_time_updates = update_argument(argument_key, reminder_time_update_expression, reminder_expression_attribute_values)
                print(f"Reminder times updated and set with {reminder_time_updates} for {argument_topic} between {user_email} and {spouse_email}")
                return
    elif 'Event bridge rule' in event and event['Event bridge rule'] == 'Email reminder scheduler':
        print(f"{event['Schedule']} triggered")
        # Query for active arguments
        sql = '''SELECT * FROM arguments WHERE argument_finished = FALSE AND spouse_accepted = TRUE'''
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                arguments = cur.fetchall()
        if len(arguments) > 0:
            print(f"The first 3 active arguments are : {arguments[:3]}")
        else:
            return "No reminders sent due to no active arguments"
        for argument in arguments:
            user_email = argument['user_email']
            spouse_email = argument['spouse_email']
            user_firstname = argument['user_firstname']
            user_lastname = argument['user_lastname']
            spouse_firstname = argument['spouse_firstname']
            spouse_lastname = argument['spouse_lastname']
            user_exists = check_clerk_user_exists(user_email)
            spouse_exists = check_clerk_user_exists(spouse_email)
            spouse_accepted = argument['spouse_accepted']
            submission_time = argument['submission_time'].isoformat() if argument['submission_time'] else ''
            addresses = [user_email, spouse_email]
            argument_topic = argument['argument_topic']
            current_time = datetime.now()
            last_email_sent = argument['last_email_sent'] if argument['last_email_sent'] else 'invite email'
            final_deadline_str = argument['argument_deadline'].isoformat() if argument['argument_deadline'] else ''
            if final_deadline_str != '':
                final_deadline = time_to_datetime(final_deadline_str)
                print(f"current_time is {current_time} and final_deadline is {final_deadline}")
            if current_time > final_deadline:
                user_response = argument['user_response']
                spouse_response = argument['spouse_response']
                exchange_email_body = f'Here is what {addresses[0]} had to say on {argument_topic}:\n {user_response}'
                exchange_email_subject = f'Dev end to end test - Response from {addresses[0]} for {argument_topic}'
                send_email([addresses[1]], exchange_email_subject, exchange_email_body)
                exchange_email_body = f'Here is what {addresses[1]} had to say on {argument_topic}:\n {spouse_response}'
                exchange_email_subject = f'Dev end to end test - Response from {addresses[1]} for {argument_topic}'
                send_email([addresses[0]], exchange_email_subject, exchange_email_body)
                print('final email deadline sent')
                key = {
                    'user_email': {'S': user_email},
                    'submission_time': {'S': submission_time}
                }
                final_deadline_update_expression = "SET argument_finished = :val"
                final_deadline_expression_attribute_values = {
                    ':val': True
                }
                argument_finished = update_argument(key, final_deadline_update_expression, final_deadline_expression_attribute_values)
                print(f"argument_finished ? updated with {argument_finished} for {argument_topic} between {user_email} and {spouse_email}")
            else:
                current_time = datetime.now()
                final_deadline = time_to_datetime(argument['argument_deadline'].isoformat()) if argument['argument_deadline'] else None
                print(f"inside reminder email block")
                hours_left = int((final_deadline - current_time).total_seconds() / 3600) if final_deadline else 0
                print(f"Checking for reminders to send, last_email_sent is {last_email_sent} with currently {hours_left} hours left")
                reminder_times = {
                    'two_days': argument['reminder_time_two_days'],
                    'one_days': argument['reminder_time_one_days'],
                    'twelve_hours': argument['reminder_time_twelve_hours'],
                    'four_hours': argument['reminder_time_four_hours']
                }
                new_last_email_sent = None
                print(f"current time is {current_time}")
                print(f"reminder times: two_days={reminder_times['two_days']}, one_days={reminder_times['one_days']}, twelve_hours={reminder_times['twelve_hours']}, four_hours={reminder_times['four_hours']}")
                if reminder_times['four_hours'] and current_time > reminder_times['four_hours'] and last_email_sent in ['invite email', 'two days reminder', 'one day reminder', 'twelve hours reminder']:
                    new_last_email_sent = 'four hours reminder'
                    print(f"Sending four hours reminder email. Current time: {current_time}, Reminder time: {reminder_times['four_hours']}")
                elif reminder_times['twelve_hours'] and current_time > reminder_times['twelve_hours'] and last_email_sent in ['invite email', 'two days reminder', 'one day reminder']:
                    new_last_email_sent = 'twelve hours reminder'
                    print(f"Sending twelve hours reminder email. Current time: {current_time}, Reminder time: {reminder_times['twelve_hours']}")
                elif reminder_times['one_days'] and current_time > reminder_times['one_days'] and last_email_sent in ['invite email', 'two days reminder']:
                    new_last_email_sent = 'one day reminder'
                    print(f"Sending one day reminder email. Current time: {current_time}, Reminder time: {reminder_times['one_days']}")
                elif reminder_times['two_days'] and current_time > reminder_times['two_days'] and last_email_sent == 'invite email':
                    new_last_email_sent = 'two days reminder'
                    print(f"Sending two days reminder email. Current time: {current_time}, Reminder time: {reminder_times['two_days']}")
                else:
                    print('No reminder to send')
                    continue
                if new_last_email_sent:
                    key = {
                        'user_email': {'S': user_email},
                        'submission_time': {'S': submission_time}
                    }
                    update_expression = "SET last_email_sent = :val"
                    expression_attribute_values = {
                        ':val': new_last_email_sent
                    }
                    subject_reminder = re.sub(r'\\sreminder$', '', new_last_email_sent)
                    subject_reminder = subject_reminder[0].upper() + subject_reminder[1:]
                    email_subject = f'Dev - Discussion reminder for {argument_topic} : {subject_reminder} left'
                    email_body_html = f'''<!DOCTYPE html>
                                <html>
                                <body>
                                <p>Hi {user_firstname} and {spouse_firstname} !</p>
                                <p>There are {hours_left} hours left until responses are exchanged in your discussion about {argument_topic}</p>
                                <p>Get back into by going to dev.waveover.info and click 'Display Current Discussions' -> 'Active' -> and click the discussion.</p>
                                </body>
                                </html>
                                '''
                    send_email(addresses, email_subject, email_body_html)
                    last_email_update = update_argument(key, update_expression, expression_attribute_values)
                    print(f"last_email_update happened response is: {last_email_update}")
    else:
        print(f"Unknown event type: {event}")
        return "Unknown event type"


{'Records': [{'eventID': '92c7b36dabc72b1994ccd48dd087e539', 'eventName': 'INSERT', 'eventVersion': '1.1', 'eventSource': 'aws:dynamodb', 
            'awsRegion': 'eu-west-1', 'dynamodb': {'ApproximateCreationDateTime': 1721756260.0, 'Keys': {'user_id': {'S': 'azhar981@gmail.com'}, 'deadline': {'S': '2024-07-23T18:38:38.234681'}}, 'NewImage': {'argument_topic': {'S': 'yer mamy'}, 'user_submission_time': {'S': '2024-07-23T18:38:13.234681'}, 'user_id': {'S': 'azhar981@gmail.com'}, 'spouse_email': {'S': 'azhar981@outlook.com'}, 'deadline': {'S': '2024-07-23T18:38:38.234681'}, 'user_response': {'S': ''}}, 'SequenceNumber': '385212900000000102007886361', 'SizeBytes': 231, 'StreamViewType': 'NEW_AND_OLD_IMAGES'}, 'eventSourceARN': 'arn:aws:dynamodb:eu-west-1:058264329805:table/waveover-dev/stream/2024-07-22T18:51:05.549'}]}

