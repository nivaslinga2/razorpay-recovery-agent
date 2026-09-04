from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from app.core.database import Base

class ShadowAudit(Base):
    __tablename__ = "shadow_audit"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    transaction_id = Column(String(255), nullable=False, index=True)
    champion_action = Column(String(100), nullable=True)
    challenger_action = Column(String(100), nullable=True)
    champion_diagnosis = Column(String(255), nullable=True)
    challenger_diagnosis = Column(String(255), nullable=True)
    amount = Column(Integer, default=0)
    hypothetical_recovered = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    would_recover = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
