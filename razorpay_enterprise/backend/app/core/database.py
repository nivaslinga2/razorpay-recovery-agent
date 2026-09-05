import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Supabase URL normalization: postgres:// -> postgresql://
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Handle unencoded special characters (e.g. '@') inside passwords
if database_url.count('@') > 1:
    last_at = database_url.rfind('@')
    first_colon = database_url.find(':', database_url.find('//') + 2)
    if first_colon != -1 and first_colon < last_at:
        user_prefix = database_url[:first_colon + 1]
        raw_pw = database_url[first_colon + 1:last_at]
        host_suffix = database_url[last_at:]
        database_url = user_prefix + raw_pw.replace('@', '%40') + host_suffix

POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "5"))

engine = create_engine(
    database_url,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=1800
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
