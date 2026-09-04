from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

POOL_SIZE = 25
MAX_OVERFLOW = 15

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Connection Pool Monitoring Event Listeners
@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    try:
        from app.core.metrics import db_connections_active, db_pool_size
        pool = engine.pool
        db_connections_active.set(pool.checkedout())
        db_pool_size.set(POOL_SIZE)
    except Exception:
        pass

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    try:
        from app.core.metrics import db_connections_active
        pool = engine.pool
        db_connections_active.set(pool.checkedout())
    except Exception:
        pass

def get_pool_status() -> dict:
    """Returns real-time database connection pool utilization metrics."""
    pool = engine.pool
    checked_out = pool.checkedout() if hasattr(pool, "checkedout") else 0
    size = pool.size() if hasattr(pool, "size") else POOL_SIZE
    overflow = pool.overflow() if hasattr(pool, "overflow") else 0
    return {
        "pool_size": size,
        "max_overflow": MAX_OVERFLOW,
        "checked_out": checked_out,
        "overflow": overflow,
        "utilization_percent": round((checked_out / (size + MAX_OVERFLOW)) * 100, 2) if (size + MAX_OVERFLOW) > 0 else 0.0
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
