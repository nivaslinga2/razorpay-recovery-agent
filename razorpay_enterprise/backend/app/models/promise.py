from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean
from app.core.database import Base
from datetime import datetime

class PromiseRecord(Base):
    __tablename__ = "promise_records"
    
    promise_id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    amount = Column(Integer, nullable=False)  # Paise
    promised_date = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, FULFILLED, BROKEN, ESCALATED
    reminders_sent = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
