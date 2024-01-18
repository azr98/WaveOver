from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import datetime
from celery_tasks import send_email_reminder
app = Flask(__name__)



if __name__ == '__main__':
    app.run(debug=True)

def store_form_data(user_email, spouse_email, issue_headline, start_time):
    dynamodb = boto3.resource('dynamodb', region_name='eu-west-1')
    table = dynamodb.Table('WaveOver')
    try:
        response = table.put_item(
           Item={
                'user_email': user_email,
                'spouse_email': spouse_email,
                'issue_headline': issue_headline,
                'start_time': start_time.strftime("%Y-%m-%d %H:%M:%S")  # Format datetime as a string
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
def submit_form():
    data = request.json
    user_email = data['user_email']
    spouse_email = data['spouse_email']
    start_time = datetime.datetime.now()
    issue_headline = data['issue_headline']
    # Store data in DynamoDB
    store_form_data(user_email, spouse_email, issue_headline, start_time)
    # Schedule email reminders based on start_time
    #TODO connect this to front end dashboard button and test dynamo put upload
    return jsonify({'status': 'Success', 'message': 'Form submitted and emails scheduled'}), 200

@app.route('/timer-completion', methods=['POST'])
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
