import json
import boto3
from datetime import datetime, timedelta
import re
import os
import requests
from supabase import create_client, Client

# Get Supabase URL and Service Role Key from environment/SSM
ssm = boto3.client('ssm', region_name='eu-west-1')
SUPABASE_URL = ssm.get_parameter(
    Name='/waveover/development/supabase/project_url',
    WithDecryption=False
)['Parameter']['Value']
SUPABASE_SERVICE_KEY = ssm.get_parameter(
    Name='/waveover/development/supabase/service_role',
    WithDecryption=True
)['Parameter']['Value']

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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
        Source='reminder@waveover.info',
        Destination={'ToAddresses': addresses},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )

def time_to_datetime(time_str):
    return datetime.fromisoformat(time_str)

def lambda_handler(event, context):
    # Check if it's a direct Lambda invocation with spouse acceptance
    if isinstance(event, dict) and event.get('spouse_accepted') is True:
        print(f"Spouse acceptance event triggered:", event)
        user_email = event['user_email']
        submission_time = event['submission_time']

        # SELECT from Supabase
        response = supabase.table("arguments").select("*") \
            .eq("user_email", user_email) \
            .eq("submission_time", submission_time) \
            .single().execute()
        argument = response.data

        if argument:
            spouse_email = argument['spouse_email']
            argument_topic = argument['argument_topic']
            last_email_sent = argument['last_email_sent']
            spouse_accepted = argument['spouse_accepted']
            argument_finished = argument['argument_finished']
            user_exists = check_clerk_user_exists(user_email)
            spouse_exists = check_clerk_user_exists(spouse_email)
            print(f"check_clerk_user_exists(): User: {user_exists}, spouse: {spouse_exists}")

            if user_exists and spouse_exists and not last_email_sent:
                current_time = datetime.now()
                deadlines = {
                    "reminder_48_hours": (current_time + timedelta(hours=24)).isoformat(),
                    "reminder_24_hours": (current_time + timedelta(hours=48)).isoformat(),
                    "reminder_12_hours": (current_time + timedelta(hours=60)).isoformat(),
                    "reminder_4_hours": (current_time + timedelta(hours=38)).isoformat(),
                    "final_deadline": (current_time + timedelta(hours=72)).isoformat()
                }
                # UPDATE in Supabase
                update_data = {
                    "reminder_time_four_hours": deadlines['reminder_4_hours'],
                    "reminder_time_twelve_hours": deadlines['reminder_12_hours'],
                    "reminder_time_one_days": deadlines['reminder_24_hours'],
                    "reminder_time_two_days": deadlines['reminder_48_hours'],
                    "argument_deadline": deadlines['final_deadline'],
                    "last_email_sent": current_time.isoformat()
                }
                update_response = supabase.table("arguments").update(update_data) \
                    .eq("user_email", user_email) \
                    .eq("submission_time", submission_time) \
                    .execute()
                print(f"Reminder times updated and set with {update_response.data} for {argument_topic} between {user_email} and {spouse_email}")

                # Send SES email to just the user
                spouse_firstname = argument.get('spouse_firstname', 'Your spouse')
                email_subject = f"{spouse_firstname} has accepted to discuss {argument_topic}"
                email_body = f"<html><body><p>Hi,</p><p>{spouse_firstname} has accepted to discuss <b>{argument_topic}</b>.</p><p>Head on over to <a href='https://dev.waveover.info'>Waveover</a> to start your discussion! The timer has started you both have 3 days !</p></body></html>"
                send_email([user_email], email_subject, email_body)

                return
    elif 'Event bridge rule' in event and event['Event bridge rule'] == 'Email reminder scheduler':
        print(f"{event['Schedule']} triggered")
        # Query for active arguments. They already have reminder times set.
        sql = '''SELECT * FROM arguments WHERE argument_finished = FALSE AND spouse_accepted = TRUE'''
        with supabase.table("arguments").select("*") \
            .eq("argument_finished", False) \
            .eq("spouse_accepted", True) \
            .execute() as response:
            arguments = response.data
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
                argument_finished = supabase.table("arguments").update({"argument_finished": final_deadline_update_expression}) \
                    .eq("user_email", user_email) \
                    .eq("submission_time", submission_time) \
                    .set({"argument_finished": final_deadline_expression_attribute_values}) \
                    .execute()
                print(f"argument_finished ? updated with {argument_finished.data} for {argument_topic} between {user_email} and {spouse_email}")
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
                    last_email_update = supabase.table("arguments").update({"last_email_sent": update_expression}) \
                        .eq("user_email", user_email) \
                        .eq("submission_time", submission_time) \
                        .set({"last_email_sent": expression_attribute_values}) \
                        .execute()
                    print(f"last_email_update happened response is: {last_email_update.data}")
    else:
        print(f"Unknown event type: {event}")
        return "Unknown event type"


{'Records': [{'eventID': '92c7b36dabc72b1994ccd48dd087e539', 'eventName': 'INSERT', 'eventVersion': '1.1', 'eventSource': 'aws:dynamodb', 
            'awsRegion': 'eu-west-1', 'dynamodb': {'ApproximateCreationDateTime': 1721756260.0, 'Keys': {'user_id': {'S': 'azhar981@gmail.com'}, 'deadline': {'S': '2024-07-23T18:38:38.234681'}}, 'NewImage': {'argument_topic': {'S': 'yer mamy'}, 'user_submission_time': {'S': '2024-07-23T18:38:13.234681'}, 'user_id': {'S': 'azhar981@gmail.com'}, 'spouse_email': {'S': 'azhar981@outlook.com'}, 'deadline': {'S': '2024-07-23T18:38:38.234681'}, 'user_response': {'S': ''}}, 'SequenceNumber': '385212900000000102007886361', 'SizeBytes': 231, 'StreamViewType': 'NEW_AND_OLD_IMAGES'}, 'eventSourceARN': 'arn:aws:dynamodb:eu-west-1:058264329805:table/waveover-dev/stream/2024-07-22T18:51:05.549'}]}

