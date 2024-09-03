# Dependencies
from flask import Flask, jsonify, request, redirect, url_for , make_response
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError
import datetime
import subprocess
import os
from flask import Response
import logging
import sys
from boto3.dynamodb.conditions import Attr



# Scheduler to handle timed tasks
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
dynamodb = boto3.client('dynamodb')
argument_table = 'WaveOver_Dev'

tables = dynamodb.list_tables()
# Testing connection
if tables:
    print("Connected to DynamoDB! \n The list of tables is:")
    for table in tables['TableNames']:
        print(f"{table} Table")
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

    # Store initial argument entry in DynamoDB
    item={
    'user_email': {'S': data['user_id']},
    'spouse_email': {'S': data['spouse_email']},
    'submission_time': {'S': submission_time.isoformat()},
    'argument_topic': {'S': data['argument_topic']},
    'user_response': {'S': ''},
    'spouse_response': {'S': ''},
    'reminder_time_two_days': {'S': ''},
    'reminder_time_one_days': {'S': ''},
    'reminder_time_twelve_hours': {'S': ''},
    'reminder_time_four_hours': {'S': ''},
    'argument_deadline': {'S': ''},
    'argument_finished': {'BOOL': False},
    'last_email_sent': {'S': ''}
}
    
    
    response = dynamodb.put_item(TableName=argument_table, Item=item)
    print(f"Response from submit_argument route is {response}", file=sys.stderr)
    

    return jsonify({'message': 'Initial argument entry submitted'}), 201

@app.route('/get_active_arguments', methods=['GET'])
def get_active_arguments():
    user_email = request.args.get('user_email')
    print(f"get_active_arguments route has been hit. User email is {user_email}", file=sys.stderr)
    # Define the expression attribute values to only get argument_finishes == False entries
    expression_attribute_values = {
        ':false_value': {'BOOL': False},
         ':user_email': {'S': user_email}
        }

        # Define the projection expression using the placeholder names
    filter_expression = (
        'argument_finished = :false_value AND (user_email = :user_email OR spouse_email = :user_email)'
    )


    projection_expression = 'user_email, spouse_email, argument_topic, reminder_time_two_days, reminder_time_one_days, reminder_time_twelve_hours, reminder_time_four_hours, argument_deadline, submission_time, argument_finished, last_email_sent, user_response, spouse_response'

        # Perform the scan operation
    response = dynamodb.scan(
        TableName=table,
        FilterExpression=filter_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ProjectionExpression=projection_expression
    )

    print(f'Response from scan for argument list is {response}')


    return jsonify(response['Items']), 200


@app.route('/submit_response', methods=['POST'])
def submit_response():
    # data = request.get_json()
    # user_id = data['user_id']
    # response = data['response']

    # # Update the response in the database
    # now = datetime.datetime.now()
    # # item = arguments_table.get_item(Key={'user_id': user_id})
    # # if not item:
    # #     return jsonify({'message': 'Argument not found.'}), 404

    # if 'spouse_response' in item['Item'] and item['Item']['spouse_response']:
    #     # Finalize and schedule email if both responses are in
        
    #     return jsonify({'message': 'Both responses received, final email will be sent.'}), 200

    # # update_expression = 'SET user_response = :resp' if data['is_user'] else 'SET spouse_response = :resp'
    # # arguments_table.update_item(
    # #     Key={'user_id': user_id},
    # #     UpdateExpression=update_expression,
    # #     ExpressionAttributeValues={':resp': response}
    # # )
    return jsonify({'message': 'Response submitted successfully.'}), 200


# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

