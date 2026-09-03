from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Prometheus Metrics
recovered_amount_total = Counter('recovered_amount_total', 'Total amount recovered (in paise)', ['merchant_id'])
recovery_attempts_total = Counter('recovery_attempts_total', 'Total recovery attempts', ['status', 'model_used'])
ai_cost_total = Counter('ai_cost_total', 'Total AI cost in INR', ['model_type'])
queue_depth = Gauge('celery_queue_depth', 'Current Celery queue depth')
api_latency = Histogram('api_latency_seconds', 'API latency in seconds', ['endpoint'])

def get_metrics_response() -> Response:
    """Generates Prometheus text metric format response."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
