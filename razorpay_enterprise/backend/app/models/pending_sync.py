from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class PendingSync(Base):
    __tablename__ = "pending_sync"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    transaction_id = Column(String(255), nullable=False, index=True)
    razorpay_link = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    status = Column(String(50), default="pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    retried_at = Column(DateTime, nullable=True)
    retry_count = Column(Integer, default=0)
