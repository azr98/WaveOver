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

@app.route('/shutdown', methods=['GET'])
def shutdown():
    scheduler.shutdown()
    return 'Scheduler shut down'

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

