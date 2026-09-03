import sqlite3
import random
from datetime import datetime, timedelta
from pathlib import Path
from faker import Faker

fake = Faker()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "recovery_data.db"

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def seed_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.executescript("""
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS audit_log;
        
        CREATE TABLE transactions (
            id TEXT PRIMARY KEY,
            merchant_id TEXT,
            customer_email TEXT,
            amount INTEGER,
            status TEXT,
            error_code TEXT,
            bank_rrn TEXT,
            created_at TEXT,
            is_recovered BOOLEAN DEFAULT 0,      -- NEW: tracks if money is recovered
            recovered_at TEXT DEFAULT NULL       -- NEW: tracks when it was recovered
        );
        
        CREATE TABLE audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT,
            ai_diagnosis TEXT,
            action_taken TEXT,
            api_response TEXT,
            human_approver TEXT,
            timestamp TEXT
        );
    """)

    merchants = ["merch_001", "merch_002", "merch_003"]
    error_map = {
        'failed': ['BANK_INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'UNAUTHORIZED_TXN'],
        'abandoned': ['USER_TIMEOUT', 'CHECKOUT_EXIT'],
        'captured': [None]
    }

    transactions = []
    for i in range(100):
        txn_id = f"txn_{i:04d}"
        status = random.choices(['captured', 'failed', 'abandoned'], weights=[40, 35, 25])[0]
        error = random.choice(error_map[status]) if status != 'captured' else None
        amount_rupees = random.randint(500, 50000)
        
        transactions.append((
            txn_id,
            random.choice(merchants),
            fake.email(),
            amount_rupees * 100,
            status,
            error,
            fake.bban()[:12],
            (datetime.now() - timedelta(hours=random.randint(1, 48))).isoformat()
        ))

    cursor.executemany("""
        INSERT INTO transactions (id, merchant_id, customer_email, amount, status, error_code, bank_rrn, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, transactions)
    
    conn.commit()
    conn.close()
    print(f"✅ Database created at: {DB_PATH}")
    print(f"✅ Seeded {len(transactions)} transactions.")

if __name__ == "__main__":
    seed_database()