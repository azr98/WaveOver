from celery_config import make_celery
from email_service import send_email

celery = make_celery(__name__, 'redis://localhost:6379/0', 'redis://localhost:6379/0')

@celery.task
def send_email_reminder(email, subject, body):
    send_email(email, subject, body)
