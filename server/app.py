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
arguments_table = dynamodb.Table('WaveOver_Dev')

tables = dynamodb.tables.all()
# Testing connection
if tables:
    print("Connected to DynamoDB!")
    for table in tables:
        print(f"The list of tables is {table.table_name}")
else:
    print("No DynamoDB tables found.")

# @app.before_request
# def handle_cors():
#     headers = {
#     'Access-Control-Allow-Origin': '*',  # Adjust for specific origins if needed
#     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
#     'Access-Control-Allow-Headers': 'Content-Type'  # Add other allowed headers as required
#     }

#     if request.method == 'OPTIONS':
#         return jsonify(headers), 200

#     # Create a response object
#     response = make_response("")

#     # Check for Flask version (assuming 2.0 or later for simplicity)
#     if hasattr(response.headers, 'add'):  # Check if 'add' method exists
#         response.headers.add('Access-Control-Allow-Origin',headers['Access-Control-Allow-Origin'])
#         response.headers.add('Access-Control-Allow-Methods',headers['Access-Control-Allow-Methods'])

#     return response  # Return the modified response object

    
@app.route('/submit_argument', methods=['POST'])
def submit_argument():
    data = request.get_json()
    print(f"submit_argument route has been hit. Data is {data}" ,file=sys.stderr)
    app.logger.info('submit arg req', data)
    logging.info('submit arg req', data)
    submission_time = datetime.datetime.now()
    reminders = {'48_hour' : submission_time + datetime.timedelta(seconds=48),
                 '24_hour' : submission_time + datetime.timedelta(seconds=24),
                 '12_hour' : submission_time + datetime.timedelta(seconds=12),
                 '4_hour' : submission_time + datetime.timedelta(seconds=4)
                 }
    deadline = submission_time + datetime.timedelta(seconds=25)  # Change to days=3 for production

    # Store initial argument entry in DynamoDB
    arguments_table.put_item(
        Item={
            'user_email': data['user_id'],
            'spouse_email': data['spouse_email'],
            'submission_time' : submission_time.isoformat(),
            'argument_topic': data['argument_topic'],
            'user_response' : '',
            'spouse_response' : '',
            # For EventBridge to read for emails
            '48_hour_reminder_time' : reminders['48_hour'].isoformat(),
            '24_hour_reminder_time' : reminders['24_hour'].isoformat(),
            '12_hour_reminder_time' : reminders['12_hour'].isoformat(),
            '4_hour_reminder_time' : reminders['4_hour'].isoformat(),
            'argument_deadline' : deadline.isoformat(),
            'argument_finished?' : False
        }
    )

    # response = dynamodb_client.put_item(
#         TableName = 'waveover-dev',
#         Item={
#             'user_id': {'S' : 'boto3_client_put'} ,
#             'spouse_email': {'S' : 'email'} ,
#             'argument_topic': {'S' : 'topic'} ,
#             'user_submission_time' : {'S' : 'Submit time'} ,
#             'deadline': {'S' : 'deadline'} ,
#             'user_response' : {'S' : 'response'} ,
#         }
#     )
    

    return jsonify({'message': 'Initial argument entry submitted'}), 201



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
        
        return jsonify({'message': 'Both responses received, final email will be sent.'}), 200

    update_expression = 'SET user_response = :resp' if data['is_user'] else 'SET spouse_response = :resp'
    arguments_table.update_item(
        Key={'user_id': user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues={':resp': response}
    )
    return jsonify({'message': 'Response submitted successfully.'}), 200


# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

