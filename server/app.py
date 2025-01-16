# Dependencies
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
import pytz
import os
from flask import Response
import logging
import sys
from boto3.dynamodb.conditions import Attr
import traceback

# Scheduler to handle timed tasks
logging.basicConfig(format = '%(levelname)s:%(name)s:%(message)s', datefmt="%d-%m %H:%M:%S",level=logging.DEBUG,filename= 'logs.log')
# Initialize Flask app
app = Flask(__name__)
CORS(app)  # This will handle CORS for all routes


# Configure Flask logging
# app.logger.setLevel(logging.INFO)  # Set log level to INFO
# handler = logging.FileHandler('app.log')  # Log to a file
# app.logger.addHandler(handler)

# AWS SDK Boto3 clients
cognito = boto3.client('cognito-idp', region_name='eu-west-1')
ses = boto3.client('ses', region_name='eu-west-1')
dynamodb = boto3.client('dynamodb',region_name='eu-west-1')
argument_table = 'WaveOver_Dev'
user_pool_id = 'eu-west-1_ENQscGoVL'

tables = dynamodb.list_tables()
# Testing connection
if tables:
    print("Connected to DynamoDB! \n The list of tables is:")
    for table in tables['TableNames']:
        print(f"{table} Table")
else:
    print("No DynamoDB tables found.")

def update_argument(key, update_expression, expression_attribute_values,expression_attribute_names = None):
    # Construct the base parameters
    update_params = {
        'TableName': argument_table,
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
        
# @app.after_request
# def after_request(response):
#     response.headers.add('Access-Control-Allow-Origin', '*')
#     response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#     response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
#     return response

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
    # print(f"submit_argument route has been hit. Data is {data}" ,file=sys.stderr)
    app.logger.info('submit arg req', data)
    logging.info('submit arg req', data)
    submission_time = datetime.now(pytz.utc)
    # submission_time = datetime.now()
    submission_time = submission_time.strftime("%Y-%m-%dT%H:%M:%S")

    # Store initial argument entry in DynamoDB
    item={
    'user_email': {'S': data['user_email']},
    'spouse_email': {'S': data['spouse_email']},
    'submission_time': {'S': submission_time},
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
    # print(f"Response from submit_argument route is {response}", file=sys.stderr)
    

    return jsonify({'message': 'Initial argument entry submitted'}), 201

@app.route('/get_active_arguments', methods=['GET'])
def get_active_arguments():
    user_email = request.args.get('user_email')
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
        TableName=argument_table,
        FilterExpression=filter_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ProjectionExpression=projection_expression
    )

    arguments = []

    for argument in response['Items']:
        user_email = argument['user_email']['S']
        spouse_email = argument['spouse_email']['S']

        if check_cognito_user_exists(user_email) and check_cognito_user_exists(spouse_email):
            arguments.append(argument)

    print(f'get_active_arguments response from scan for arg list: {response}')


    return jsonify(arguments), 200


@app.route('/save_content', methods=['POST'])
def save_content():
    try:
        data = request.get_json()
        # print(f"save_content route has been hit. Data is {data}", file=sys.stderr)
        submission_time = data['argument']['submission_time']


        
        argument_topic = data['argument']['argument_topic']
        argument_user_email = data['argument']['user_email']
        argument_spouse_email = data['argument']['spouse_email']
        content = data['content']
        cognito_user_email = data['userEmail']
        
        # Determine which field to update based on the user's email
        if cognito_user_email == argument_user_email:
            update_expression = 'SET user_response = :content'
        elif cognito_user_email == argument_spouse_email:
            update_expression = 'SET spouse_response = :content'
        else:
            return jsonify({'error': 'User not authorized to update this argument'}), 403

        # Construct the key based on the table's key schema
        key ={
            'user_email': {'S': argument_user_email},
            'submission_time': {'S': submission_time}
        }
        save_content_expression_attribute_value = {':content': {'S': content}}

        # Log the key and update expression for debugging
        app.logger.info(f"Updating item with key: {key}")
        app.logger.info(f"Update expression: {update_expression}")
        app.logger.info(f"Expression attribute values: {save_content_expression_attribute_value}")

        # Update the item
        update_response = update_argument(key, update_expression, save_content_expression_attribute_value)
        # print(f"DynamoDB save_content response: {update_response}")            
        
        app.logger.info(f"DynamoDB save_content response: {update_response}")

        return jsonify({'message': 'Content updated successfully'}), 200

    except ClientError as e:
        print(f"DynamoDB operation failed: {str(e)}",file=sys.stderr)
        return jsonify({'error': 'Database operation failed', 'details': str(e)}), 500
    # except Exception as e:
    #     app.logger.error(f"An unexpected error occurred: {str(e)}")
    #     app.logger.error(traceback.format_exc())
    #     return jsonify({'error': 'An unexpected error occurred', 'details': str(e), 'traceback': traceback.format_exc()}), 500


@app.route('/get_argument', methods=['GET'])
def get_argument():
    try:
        argument_topic = request.args.get('argument_topic')
        submission_time = request.args.get('submission_time')

        if not argument_topic or not submission_time:
            return jsonify({'error': 'Both argument_topic and submission_time are required'}), 400

        response = table.get_item(
            Key={
                'argument_topic': argument_topic,
                'submission_time': submission_time
            }
        )

        if 'Item' not in response:
            return jsonify({'error': 'Argument not found'}), 404

        return jsonify(response['Item']), 200

    except ClientError as e:
        app.logger.error(f"Database operation failed: {str(e)}")
        return jsonify({'error': 'Database operation failed'}), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500
    
@app.route('/check-users', methods=['GET'])
def check_users():
    user_email = request.args.get('user_email')
    spouse_email = request.args.get('spouse_email')

    try:
        user_exists = check_cognito_user_exists(user_email)
        spouse_exists = check_cognito_user_exists( spouse_email)
        
        return jsonify({'usersExist': user_exists and spouse_exists})
    except Exception as e:
        print(f"Error checking users: {str(e)}")
        return jsonify({'error': 'Error checking users'}), 500



# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

