from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, JSON
from app.core.database import Base
from datetime import datetime

class InvoiceRecord(Base):
    __tablename__ = "b2b_invoices"
    
    invoice_id = Column(String, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    amount = Column(Integer, nullable=False)  # Paise
    status = Column(String, default="issued")  # issued, paid, overdue, cancelled
    due_date = Column(DateTime, nullable=False)
    reminders_sent = Column(JSON, default=dict)  # {"1": true, "3": true, ...}
    last_chased_at = Column(DateTime, nullable=True)
    last_medium_used = Column(String, nullable=True)
    short_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
