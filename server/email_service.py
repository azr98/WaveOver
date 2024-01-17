import boto3
from botocore.exceptions import ClientError

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