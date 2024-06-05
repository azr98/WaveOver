# Dependencies
from flask import Flask, jsonify, request, redirect, url_for , make_response
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError
import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
from dotenv import load_dotenv
import os
from flask import Response
import logging
import sys



# Scheduler to handle timed tasks
scheduler = BackgroundScheduler()
logging.basicConfig(format = '%(levelname)s:%(name)s:%(message)s', datefmt="%d-%m %H:%M:%S",level=logging.DEBUG,filename= 'logs.log')
# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure Flask logging
# app.logger.setLevel(logging.INFO)  # Set log level to INFO
# handler = logging.FileHandler('app.log')  # Log to a file
# app.logger.addHandler(handler)

# AWS SDK Boto3 clients
cognito = boto3.client('cognito-idp', region_name='eu-west-1')
ses = boto3.client('ses', region_name='eu-west-1')
dynamodb = boto3.resource('dynamodb')
arguments_table = dynamodb.Table('waveover-dev')

tables = dynamodb.tables.all()
# Testing connection
if tables:
    print("Connected to DynamoDB!")
    for table in tables:
        print(f"The list of tables is {table.table_name}")
else:
    print("No DynamoDB tables found.")

@app.before_request
def handle_cors():
    headers = {
    'Access-Control-Allow-Origin': '*',  # Adjust for specific origins if needed
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'  # Add other allowed headers as required
    }

    if request.method == 'OPTIONS':
        return jsonify(headers), 200

    # Create a response object
    response = make_response("")

    # Check for Flask version (assuming 2.0 or later for simplicity)
    if hasattr(response.headers, 'add'):  # Check if 'add' method exists
        response.headers.add('Access-Control-Allow-Origin',headers['Access-Control-Allow-Origin'])
        response.headers.add('Access-Control-Allow-Methods',headers['Access-Control-Allow-Methods'])

    return response  # Return the modified response object

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


def send_initial_email(user_id, spouse_email,argument_topic):
    # [] Remove user_is assignment below once cognito is setup for dynamic user_id value
    user_id = 'Azhar'
    spouse_email = 'azhar981@outlook.com'
    email_body = f"{user_id} want's to talk about {argument_topic}\n To start , click this link to quickly sign up or login and get your voice through to them"
    ses.send_email(
        Source='dev@waveover.info',
        # [] Change dest to dynamic spouse_email
        Destination={'ToAddresses': [spouse_email]},
        Message={
            'Subject': {'Data': f"Let's talk about {argument_topic}"},
            'Body': {'Html': {'Data': email_body}}
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

    
@app.route('/submit_argument', methods=['POST'])
def submit_argument():
    data = request.get_json()
    print(data, flush=True)
    app.logger.info('submit arg req', data)
    logging.info('submit arg req', data)
    submission_time = datetime.datetime.now()
    deadline = submission_time + datetime.timedelta(seconds=25)  # Change to days=3 for production

    # Store initial argument entry in DynamoDB
    arguments_table.put_item(
        Item={
            'user_id': data['user_id'],
            'spouse_email': data['spouse_email'],
            'argument_topic': data['argument_topic'],
            'user_submission_time' : submission_time.isoformat(),
            'deadline': deadline.isoformat(),
            'user_response' : ''
        }
    )
     
    send_initial_email(data['user_id'], data['spouse_email'], data['argument_topic'])

    return jsonify({'message': 'Initial argument entry submitted'}), 201

# [] move scheduler to start after spouse has logged in or created account 
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

@app.route('/shutdown', methods=['GET'])
def shutdown():
    scheduler.shutdown()
    return 'Scheduler shut down'

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

