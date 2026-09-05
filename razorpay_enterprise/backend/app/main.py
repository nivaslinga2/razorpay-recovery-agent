from datetime import datetime, timedelta
import random



def seed_initial_data_if_empty():
    db = SessionLocal()
    try:
        # 1. Seed system configuration keys
        if not db.query(SystemConfig).filter(SystemConfig.key == "is_paused").first():
            db.add(SystemConfig(key="is_paused", value="false"))
        if not db.query(SystemConfig).filter(SystemConfig.key == "max_retry_count").first():
            db.add(SystemConfig(key="max_retry_count", value="3"))
        db.commit()

        # 2. Check if transactions table has data
        if db.query(Transaction).count() == 0:
            error_map = {
                'failed': ['BANK_INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'UNAUTHORIZED_TXN'],
                'abandoned': ['USER_TIMEOUT', 'CHECKOUT_EXIT'],
                'captured': [None]
            }
            sample_txns = []
            for i in range(50):
                txn_id = f"txn_ent_{i:04d}"
                status = random.choices(['captured', 'failed', 'abandoned'], weights=[30, 50, 20])[0]
                error = random.choice(error_map[status]) if status != 'captured' else None
                amt_inr = random.randint(1200, 48000)
                is_recovered = True if (i < 6 and status != 'captured') else False
                recovered_at = datetime.utcnow() - timedelta(hours=random.randint(1, 8)) if is_recovered else None
                sample_txns.append(
                    Transaction(
                        id=txn_id,
                        merchant_id=random.choice(["merch_001", "merch_002", "merch_003"]),
                        customer_email=f"customer_{i}@example.com",
                        amount=amt_inr * 100,
                        status=status,
                        error_code=error,
                        bank_rrn=f"RRN{random.randint(10000000, 99999999)}",
                        created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                        is_recovered=is_recovered,
                        recovered_at=recovered_at,
                        recovery_attempts=1 if is_recovered else 0,
                        llm_cost_inr=0.0015 if is_recovered else 0.0
                    )
                )
            db.bulk_save_objects(sample_txns)
            db.commit()
            print(f"Auto-seeded {len(sample_txns)} transactions into database.")
    except Exception as e:
        print(f"Notice during auto-seed: {e}")
    finally:
        db.close()

import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.core.logging import setup_logging, logger
from app.core.metrics import get_metrics_response
from app.api.routes import router
from app.routers.webhooks import router as webhooks_router
from app.routers.assistant import router as assistant_router
from app.routers.auth import router as auth_router
from app.core.database import Base, engine, SessionLocal
import app.models
from app.models.transaction import Transaction
from app.models.system_config import SystemConfig

setup_logging()

from app.core.limiter import limiter

def run_migrations():
    try:
        from alembic import command
        from alembic.config import Config
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("alembic_migrations_applied", status="head")
    except Exception as e:
        logger.warning("alembic_migration_notice", notice=str(e))

from app.core.tracing import setup_tracing

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("service_startup", service="payresq-api", status="initializing")
    try:
        Base.metadata.create_all(bind=engine)
        seed_initial_data_if_empty()
        logger.info("database_initialized", status="ready")
    except Exception as e:
        logger.error("database_init_error", error=str(e))
    yield
    logger.info("service_shutdown", service="payresq-api", status="draining_connections_graceful_shutdown")

app = FastAPI(
    title="PayResQ Enterprise Revenue Recovery API",
    description="Asynchronous recovery system with Celery, Prometheus, and Observability metrics.",
    version="2.0.0",
    lifespan=lifespan
)

setup_tracing(app)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
cors_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", f"{FRONTEND_URL},http://localhost:3000,http://localhost:5173").split(",")
    if origin.strip()
]
if FRONTEND_URL and FRONTEND_URL not in cors_origins:
    cors_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(webhooks_router)
app.include_router(assistant_router)
app.include_router(auth_router)

@app.get("/metrics")
async def get_metrics():
    return get_metrics_response()

@app.get("/health")
async def health_check():
    """Liveness probe: verifies the API process is alive."""
    return {
        "status": "healthy",
        "service": "payresq-api",
        "timestamp": os.popen("date /t").read().strip() if os.name == 'nt' else "live"
    }

@app.get("/ready")
async def readiness_check(response: Response):
    """Readiness probe: verifies DB connectivity and core dependencies."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        response.status_code = 503
        return {"status": "not_ready", "database": "disconnected", "error": str(e)}

@app.get("/")
def root():
    return {
        "service": "PayResQ Revenue Recovery Agent - Enterprise",
        "status": "online",
        "health": "/health",
        "ready": "/ready",
        "metrics": "/metrics",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

