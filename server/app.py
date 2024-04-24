# Dependencies
from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# AWS SDK clients
cognito = boto3.client('cognito-idp', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
ses = boto3.client('ses', region_name='us-east-1')

# DynamoDB table
arguments_table = dynamodb.Table('Arguments')

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

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, port=5000)

