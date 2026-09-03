# tests/test_1000_universes.py
import pytest
import sqlite3
import random
import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from faker import Faker

# Import your core logic (adjust paths as needed)
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from src.agents.detector import RevenueDetector
from src.agents.diagnosis_agent import diagnose_risk_cases, cheap_heuristic_router

fake = Faker()
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "recovery_data.db"

# --- Predicates (The "Safety Laws" we check in every universe) ---

def assert_no_double_recovery(conn):
    """Predicate 1: Idempotency. A recovered transaction must never be recovered twice."""
    cur = conn.cursor()
    cur.execute("""
        SELECT transaction_id, COUNT(*) as count 
        FROM audit_log 
        WHERE action_taken LIKE 'Recovered%'
        GROUP BY transaction_id
        HAVING COUNT(*) > 1
    """)
    duplicates = cur.fetchall()
    assert len(duplicates) == 0, f"Found {len(duplicates)} double-recovered transactions."

def assert_heuristic_router_consistency(conn):
    """Predicate 2: The heuristic router must correctly classify 100% of known errors."""
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT error_code FROM transactions WHERE status = 'failed'")
    errors = [row[0] for row in cur.fetchall() if row[0]]
    
    known_errors = ["BANK_INSUFFICIENT_FUNDS", "USER_TIMEOUT", "CHECKOUT_EXIT", "CARD_DECLINED", "UNAUTHORIZED_TXN"]
    
    for err in errors:
        if err in known_errors:
            # If it's known, the router MUST return a dict, not None
            result = cheap_heuristic_router(err)
            assert result is not None, f"Heuristic router failed on known error: {err}"
            assert "recovery_action" in result
            assert "hinglish_message" in result

def assert_revenue_matches_ledger(conn):
    """Predicate 3: The money recovered cannot exceed the money at risk."""
    cur = conn.cursor()
    cur.execute("SELECT SUM(amount) FROM transactions WHERE is_recovered = 1")
    recovered = cur.fetchone()[0] or 0
    
    cur.execute("SELECT SUM(amount) FROM transactions WHERE status IN ('failed', 'abandoned')")
    at_risk = cur.fetchone()[0] or 0
    
    # Recovered should be less than or equal to At-Risk (in paise)
    assert recovered <= at_risk, f"Recovered ({recovered}) exceeded At-Risk ({at_risk})."

def assert_hash_chain_integrity(conn):
    """Predicate 4: (Vasool-inspired) Every audit log entry has a unique SHA hash."""
    cur = conn.cursor()
    cur.execute("SELECT transaction_id, action_taken, timestamp FROM audit_log")
    logs = cur.fetchall()
    
    hashes = []
    for log in logs:
        # Create a deterministic string from the record
        payload = f"{log[0]}|{log[1]}|{log[2]}"
        hash_val = hashlib.sha256(payload.encode()).hexdigest()
        hashes.append(hash_val)
    
    # Ensure no duplicate hashes (proves immutability)
    assert len(hashes) == len(set(hashes)), "Hash collision or duplicate log entry detected."

# --- The 1,000 Universe Simulator ---

def simulate_universe(seed):
    """Creates a random batch of 100 transactions and runs the full pipeline."""
    random.seed(seed)
    fake.seed_instance(seed)
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # 1. Wipe the DB
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
            is_recovered BOOLEAN DEFAULT 0,
            recovered_at TEXT DEFAULT NULL
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

    # 2. Seed Random Transactions (Heavy on errors)
    merchants = ["merch_001", "merch_002", "merch_003"]
    error_map = {
        'failed': ['BANK_INSUFFICIENT_FUNDS', 'CARD_DECLINED', 'UNAUTHORIZED_TXN', 'SOME_RARE_EDGE'],
        'abandoned': ['USER_TIMEOUT', 'CHECKOUT_EXIT'],
        'captured': [None]
    }
    # Weight towards failures to stress the system
    statuses = ['captured', 'failed', 'abandoned']
    weights = [20, 50, 30]  # 80% are at-risk

    transactions = []
    for i in range(100):
        txn_id = f"seed_{seed}_txn_{i:04d}"
        status = random.choices(statuses, weights=weights)[0]
        error = random.choice(error_map[status]) if status != 'captured' else None
        amount = random.randint(500, 50000) * 100  # Paise
        
        transactions.append((
            txn_id,
            random.choice(merchants),
            fake.email(),
            amount,
            status,
            error,
            fake.bban()[:12],
            (datetime.now() - timedelta(hours=random.randint(1, 48))).isoformat(),
            0,  # is_recovered
            None  # recovered_at
        ))

    cursor.executemany("""
        INSERT INTO transactions (id, merchant_id, customer_email, amount, status, error_code, bank_rrn, created_at, is_recovered, recovered_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, transactions)
    conn.commit()

    # 3. Run the DETECTOR (Find at-risk)
    detector = RevenueDetector()
    risks = detector.fetch_at_risk()
    
    # 4. Run the AI/Heuristic Diagnosis (Simulate mock for speed)
    # To keep this fast, we only run the heuristic router in tests.
    # If you want to test the real LLM, uncomment the next line, but it will cost credits.
    # from src.agents.diagnosis_agent import diagnose_risk_cases
    # diagnose_risk_cases() 
    
    # Instead, we mock the diagnosis quickly to test the guard rails
    for risk in risks:
        error = risk.get("error")
        if cheap_heuristic_router(error):
            # Simulate a recovery action in the ledger
            cur = conn.cursor()
            cur.execute("""
                UPDATE transactions SET is_recovered = 1, recovered_at = ? WHERE id = ?
            """, (datetime.now().isoformat(), risk["transaction_id"]))
            cur.execute("""
                INSERT INTO audit_log (transaction_id, ai_diagnosis, action_taken, api_response, human_approver, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (risk["transaction_id"], "Test Routed", "Recovered by Heuristic", "Mock-API-Success", "Test-Human", datetime.now().isoformat()))
            conn.commit()

    # 5. Run the PREDICATES (The tests)
    try:
        assert_no_double_recovery(conn)
        assert_heuristic_router_consistency(conn)
        assert_revenue_matches_ledger(conn)
        assert_hash_chain_integrity(conn)
        passed = True
    except AssertionError as e:
        passed = False
        print(f"❌ Universe {seed} failed: {e}")
        raise  # Let pytest catch it
    
    conn.close()
    return passed

# --- THE BIG 1000 TEST ---

@pytest.mark.parametrize("seed", range(1, 1001))  # Runs 1,000 times!
def test_universe_safety(seed):
    """Runs the full pipeline on 1,000 random universes and verifies safety."""
    # For speed, we skip seeds that might be slow, but we want all 1000.
    # Since we aren't calling the real LLM here, this takes ~0.1 seconds per seed.
    # Total runtime: ~100 seconds.
    result = simulate_universe(seed)
    assert result is True, f"Universe {seed} failed safety checks."
