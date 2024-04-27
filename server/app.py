# Dependencies
from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError
import datetime
from apscheduler.schedulers.background import BackgroundScheduler

# Scheduler to handle timed tasks
scheduler = BackgroundScheduler()
# Initialize Flask app
app = Flask(__name__)
CORS(app)

# AWS SDK clients
cognito = boto3.client('cognito-idp', region_name='eu-west-1')
dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
ses = boto3.client('ses', region_name='eu-west-1')

# DynamoDB table
arguments_table = dynamodb.Table('Arguments')

def schedule_email(when, recipient_email, email_data, template):
    # Logic to send email at a scheduled time
    ses.send_email(
        Source='your-email@example.com',
        Destination={'ToAddresses': [recipient_email]},
        Message={
            'Subject': {'Data': email_data['subject']},
            'Body': {'Html': {'Data': template.format(**email_data)}}
        }
    )

def send_final_email(user_id, spouse_email, user_response, spouse_response):
    email_body = f"Time is up! Here's what you both wanted to say:\n\nUser: {user_response}\nSpouse: {spouse_response}"
    ses.send_email(
        Source='your-email@example.com',
        Destination={'ToAddresses': [spouse_email]},
        Message={
            'Subject': {'Data': 'Argument Period Ended'},
            'Body': {'Html': {'Data': email_body}}
        }
    )

# Registration endpoint
@app.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        response = cognito.sign_up(
            ClientId='your_cognito_client_id',
            Username=data['email'],
            Password=data['password'],
            UserAttributes=[
                {'Name': 'email', 'Value': data['email']},
                {'Name': 'custom:firstName', 'Value': data['firstName']},
                {'Name': 'custom:spouseEmail', 'Value': data['spouseEmail']}
            ]
        )
        return jsonify({'message': 'Please check your email to confirm your account.'}), 201
    except ClientError as e:
        return jsonify({'error': str(e)}), 400

# Login endpoint
@app.route('/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        response = cognito.initiate_auth(
            ClientId='your_cognito_client_id',
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': data['email'],
                'PASSWORD': data['password']
            }
        )
        return jsonify({'token': response['AuthenticationResult']['IdToken']}), 200
    except ClientError as e:
        return jsonify({'error': str(e)}), 400
    
@app.route('/submit_argument', methods=['POST'])
def submit_argument():
    data = request.get_json()
    submission_time = datetime.datetime.now()
    deadline = submission_time + datetime.timedelta(seconds=25)  # Change to days=3 for production

    # Store argument in DynamoDB
    arguments_table.put_item(
        Item={
            'user_id': data['user_id'],
            'spouse_email': data['spouse_email'],
            'argument_topic': data['argument_topic'],
            'user_response': data['user_response'],
            'spouse_response': '',  # Initially empty
            'deadline': deadline.isoformat()
        }
    )

    # Schedule email to be sent after deadline
    scheduler.add_job(
        func=send_final_email,
        trigger='date',
        run_date=deadline,
        args=[data['user_id'], data['spouse_email'], data['user_response'], data['spouse_response']]
    )

    return jsonify({'message': 'Argument submitted and reminder scheduled'}), 201

# Start the scheduler
scheduler.start()

@app.route('/start_responses', methods=['POST'])
def start_responses():
    data = request.get_json()
    # Get the current time and set the deadline
    start_time = datetime.datetime.now()
    deadline = start_time + datetime.timedelta(seconds=25)  # For testing, change to days=3 for production

    # Update the deadline and status in the database
    arguments_table.update_item(
        Key={'user_id': data['user_id']},
        UpdateExpression='SET deadline = :val1, status = :val2',
        ExpressionAttributeValues={
            ':val1': deadline.isoformat(),
            ':val2': 'active'
        }
    )

    return jsonify({'message': 'Both users can now write their responses.', 'deadline': deadline.isoformat()}), 200

@app.route('/submit_response', methods=['POST'])
def submit_response():
    data = request.get_json()
    user_id = data['user_id']
    response = data['response']

    # Update the response in the database
    now = datetime.datetime.now()
    item = arguments_table.get_item(Key={'user_id': user_id})
    if not item:
        return jsonify({'message': 'Argument not found.'}), 404

    if 'spouse_response' in item['Item'] and item['Item']['spouse_response']:
        # Finalize and schedule email if both responses are in
        schedule_final_email(item['Item'])
        return jsonify({'message': 'Both responses received, final email will be sent.'}), 200

    update_expression = 'SET user_response = :resp' if data['is_user'] else 'SET spouse_response = :resp'
    arguments_table.update_item(
        Key={'user_id': user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues={':resp': response}
    )
    return jsonify({'message': 'Response submitted successfully.'}), 200

def schedule_final_email(item):
    email_subject = "Final Responses for Your Argument"
    email_body = f"Here's what you both said:\nUser: {item['user_response']}\nSpouse: {item['spouse_response']}"

    # Schedule the email
    scheduler.add_job(
        send_email,
        'date',
        run_date=datetime.datetime.now() + datetime.timedelta(seconds=10),  # Immediate send for demonstration
        args=[item['spouse_email'], email_subject, email_body]
    )

def send_email(to_address, subject, body):
    ses.send_email(
        Source='waveover.info',
        Destination={'ToAddresses': [to_address]},
        Message={
            'Subject': {'Data': subject},
            'Body': {'Html': {'Data': body}}
        }
    )

scheduler.start()

@app.route('/shutdown', methods=['GET'])
def shutdown():
    scheduler.shutdown()
    return 'Scheduler shut down'

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

