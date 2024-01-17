from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import datetime
from celery_tasks import send_email_reminder
app = Flask(__name__)



if __name__ == '__main__':
    app.run(debug=True)


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
