import json
import boto3
from datetime import datetime, timedelta, timezone
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
        Source='noreply@waveover.info',
        Destination={'ToAddresses': addresses},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )

def time_to_datetime(time_str):
    # Parse ISO string as UTC
    dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt

def lambda_handler(event, context):
    # Check if it's a direct Lambda invocation with spouse acceptance
    if isinstance(event, dict) and event.get('spouse_accepted') is True:
        print(f"Spouse acceptance event triggered:", event)
        user_email = event['user_email']
        submission_time = event['submission_time']

        # SELECT from Supabase
        response = supabase.table("arguments_production").select("*") \
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

            if user_exists and spouse_exists and last_email_sent == 'invite email':
                current_time = datetime.now(timezone.utc)
                deadlines = {
                    "reminder_48_hours": (current_time + timedelta(hours=24)).isoformat(),
                    "reminder_24_hours": (current_time + timedelta(hours=48)).isoformat(),
                    "reminder_12_hours": (current_time + timedelta(hours=60)).isoformat(),
                    "reminder_4_hours": (current_time + timedelta(hours=68)).isoformat(),
                    "final_deadline": (current_time + timedelta(hours=72)).isoformat()
                }
                # UPDATE in Supabase
                update_data = {
                    "reminder_time_four_hours": deadlines['reminder_4_hours'],
                    "reminder_time_twelve_hours": deadlines['reminder_12_hours'],
                    "reminder_time_one_days": deadlines['reminder_24_hours'],
                    "reminder_time_two_days": deadlines['reminder_48_hours'],
                    "argument_deadline": deadlines['final_deadline'],
                }
                update_response = supabase.table("arguments_production").update(update_data) \
                    .eq("user_email", user_email) \
                    .eq("submission_time", submission_time) \
                    .execute()
                print(f"Reminder times updated and set with {update_data} for {argument_topic} between {user_email} and {spouse_email}")
                
                # Send acceptance email to user_email
                user_firstname = argument.get('user_firstname', '')
                spouse_firstname = argument.get('spouse_firstname', '')
                email_subject = f"{spouse_firstname} accepted discucssion on '{argument_topic}'!"
                email_body = f"""
                <html>
                <body>
                <p>Hi {user_firstname},</p>
                <p>Your partner <b>{spouse_firstname}</b> has accepted your invitation to discuss "{argument_topic}" on WaveOver.</p>
                <p>The 3-day timer has now begun. Don't worry WaveOver will send you email reminders 2 days, 1 days, 12 and 4 hour before this deadline.</p>
                <p>Visit <a href='https://waveover.me'>WaveOver</a> to start writing!</p>
                </body>
                </html>
                """
                send_email([user_email], email_subject, email_body)
                print(f"[ACCEPTANCE EMAIL] Email sent successfully to {user_email}")
 
                return
    elif 'Event bridge rule' in event and event['Event bridge rule'] == 'Email reminder scheduler':
        print(f"{event['Schedule']} triggered")
        # Query for active arguments. They already have reminder times set.
        response = supabase.table("arguments_production").select("*") \
            .eq("argument_finished", False) \
            .eq("spouse_accepted", True) \
            .execute()
        arguments = response.data
        if len(arguments) > 0:
            print(f"The first 3 active arguments are : {arguments[:3]}")
        else:
            return "No reminders sent due to no active arguments"
        for argument in arguments:
            user_email = argument['user_email']
            spouse_email = argument['spouse_email']
            user_firstname = argument['user_firstname'].capitalize()
            user_lastname = argument['user_lastname'].capitalize()
            spouse_firstname = argument['spouse_firstname'].capitalize()
            spouse_lastname = argument['spouse_lastname'].capitalize()
            user_exists = check_clerk_user_exists(user_email)
            spouse_exists = check_clerk_user_exists(spouse_email)
            spouse_accepted = argument['spouse_accepted']
            submission_time = argument['submission_time']
            addresses = [user_email, spouse_email]
            argument_topic = argument['argument_topic']
            current_time = datetime.now(timezone.utc)
            last_email_sent = argument['last_email_sent'] if argument['last_email_sent'] else 'invite email'
            final_deadline = time_to_datetime(argument['argument_deadline']) if argument['argument_deadline'] else None
            if final_deadline and final_deadline.tzinfo is None:
                final_deadline = final_deadline.replace(tzinfo=timezone.utc)
            # Send final email if the deadline has passed
            if spouse_accepted and current_time > final_deadline:
                user_response = argument['user_response']
                spouse_response = argument['spouse_response']
                exchange_email_body = f'''
                <!DOCTYPE html>
                    <html>
                    <body>
                    <p>Hi {spouse_firstname}!,</p>
                    <p>I hope this process has helped you. Here is what {user_firstname} had to say on {argument_topic}. Don't worry you can always view this and what you wrote in the WaveOver dashboard 'Finished' tab: </p>
                    <p>{user_response}</p>
                    </body>
                    </html>
                '''
                exchange_email_subject = f'WaveOver - \'{argument_topic}\' with {user_firstname} is finished!'
                send_email([addresses[1]], exchange_email_subject, exchange_email_body)
                exchange_email_body = f'''
                <!DOCTYPE html>
                    <html>
                    <body>
                    <p>Hi {user_firstname}!,</p>
                    <p>I hope this process has helped you. Here is what {spouse_firstname} had to say on {argument_topic}. Don't worry you can always view this and what you wrote in the WaveOver dashboard 'Finished' tab: </p>
                    <p>{spouse_response}</p>
                    </body>
                    </html>
                '''
                exchange_email_subject = f'WaveOver -\'{argument_topic}\' with {spouse_firstname} is finished!'
                send_email([addresses[0]], exchange_email_subject, exchange_email_body)
                print('final email deadline sent')
                # Set argument_finished to True in Supabase
                argument_finished_update = supabase.table("arguments_production").update({"argument_finished": True}) \
                    .eq("user_email", user_email) \
                    .eq("submission_time", submission_time) \
                    .execute()
                print(f"argument_finished updated with {argument_finished_update.data} for {argument_topic} between {user_email} and {spouse_email}")
            else:
                # Send reminder emails if the deadline has not passed
                current_time = datetime.now(timezone.utc)
                final_deadline = time_to_datetime(argument['argument_deadline']) if argument['argument_deadline'] else None
                if final_deadline and final_deadline.tzinfo is None:
                    final_deadline = final_deadline.replace(tzinfo=timezone.utc)
                hours_left = int((final_deadline - current_time).total_seconds() / 3600) if final_deadline else 0
                print(f"Checking for reminders to send, last_email_sent is {last_email_sent} with currently {hours_left} hours left")
                reminder_times = {
                    'two_days': time_to_datetime(argument['reminder_time_two_days']) if argument['reminder_time_two_days'] else None,
                    'one_days': time_to_datetime(argument['reminder_time_one_days']) if argument['reminder_time_one_days'] else None,
                    'twelve_hours': time_to_datetime(argument['reminder_time_twelve_hours']) if argument['reminder_time_twelve_hours'] else None,
                    'four_hours': time_to_datetime(argument['reminder_time_four_hours']) if argument['reminder_time_four_hours'] else None
                }
                new_last_email_sent = None
                print(f"current time is {current_time}")
                print(f"reminder times: two_days={reminder_times['two_days']}, one_days={reminder_times['one_days']}, twelve_hours={reminder_times['twelve_hours']}, four_hours={reminder_times['four_hours']}")
                if reminder_times['four_hours'] and current_time > reminder_times['four_hours'] and last_email_sent in ['invite email', '2 days reminder', '1 day reminder', '12 hours reminder']:
                    new_last_email_sent = '4 hours reminder'
                    print(f"Sending four hours reminder email. Current time: {current_time}, Reminder time: {reminder_times['four_hours']}")
                elif reminder_times['twelve_hours'] and current_time > reminder_times['twelve_hours'] and last_email_sent in ['invite email', '2 days reminder', '1 day reminder']:
                    new_last_email_sent = '12 hours reminder'
                    print(f"Sending twelve hours reminder email. Current time: {current_time}, Reminder time: {reminder_times['twelve_hours']}")
                elif reminder_times['one_days'] and current_time > reminder_times['one_days'] and last_email_sent in ['invite email', '2 days reminder']:
                    new_last_email_sent = '1 day reminder'
                    print(f"Sending one day reminder email. Current time: {current_time}, Reminder time: {reminder_times['one_days']}")
                elif reminder_times['two_days'] and current_time > reminder_times['two_days'] and last_email_sent == 'invite email':
                    new_last_email_sent = '2 days reminder'
                    print(f"Sending two days reminder email. Current time: {current_time}, Reminder time: {reminder_times['two_days']}")
                else:
                    print('No reminder to send')
                    continue
                if new_last_email_sent:
                    last_email_update = supabase.table("arguments_production").update({"last_email_sent": new_last_email_sent}) \
                        .eq("user_email", user_email) \
                        .eq("submission_time", submission_time) \
                        .execute()
                    print(f"last_email_update happened response is: {last_email_update.data}")
                    subject_reminder = new_last_email_sent.removesuffix(' reminder')
                    email_subject = f'WaveOver {subject_reminder} left for {argument_topic}'
                    email_body_html = f'''<!DOCTYPE html>
                                <html>
                                <body>
                                <p>Hi!,</p>
                                <p>There are {hours_left} hours left until responses are exchanged in your discussion about {argument_topic}.</p>
                                <p>You can get back to your discussion by going to waveover.me and and click the discussion in the 'Active' tab.</p>
                                <p>Thanks for using WaveOver!</p>
                                <p>Azhar Sharif, creator of WaveOver</p>
                                </body>
                                </html>
                                '''
                    send_email(addresses, email_subject, email_body_html)
                    last_email_update = supabase.table("arguments_production").update({"last_email_sent": new_last_email_sent}) \
                        .eq("user_email", user_email) \
                        .eq("submission_time", submission_time) \
                        .execute()
                    print(f"last_email_update happened response is: {last_email_update.data}")
    else:
        print(f"Unknown event type: {event}")
        return "Unknown event type"

