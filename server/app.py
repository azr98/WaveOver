from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import datetime
from flask_cors import CORS , cross_origin

from celery_tasks import send_email_reminder
app = Flask(__name__)
CORS(app)


if __name__ == '__main__':
    app.run(debug=True)

@cross_origin()
def store_form_data(table_data):
    dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
    table = dynamodb.Table('WaveOver')
    try:
        response = table.put_item(
           Item={
                'user_email':table_data['user_email'],
                'spouse_email': table_data['spouse_email'],
                'issue_headline': table_data['issue_headline'],
                'start_time': table_data['start_time']  
            }
        )
        return response
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None

@app.route('/')
def index():
    return "WaveOver Backend Server"

@app.route('/submit_form', methods=['POST'])
@cross_origin()
def submit_form():
    data = request.json
    start_time = datetime.datetime.now()
    response = {
        'user_email': data['user_email'],
        'spouse_email': data['spouse_email'],
        'start_time': start_time.strftime('%Y-%m-%d %H:%M:%S') ,
        'issue_headline': data['issue_headline']
    }
    # user_email = data['user_email']
    # spouse_email = data['spouse_email']
    # start_time = datetime.datetime.now()
    # issue_headline = data['issue_headline']
    # Storing data in DynamoDB
    store_form_data(response)
    # Schedule email reminders based on start_time
    #TODO connect this to front end dashboard button and test dynamo put upload
    return jsonify({'status': 'Success', 'message': 'Form submitted and emails scheduled'}), 200



@app.route('/timer-completion', methods=['POST'])
@cross_origin()
def timer_completion():
    data = request.json
    user_email = data['user_email']
    spouse_email = data['spouse_email']

    # Retrieve the messages from the database
    user_message = get_user_message(user_email)
    spouse_message = get_spouse_message(spouse_email)

    # Send the final emails
    send_email_reminder.delay(user_email, "Message from your spouse", spouse_message)
    send_email_reminder.delay(spouse_email, "Message from you", user_message)

    return {'message': 'Messages sent to both parties'}, 200
