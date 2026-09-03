from sqlalchemy.orm import Session
from app.models.system_config import SystemConfig
from app.core.database import SessionLocal

def get_config(key: str, default: str = None, db: Session = None) -> str:
    """Reads dynamic system config value from PostgreSQL."""
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True
    try:
        cfg = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        return cfg.value if cfg else default
    finally:
        if owns_session:
            db.close()

def set_config(key: str, value: str, db: Session = None) -> SystemConfig:
    """Sets or updates dynamic system config value in PostgreSQL."""
    owns_session = False
    if db is None:
        db = SessionLocal()
        owns_session = True
    try:
        cfg = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if not cfg:
            cfg = SystemConfig(key=key, value=str(value))
            db.add(cfg)
        else:
            cfg.value = str(value)
        db.commit()
        db.refresh(cfg)
        return cfg
    finally:
        if owns_session:
            db.close()
