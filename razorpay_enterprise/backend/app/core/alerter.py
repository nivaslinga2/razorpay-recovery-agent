import os
import requests
from app.core.metrics import queue_depth

SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

def check_queue_depth() -> bool:
    try:
        current_depth = queue_depth._value.get()
    except Exception:
        current_depth = 0

    if current_depth > 1000:
        if SLACK_WEBHOOK_URL:
            try:
                requests.post(SLACK_WEBHOOK_URL, json={
                    "text": f"🚨 ALERT: Celery queue depth is {current_depth} tasks!",
                    "attachments": [{"color": "danger"}]
                }, timeout=5)
            except Exception as e:
                print(f"Alert dispatch error: {e}")
        return True
    return False
