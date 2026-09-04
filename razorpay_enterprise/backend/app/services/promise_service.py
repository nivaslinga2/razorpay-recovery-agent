import uuid
from datetime import datetime, timedelta
from app.models.promise import PromiseRecord
from app.services.config_service import get_config
from app.core.database import SessionLocal

def record_promise(customer_id: str, customer_name: str, customer_email: str, 
                   amount: int, promised_date: datetime, customer_phone: str = None, 
                   notes: str = None, db = None) -> dict:
    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True

    try:
        promise_id = f"ptp_{uuid.uuid4().hex[:10]}"
        record = PromiseRecord(
            promise_id=promise_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone or "+919876543210",
            amount=amount,
            promised_date=promised_date,
            status="PENDING",
            reminders_sent=0,
            notes=notes or "Customer promised payment on specified date."
        )
        db.add(record)
        db.commit()

        return {
            "status": "RECORDED",
            "promise_id": promise_id,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "amount": amount / 100.0,
            "promised_date": promised_date.strftime("%Y-%m-%d"),
            "notes": notes
        }
    finally:
        if owns_db:
            db.close()

def send_promise_reminder(promise_id: str, db = None) -> dict:
    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True

    try:
        if get_config("is_paused", "false", db=db).lower() == "true":
            return {"status": "PAUSED", "message": "Global Kill Switch active."}

        record = db.query(PromiseRecord).filter(PromiseRecord.promise_id == promise_id).first()
        if not record or record.status != "PENDING":
            return {"status": "IGNORED", "reason": "Promise not pending or found"}

        now = datetime.utcnow()
        amt_rs = record.amount / 100.0

        if now > (record.promised_date + timedelta(days=2)):
            record.status = "BROKEN"
            escalate_msg = f"Escalated to Merchant: Customer {record.customer_name} ({record.customer_id}) broke promise to pay on {record.promised_date.strftime('%Y-%m-%d')}."
            record.reminders_sent += 1
            db.commit()
            return {
                "status": "ESCALATED",
                "promise_id": promise_id,
                "customer_name": record.customer_name,
                "message": escalate_msg
            }

        msg = f"Namaste {record.customer_name}! Aapne ₹{amt_rs:,.0f} kal dene ka kaha tha. Kripya naye payment link par click karke payment poora karein: https://rzp.io/i/{record.promise_id[:8]}"

        record.reminders_sent += 1
        db.commit()

        return {
            "status": "REMINDER_DISPATCHED",
            "promise_id": promise_id,
            "customer_phone": record.customer_phone,
            "reminder_count": record.reminders_sent,
            "message": msg
        }
    finally:
        if owns_db:
            db.close()

def fulfill_promise(customer_id: str = None, email: str = None, amount: int = None, db = None) -> int:
    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True

    try:
        query = db.query(PromiseRecord).filter(PromiseRecord.status == "PENDING")
        if customer_id:
            query = query.filter(PromiseRecord.customer_id == customer_id)
        elif email:
            query = query.filter(PromiseRecord.customer_email == email)

        records = query.all()
        fulfilled_count = 0
        for r in records:
            r.status = "FULFILLED"
            r.fulfilled_at = datetime.utcnow()
            fulfilled_count += 1
        
        if fulfilled_count > 0:
            db.commit()
        return fulfilled_count
    finally:
        if owns_db:
            db.close()
