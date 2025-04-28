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
import requests
import time
from botocore.exceptions import ConnectTimeoutError
from botocore.config import Config
import json
from logging.handlers import RotatingFileHandler


# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://dev.waveover.info"}})


# Configure Flask logging
if not os.path.exists('/var/log/waveover'):
    os.makedirs('/var/log/waveover')

file_handler = RotatingFileHandler('/var/log/waveover/flask.log', maxBytes=10*1024*1024, backupCount=5)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.INFO)
stream_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

app.logger.addHandler(file_handler)
app.logger.addHandler(stream_handler)
app.logger.setLevel(logging.INFO)

# AWS SDK Boto3 clients
ses = boto3.client('ses', region_name='eu-west-1')
dynamodb = boto3.client(
    'dynamodb',
    region_name='eu-west-1',
    config=Config(connect_timeout=120, read_timeout=120, retries={'max_attempts': 5})
)
argument_table = 'WaveOver_Dev'
s3_client = boto3.client("s3")
sns_client = boto3.client("sns", region_name='eu-west-1')

max_attempts = 5
for attempt in range(max_attempts):
    try:
        tables = dynamodb.list_tables()
        if tables:
            print("Connected to DynamoDB! \n The list of tables is:")
            for table in tables['TableNames']:
                print(f"{table} Table")
        else:
            print("No DynamoDB tables found.")
        break
    except ConnectTimeoutError as e:
        app.logger.warning(f"Attempt {attempt + 1} failed: {e}")
        if attempt < max_attempts - 1:
            time.sleep(2 ** attempt)  # Exponential backoff
        else:
            app.logger.error("Failed to connect to DynamoDB after all attempts")
            raise

# AWS target group health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200


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

def check_clerk_user_exists(email):
    try:
        # Retrieve Clerk secret API key from AWS Parameter Store
        ssm = boto3.client('ssm', region_name='eu-west-1')
        parameter = ssm.get_parameter(Name='clerk-secret-api-key', WithDecryption=True)
        clerk_secret = parameter["Parameter"]["Value"]

        headers = {'Authorization': f'Bearer {clerk_secret}'}
        url = "https://api.clerk.com/v1/users/count"
        params = {"email_address": [email]}  # Note: emailAddress parameter expects an array
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

# @app.after_request
# def after_request(response):
#     response.headers["Access-Control-Allow-Origin"] = "https://dev.waveover.info"  # Ensure only one allowed origin
#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
#     response.headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization"
#     response.headers["Access-Control-Allow-Credentials"] = "true"
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


@app.before_request
def log_request_info():
    app.logger.info('Headers: %s', request.headers)
    app.logger.info('URL: %s', request.url)
    app.logger.info('Path: %s', request.path)
    app.logger.info('Method: %s', request.method)




@app.route('/submit_argument', methods=['POST'])
def submit_argument():
    data = request.get_json()
    app.logger.info('submit arg req', data)
    logging.info('submit arg req', data)
    submission_time = datetime.now(pytz.utc)
    submission_time = submission_time.strftime("%Y-%m-%dT%H:%M:%S")

    # Capitalize first and last names
    user_firstname = data['user_firstname'].strip().capitalize()
    user_lastname = data['user_lastname'].strip().capitalize()
    spouse_firstname = data['spouse_firstname'].strip().capitalize()
    spouse_lastname = data['spouse_lastname'].strip().capitalize()

    # Store initial argument entry in DynamoDB
    item={
    'user_email': {'S': data['user_email']},
    'user_firstname': {'S': user_firstname},
    'user_lastname': {'S': user_lastname},
    'spouse_email': {'S': data['spouse_email']},
    'spouse_firstname': {'S': spouse_firstname},
    'spouse_lastname': {'S': spouse_lastname},
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
    'spouse_accepted': {'BOOL': False},
    'last_email_sent': {'S': ''}
}
    
    response = dynamodb.put_item(TableName=argument_table, Item=item)
    

    return jsonify({'message': 'Initial argument entry submitted'}), 201

@app.route('/get_active_arguments', methods=['GET'])
def get_active_arguments():
    app.logger.info('get_active_arguments called')
    app.logger.info('Raw URL: %s', request.url)
    app.logger.info('Query Parameters: %s', request.args)

    user_email = request.args.get('user_email')
    # Define the expression attribute values to get all arguments for the user
    expression_attribute_values = {
        ':user_email': {'S': user_email}
    }

    # Define the filter expression to get all arguments where the user is either the initiator or spouse
    filter_expression = (
        'user_email = :user_email OR spouse_email = :user_email'
    )

    # Include all necessary fields in the projection expression
    projection_expression = (
        'user_email, spouse_email, argument_topic, reminder_time_two_days, '
        'reminder_time_one_days, reminder_time_twelve_hours, reminder_time_four_hours, '
        'argument_deadline, submission_time, argument_finished, last_email_sent, '
        'user_response, spouse_response, spouse_accepted, user_firstname, user_lastname, '
        'spouse_firstname, spouse_lastname'
    )

    # Perform the scan operation
    response = dynamodb.scan(
        TableName=argument_table,
        FilterExpression=filter_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ProjectionExpression=projection_expression
    )

    arguments = []

    for argument in response['Items']:
        app.logger.info(f'Processing argument: {argument}')
        app.logger.info(f'Name fields in argument: user_firstname={argument.get("user_firstname", {}).get("S")}, '
                       f'user_lastname={argument.get("user_lastname", {}).get("S")}, '
                       f'spouse_firstname={argument.get("spouse_firstname", {}).get("S")}, '
                       f'spouse_lastname={argument.get("spouse_lastname", {}).get("S")}')

        if check_clerk_user_exists(user_email):
            arguments.append(argument)

    app.logger.info(f'get_active_arguments response: {arguments}')
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
        clerk_user_email = data['userEmail']
        
        # Determine which field to update based on the user's email
        if clerk_user_email == argument_user_email:
            update_expression = 'SET user_response = :content'
        elif clerk_user_email == argument_spouse_email:
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
        user_exists = check_clerk_user_exists(user_email)
        spouse_exists = check_clerk_user_exists( spouse_email)
        
        return jsonify({'usersExist': user_exists and spouse_exists})
    except Exception as e:
        print(f"Error checking users: {str(e)}")
        return jsonify({'error': 'Error checking users'}), 500

