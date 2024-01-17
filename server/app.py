from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import datetime
app = Flask(__name__)



if __name__ == '__main__':
    app.run(debug=True)


def send_email(recipient, subject, body):
    ses_client = boto3.client('ses', region_name='eu-west-1')
    try:
        response = ses_client.send_email(
            Destination={'ToAddresses': [recipient]},
            Message={
                'Body': {'Text': {'Data': body}},
                'Subject': {'Data': subject},
            },
            Source='azhar981@gmail.com'
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None
    return response

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
    # Logic to store this data in your database
    # Schedule email reminders based on start_time
    return jsonify({'status': 'Success', 'message': 'Form submitted and emails scheduled'}), 200
