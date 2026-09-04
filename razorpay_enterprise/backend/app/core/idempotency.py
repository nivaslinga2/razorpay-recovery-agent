import redis
from datetime import datetime
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.webhook_events import WebhookEvent
from app.core.logging import logger

# Redis client with short timeout for fault-tolerance fallback
try:
    redis_client = redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=1.5,
        socket_timeout=1.5
    )
except Exception:
    redis_client = None

def is_event_processed(event_id: str, event_type: str = None, expire_seconds: int = 86400) -> bool:
    """
    Two-Tier Fault-Tolerant Idempotency:
    1. Fast path: Redis atomic SETNX with TTL.
    2. Fallback path: PostgreSQL WebhookEvent table if Redis is down, unreachable, or fails.
    """
    if not event_id:
        return False

    redis_key = f"webhook:{event_id}"

    # Tier 1: Try Redis first
    if redis_client is not None:
        try:
            # set with nx=True returns True if key was set (i.e. fresh event), None if it already existed
            was_set = redis_client.set(redis_key, "processed", ex=expire_seconds, nx=True)
            if was_set is None:
                # Key already existed in Redis
                logger.info("idempotency_dedup_redis", event_id=event_id)
                return True
            
            # Record in PostgreSQL asynchronously / as permanent durable audit
            _persist_event_to_db_safe(event_id, event_type)
            return False
        except (redis.ConnectionError, redis.TimeoutError, redis.RedisError) as redis_err:
            logger.warning(
                "redis_offline_idempotency_fallback",
                event_id=event_id,
                error=str(redis_err)
            )

    # Tier 2: PostgreSQL fallback (Survives Redis crash / reboot)
    return _check_and_persist_db_fallback(event_id, event_type)

def _persist_event_to_db_safe(event_id: str, event_type: str = None):
    db = SessionLocal()
    try:
        exists = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
        if not exists:
            db.add(WebhookEvent(event_id=event_id, event_type=event_type, processed_at=datetime.utcnow()))
            db.commit()
    except Exception as db_err:
        db.rollback()
        logger.warning("idempotency_db_persist_warning", event_id=event_id, error=str(db_err))
    finally:
        db.close()

def _check_and_persist_db_fallback(event_id: str, event_type: str = None) -> bool:
    db = SessionLocal()
    try:
        existing = db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first()
        if existing:
            logger.info("idempotency_dedup_db_fallback", event_id=event_id)
            return True
        
        # Fresh event, persist to DB
        db.add(WebhookEvent(event_id=event_id, event_type=event_type, processed_at=datetime.utcnow()))
        db.commit()
        return False
    except Exception as db_err:
        db.rollback()
        logger.error("idempotency_db_fallback_error", event_id=event_id, error=str(db_err))
        # If DB query fails, allow processing once to avoid dropping money recovery
        return False
    finally:
        db.close()
