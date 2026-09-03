from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime, Text
from app.core.database import Base
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True, index=True)
    merchant_id = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)  # Paise
    status = Column(String, nullable=False)
    error_code = Column(String, nullable=True)
    bank_rrn = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Enterprise specific
    is_recovered = Column(Boolean, default=False)
    recovered_at = Column(DateTime, nullable=True)
    recovery_attempts = Column(Integer, default=0)
    last_recovery_error = Column(Text, nullable=True)
    llm_cost_inr = Column(Float, default=0.0)  # Track spend
