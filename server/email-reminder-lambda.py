import json
import boto3
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import re



# Initialize clients
dynamodb = boto3.client('dynamodb')
ses = boto3.client('ses', region_name='eu-west-1')
table = 'WaveOver_Dev'

cognito = boto3.client('cognito-idp')
user_pool_id = 'eu-west-1_ENQscGoVL'  # Replace with your Cognito User Pool ID


def lambda_handler(event, context):

    if 'Event bridge rule' in event and event['Event bridge rule'] == 'Email reminder scheduler' :
        # Define the filter expression
        filter_expression = 'argument_finished = :false_value'

        # Define the expression attribute values to only get argument_finishes == False entries
        expression_attribute_values = {
            ':false_value': {'BOOL': False}
            }
        
        # Define the projection expression using the placeholder names
        projection_expression = 'user_email, spouse_email, argument_topic, reminder_time_two_days, reminder_time_one_days, reminder_time_twelve_hours, reminder_time_four_hours, argument_deadline, submission_time, argument_finished, last_email_sent'

        # Get arguments with argument_finished == False and above attributes of them
        response = dynamodb.scan(
            TableName=table,
            FilterExpression=filter_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ProjectionExpression=projection_expression,
        )

        print(f'Response from scan off event bridge rule is {response}')

        arguments = response.get('Items', [])
        if len(arguments) > 0:
            print(f"The first 3 active arguments are : {arguments[:3]}")
        else :
            return"No reminders sent due to no active arguments "

        for argument in arguments:

            user_email = argument['user_email']['S']
            spouse_email = argument['spouse_email']['S']
            user_exists = check_cognito_user_exists(user_email)
            spouse_exists = check_cognito_user_exists(spouse_email)

            submission_time = argument['submission_time']['S']
            addresses = [user_email, spouse_email]
            argument_topic = argument['argument_topic']['S']
            current_time = datetime.now()
            last_email_sent = argument['last_email_sent']['S']
            reminder_time_two_days = argument['reminder_time_two_days']['S']

            final_deadline_str = argument['argument_deadline']['S']
            
            if final_deadline_str != '':
                final_deadline = time_to_datetime(final_deadline_str)
            
            # Check if both users agreed but reminders times are not set yet
            if user_exists and spouse_exists and last_email_sent == 'invite email' and reminder_time_two_days == '':
            
                email_body = f''''''
                deadlines = {
                    "reminder_4_hours": (current_time + timedelta(hours=68)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "reminder_12_hours": (current_time + timedelta(hours=60)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "reminder_24_hours": (current_time + timedelta(hours=48)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "reminder_48_hours": (current_time + timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%S"),
                    "final_deadline": (current_time + timedelta(hours=72)).strftime("%Y-%m-%dT%H:%M:%S")
                }


                argument_key={
                        'user_email': {'S': user_email},  # Correctly specifying as a string
                        'submission_time': {'S': submission_time}  # Correctly specifying as a string
                    }
                
                reminder_time_update_expression=f"SET reminder_time_four_hours = :four_hours, reminder_time_twelve_hours = :twelve_hours, reminder_time_one_days = :one_days, reminder_time_two_days = :two_days, argument_deadline = :final_deadline"
                
                # Map values to calculated times
                reminder_expression_attribute_values = {
                    ':four_hours': {'S': deadlines['reminder_4_hours']},
                    ':twelve_hours': {'S': deadlines['reminder_12_hours']},
                    ':one_days': {'S': deadlines['reminder_24_hours']},
                    ':two_days': {'S': deadlines['reminder_48_hours']},
                    ':final_deadline': {'S': deadlines['final_deadline']}
                }
                
                reminder_time_updates = update_argument(argument_key, reminder_time_update_expression, reminder_expression_attribute_values)
                print(f"Reminder times updated and set with {reminder_time_updates} for {argument_topic} between {user_email} and {spouse_email}")

            # Send final email if deadline is reached and mark argument as finished
            elif current_time > final_deadline:
                        #Exchange the responses
                        user_response = argument['user_response']['S']
                        spouse_response = argument['spouse_response']['S']

                        exchange_email_body = f'Here is what {addresses[0]} had to say on {argument_topic}:\n {user_response}'
                        exchange_email_subject = f'Response from {addresses[0]} for {argument_topic}'

                        send_email([addresses[1]], exchange_email_subject, exchange_email_body)

                        exchange_email_body = f'Here is what {addresses[1]} had to say on {argument_topic}:\n {spouse_response}'
                        exchange_email_subject = f'Response from {addresses[1]} for {argument_topic}'

                        send_email([addresses[0]], exchange_email_subject, exchange_email_body)
                        print('final email deadline sent')
                        # Set the argument to finished
                        key={
                                'user_email': {'S': user_email},  # Correctly specifying as a string
                                'submission_time': {'S': submission_time}  # Correctly specifying as a string
                            }
                        final_deadline_update_expression="SET argument_finished = :val"
                        final_deadline_expression_attribute_values={
                                ':val': {'BOOL': True}  # Correctly specifying as a boolean
                            }
                        arugment_finished = update_argument(key, final_deadline_update_expression,final_deadline_expression_attribute_values)
                        print(f"argument_finished ? updated with {arugment_finished} for {argument_topic} between {user_email} and {spouse_email}")
            
            # Reminders are set so check which email to send
            elif current_time < final_deadline :
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
      
                if current_time > reminder_times['two_days'] and last_email_sent == 'invite email':
                    new_last_email_sent = 'two days reminder'
                elif current_time > reminder_times['one_days'] and last_email_sent == 'two days reminder':
                    new_last_email_sent = 'one day reminder'
                elif current_time > reminder_times['twelve_hours'] and last_email_sent == 'one day reminder':
                    new_last_email_sent = 'twelve hours reminder'
                elif current_time > reminder_times['four_hours'] and last_email_sent == 'twelve hours reminder':
                    new_last_email_sent = 'four hours reminder'
                else:
                    # If none of the conditions are met, you may want to set default values or skip further execution
                    print('No reminder to send')
                    return
                key = {
                    'user_email': {'S': user_email},
                    'submission_time': {'S': submission_time}
                }
                update_expression = "SET last_email_sent = :val"
                expression_attribute_values = {
                        ':val': {'S': new_last_email_sent}
                    }
                subject_reminder =  re.sub(r'\sreminder$', '', new_last_email_sent)
                subject_reminder = subject_reminder[0].upper() + subject_reminder[1:]

                email_subject = f'Reminder for {argument_topic} : {subject_reminder} left in between {user_email} and {spouse_email}'
                email_body = f'''This is a reminder that you have approximately {hours_left} hours left until responses are exchanged in the discussion between {user_email} and {spouse_email}'''

                send_email(addresses, email_subject, email_body)
                last_email_update = update_argument(key, update_expression, expression_attribute_values)
                print(f"last_email_update happened response is: {last_email_update}")
                return


def send_email(addresses, subject , body):
    
    ses.send_email(
        Source='dev@waveover.info',
        Destination={'ToAddresses': addresses},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )

def check_cognito_user_exists(email):
    try:
        response = cognito.list_users(
            UserPoolId=user_pool_id,
            Filter=f'email = "{email}"'
        )
        print(f"User exists with email {email}")
        return True
    except cognito.exceptions.UserNotFoundException:
        return False
    except ClientError as e:
        print(f"An error occurred: {e}")
        return False
    
def update_argument(key, update_expression, expression_attribute_values,expression_attribute_names = None):
    # Construct the base parameters
    update_params = {
        'TableName': table,
        'Key': key,
        'UpdateExpression': update_expression,
        'ExpressionAttributeValues': expression_attribute_values,
        'ReturnValues' : 'UPDATED_NEW'
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

