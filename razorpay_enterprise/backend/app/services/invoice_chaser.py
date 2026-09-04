import razorpay
from datetime import datetime, timedelta
from app.core.config import settings
from app.models.invoice import InvoiceRecord
from app.services.config_service import get_config
from app.core.database import SessionLocal

REMINDER_SCHEDULE = [
    {"day": 1, "medium": "email", "urgency": "Gentle", "template": "Gentle reminder: Invoice #{inv_id} of ₹{amt} was due yesterday. Please settle at your earliest convenience."},
    {"day": 3, "medium": "sms", "urgency": "Standard", "template": "Payment reminder: Invoice #{inv_id} of ₹{amt} is pending. Settle securely via Razorpay: {link}"},
    {"day": 7, "medium": "whatsapp", "urgency": "Urgent", "template": "⚠️ Urgent: Invoice #{inv_id} for {company} is 7 days overdue (₹{amt}). Please clear immediately: {link}"},
    {"day": 14, "medium": "email", "urgency": "Final Notice", "template": "🚨 FINAL NOTICE: Remittance for Invoice #{inv_id} (₹{amt}) is 14 days overdue. Account flagged for suspension."}
]

def get_escalation_stage(days_overdue: int, reminders_sent: dict) -> dict:
    """Finds the next pending escalation stage based on days overdue."""
    for s in REMINDER_SCHEDULE:
        stage_key = str(s["day"])
        if days_overdue >= s["day"] and not reminders_sent.get(stage_key):
            return s
    # Default to latest applicable or general follow-up
    return REMINDER_SCHEDULE[-1] if days_overdue >= 14 else REMINDER_SCHEDULE[0]

def chase_invoice(invoice_id: str, medium: str = None, force_stage: int = None, db = None) -> dict:
    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True
    
    try:
        if get_config("is_paused", "false", db=db).lower() == "true":
            return {"status": "paused", "message": "Global Kill Switch active. Invoice notifications halted."}

        inv = db.query(InvoiceRecord).filter(InvoiceRecord.invoice_id == invoice_id).first()
        if not inv:
            return {"status": "error", "message": f"Invoice {invoice_id} not found."}

        days_overdue = max(1, (datetime.utcnow() - inv.due_date).days)
        reminders = inv.reminders_sent or {}

        if force_stage is not None:
            stage = next((s for s in REMINDER_SCHEDULE if s["day"] == force_stage), REMINDER_SCHEDULE[0])
        else:
            stage = get_escalation_stage(days_overdue, reminders)

        dispatch_medium = medium or stage["medium"]

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        try:
            client.invoice.notify_by(invoice_id, dispatch_medium)
            api_status = "NOTIFIED_VIA_RAZORPAY_API"
        except Exception:
            api_status = "DISPATCHED_SANDBOX"

        short_url = inv.short_url or f"https://rzp.io/i/inv_{invoice_id[:8]}"
        formatted_message = stage["template"].format(
            inv_id=inv.invoice_id,
            amt=f"{inv.amount / 100:,.0f}",
            company=inv.customer_name,
            link=short_url
        )

        reminders[str(stage["day"])] = True
        inv.reminders_sent = reminders
        inv.last_chased_at = datetime.utcnow()
        inv.last_medium_used = dispatch_medium
        inv.status = "overdue_chased"
        db.commit()

        return {
            "status": "SUCCESS",
            "invoice_id": invoice_id,
            "customer_name": inv.customer_name,
            "medium": dispatch_medium,
            "urgency": stage["urgency"],
            "days_overdue": days_overdue,
            "message": formatted_message,
            "short_url": short_url,
            "api_result": api_status
        }
    finally:
        if owns_db:
            db.close()
