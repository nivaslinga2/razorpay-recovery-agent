from sqlalchemy import Column, String, Integer, DateTime, Text, Float
from app.core.database import Base
from datetime import datetime

class MandateRecord(Base):
    __tablename__ = "mandate_records"
    
    mandate_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, nullable=False)
    token_id = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)  # Paise
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    status = Column(String, default="PENDING")  # PENDING, EXECUTED, HALTED, COOLDOWN
    last_attempt = Column(DateTime, nullable=True)
    next_scheduled_retry = Column(DateTime, nullable=True)
    last_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
