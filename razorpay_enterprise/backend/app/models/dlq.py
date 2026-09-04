from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class DeadLetterQueue(Base):
    __tablename__ = "dead_letter_queue"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    task_name = Column(String(255), nullable=False, index=True)
    task_id = Column(String(255), nullable=True, index=True)
    args = Column(Text, nullable=True)
    kwargs = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    traceback = Column(Text, nullable=True)
    status = Column(String(50), default="unresolved", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
