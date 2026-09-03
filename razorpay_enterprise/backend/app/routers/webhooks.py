# backend/app/routers/webhooks.py
import json
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from app.services.recovery_service import RecoveryService
from app.workers.tasks import process_recovery, recover_subscription
from app.core.config import settings
from app.models.transaction import Transaction
from app.core.database import SessionLocal
import razorpay

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

def verify_razorpay_signature(payload: bytes, signature: str, secret: str) -> bool:
    """HMAC SHA256 verification - the same standard Razorpay uses."""
    if not secret:
        return True  # Fallback for dev/test mode if secret not set
    expected = hmac.new(
        key=secret.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def trigger_async_recovery(txn_id: str, amount: int, email: str, error_code: str):
    try:
        process_recovery.delay(txn_id, amount, email, error_code)
    except Exception as e:
        print(f"Notice on Celery background dispatch for {txn_id}: {e}")

def trigger_async_subscription_recovery(sub_id: str, customer_id: str, email: str, amount: int):
    try:
        recover_subscription.delay(sub_id, customer_id, email, amount)
    except Exception as e:
        print(f"Notice on Celery subscription recovery dispatch for {sub_id}: {e}")

@router.post("/razorpay")
async def razorpay_webhook(request: Request, background_tasks: BackgroundTasks):
    # 1. Read raw body
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    # 2. Verify HMAC (Proves it's truly Razorpay)
    if not verify_razorpay_signature(body, signature, settings.RAZORPAY_KEY_SECRET):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 3. Parse payload
    try:
        payload = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event")
    
    if event == "payment.failed":
        txn_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
        txn_id = txn_data.get("id")
        if not txn_id:
            return {"status": "ignored", "reason": "No txn id"}

        error_code = txn_data.get("error_code", "UNKNOWN")
        amount = txn_data.get("amount", 0)  # Already in paise
        email = txn_data.get("email", "unknown@example.com")

        # 4. Save to DB immediately with safe session management
        db = SessionLocal()
        try:
            txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
            if not txn:
                new_txn = Transaction(
                    id=txn_id,
                    merchant_id="merchant_live_001",
                    customer_email=email,
                    amount=amount,
                    status="failed",
                    error_code=error_code,
                    bank_rrn=txn_data.get("bank_rrn"),
                    is_recovered=False,
                    recovery_attempts=0
                )
                db.add(new_txn)
                db.commit()
        except Exception as db_err:
            db.rollback()
            print(f"Error persisting webhook txn {txn_id}: {db_err}")
        finally:
            db.close()

        # 5. Trigger Async Worker (Non-blocking)
        background_tasks.add_task(
            trigger_async_recovery,
            txn_id, 
            amount, 
            email, 
            error_code
        )
        
        return {"status": "queued", "txn_id": txn_id}
    
    elif event in ["subscription.halted", "subscription.pending"]:
        # Feature 1: Failed-Subscription Recovery (Retries Exhausted)
        sub_entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
        subscription_id = sub_entity.get("id", f"sub_{hashlib.md5(body).hexdigest()[:12]}")
        customer_id = sub_entity.get("customer_id") or "cust_enterprise_001"
        email = payload.get("payload", {}).get("payment", {}).get("entity", {}).get("email") or f"{customer_id}@example.com"
        amount = sub_entity.get("total_count", 1) * 299900  # Paise

        db = SessionLocal()
        try:
            sub_txn = db.query(Transaction).filter(Transaction.id == subscription_id).first()
            if not sub_txn:
                sub_txn = Transaction(
                    id=subscription_id,
                    merchant_id="merchant_live_001",
                    customer_email=email,
                    amount=amount,
                    status="halted",
                    error_code="SUBSCRIPTION_RETRIES_EXHAUSTED",
                    bank_rrn=f"SUB_{subscription_id[:10]}",
                    is_recovered=False,
                    recovery_attempts=0
                )
                db.add(sub_txn)
                db.commit()
        except Exception as db_err:
            db.rollback()
            print(f"Error persisting subscription {subscription_id}: {db_err}")
        finally:
            db.close()

        background_tasks.add_task(
            trigger_async_subscription_recovery,
            subscription_id,
            customer_id,
            email,
            amount
        )
        return {"status": "queued_subscription_recovery", "subscription_id": subscription_id}

    elif event in ["payment.captured", "order.paid"]:
        # Step 4: Webhook to fulfill promises
        pay_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
        customer_id = pay_data.get("customer_id")
        email = pay_data.get("email")
        amount = pay_data.get("amount")
        
        from app.services.promise_service import fulfill_promise
        db = SessionLocal()
        try:
            fulfilled_count = fulfill_promise(customer_id=customer_id, email=email, amount=amount, db=db)
            return {"status": "payment_captured", "promises_fulfilled": fulfilled_count}
        finally:
            db.close()

    return {"status": "ignored"}

