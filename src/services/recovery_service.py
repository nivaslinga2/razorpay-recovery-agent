import sqlite3
import json
import razorpay
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "recovery_data.db"

class RecoveryService:
    def __init__(self):
        self.client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))
    
    def get_transaction(self, txn_id):
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM transactions WHERE id = ?", (txn_id,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def recover(self, txn_id, amount, email):
        # 1. IDEMPOTENCY CHECK: Prevent double recovery
        txn = self.get_transaction(txn_id)
        if txn and txn.get("is_recovered") == 1:
            return False, "Transaction already recovered."

        try:
            # 2. CALL RAZORPAY API (Bounded Action)
            payment_link = self.client.payment_link.create({
                "amount": int(amount * 100),  # Paise
                "currency": "INR",
                "description": f"Recovery for {txn_id}",
                "customer": {"email": email},
                "callback_url": "https://example.com/success",
                "callback_method": "get"
            })
            
            # 3. MARK AS RECOVERED IN DB (PERSISTENT STATE)
            conn = sqlite3.connect(str(DB_PATH))
            cur = conn.cursor()
            cur.execute("""
                UPDATE transactions 
                SET is_recovered = 1, recovered_at = ? 
                WHERE id = ?
            """, (datetime.now().isoformat(), txn_id))
            
            # 4. LOG TO AUDIT TRAIL
            cur.execute("""
                INSERT INTO audit_log (transaction_id, ai_diagnosis, action_taken, api_response, human_approver, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (txn_id, "AI Approved", "Payment Link Generated", json.dumps(payment_link), "Merchant (UI)", datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            return True, payment_link.get("short_url", "Link Generated")
        
        except Exception as e:
            # 5. GRACEFUL FAILURE (Log to audit trail but don't mark as recovered)
            conn = sqlite3.connect(str(DB_PATH))
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO audit_log (transaction_id, ai_diagnosis, action_taken, api_response, human_approver, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (txn_id, f"Error: {str(e)[:50]}", "Failed Recovery", "N/A", "Merchant (UI)", datetime.now().isoformat()))
            conn.commit()
            conn.close()
            return False, str(e)
