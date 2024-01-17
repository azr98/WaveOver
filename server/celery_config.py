from celery import Celery

def make_celery(app_name, broker_url, result_backend):
    return Celery(app_name, backend=result_backend, broker=broker_url)

# Example usage in app.py
# from celery_config import make_celery
# celery = make_celery(__name__, 'redis://localhost:6379/0', 'redis://localhost:6379/0')