def get_instance_id():
    try:
        return requests.get("http://169.254.169.254/latest/meta-data/instance-id", timeout=2).text
    except:
        return "unknown"

@app.route('/report', methods=['POST'])
def handle_feedback():
    try:
        data = request.json
        is_bug = data.get("is_bug", False)
        user_id = data.get("user_id")
        timestamp = datetime.utcnow()

        # Format timestamp for filename and payload
        date_str = timestamp.strftime("%Y-%m-%d")
        time_str = timestamp.strftime("%H-%M-%S")  
        timestamp_str = f"{date_str}_{time_str}"

        report_payload = {
            "user_id": user_id,
            "title": data.get("title"),
            "message": data.get("message"),
            "is_bug": is_bug,
            "bug_severity": data.get("bug_severity"),
            "timestamp": timestamp_str,
            "report_status": "new"
        }

        if not user_id or not data.get("title") or not data.get("message"):
            return jsonify({"error": "Missing required fields"}), 400

        # Determine the folder based on report type
        if is_bug:
            folder = f"bugs/{data.get('bug_severity')}"
        else:
            folder = "feedback"
        
        # Create the file key with the new format
        file_key = f"{folder}/{date_str}_report_{user_id}.json"

        # Store in S3
        try:
            s3_client.put_object(
                Bucket="waveover-development-user-reports",
                Key=file_key,
                Body=json.dumps(report_payload),
                StorageClass="STANDARD_IA"
            )
        except Exception as e:
            app.logger.error(f"S3 upload failed: {e}")
            return jsonify({"error": "Failed to store report"}), 500


        # Notify via SNS only for major bugs
        if is_bug and data.get('bug_severity') == "major":
            subject = f"Major Bug WaveOver Dev - {data.get('title', 'Untitled')} ({timestamp_str})"
            body = (
                f"New bug report received:\n\n"
                f"Title: {data.get('title', 'Untitled')}\n"
                f"Severity: {data.get('bug_severity')}\n"
                f"Time: {timestamp_str}\n"
                f"User ID: {user_id}\n\n"
                f"Message:\n{data.get('message', 'No details provided.')}\n"
            )
            try:
                sns_client.publish(
                    TopicArn="arn:aws:sns:eu-west-1:058264329805:waveover-development-bugreports",
                    Subject=subject,
                    Message=body
                )
            except Exception as e:
                app.logger.error(f"SNS publish failed: {e}")
                return jsonify({"error": "Failed to notify via SNS"}), 500

        return jsonify({"status": "ok"}), 200

    except Exception as e:
        app.logger.error(f"Error handling report: {str(e)}")
        return jsonify({"error": "Failed to process report"}), 500

@app.route('/update_spouse_acceptance', methods=['POST'])
def update_spouse_acceptance():
    try:
        data = request.get_json()
        user_email = data['user_email']
        submission_time = data['submission_time']
        accepted = data['accepted']
        
        # Capitalize spouse first and last names
        spouse_firstname = data['spouse_firstname'].strip().capitalize()
        spouse_lastname = data['spouse_lastname'].strip().capitalize()

        # Construct the key
        key = {
            'user_email': {'S': user_email},
            'submission_time': {'S': submission_time}
        }

        # Update the spouse_accepted field and spouse name fields
        update_expression = 'SET spouse_accepted = :accepted, spouse_firstname = :spouse_firstname, spouse_lastname = :spouse_lastname'
        expression_attribute_values = {
            ':accepted': {'BOOL': accepted},
            ':spouse_firstname': {'S': spouse_firstname},
            ':spouse_lastname': {'S': spouse_lastname}
        }

        # Update the item
        update_response = update_argument(key, update_expression, expression_attribute_values)
        app.logger.info(f"Update spouse acceptance response: {update_response}")

        return jsonify({'message': 'Spouse acceptance status updated successfully'}), 200

    except Exception as e:
        app.logger.error(f"Error updating spouse acceptance: {str(e)}")
        return jsonify({'error': 'Failed to update spouse acceptance status'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')



