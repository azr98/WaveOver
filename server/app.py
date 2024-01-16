from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)

@app.route('/')
def index():
    return "WaveOver Backend Server"

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
