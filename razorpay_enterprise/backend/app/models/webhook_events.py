from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
