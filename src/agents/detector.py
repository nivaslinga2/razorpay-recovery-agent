import sqlite3
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "recovery_data.db"

class RevenueDetector:
    def __init__(self):
        self.conn = sqlite3.connect(str(DB_PATH))
        self.conn.row_factory = sqlite3.Row

    def fetch_at_risk(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE status IN ('failed', 'abandoned') 
            AND created_at > datetime('now', '-48 hours')
            ORDER BY amount DESC
        """)
        rows = cursor.fetchall()
        
        risk_cases = []
        for row in rows:
            risk_cases.append({
                "transaction_id": row["id"],
                "amount_paise": row["amount"],
                "amount_rupees": row["amount"] / 100,
                "error": row["error_code"],
                "customer": row["customer_email"],
                "status": row["status"]
            })
        return risk_cases

    def calculate_potential_revenue(self, risk_cases):
        return sum(item["amount_paise"] for item in risk_cases) / 100

if __name__ == "__main__":
    detector = RevenueDetector()
    risks = detector.fetch_at_risk()
    
    if not risks:
        print("⚠️ No revenue at risk found. Seeding fresh data...")
        from src.data.seeder import seed_database
        seed_database()
        risks = detector.fetch_at_risk()

    total_risk = detector.calculate_potential_revenue(risks)
    print(f"🚨 Found {len(risks)} revenue leaks.")
    print(f"💰 Total Revenue at Risk: ₹{total_risk:,.2f}")
    
    with open(BASE_DIR / "risk_payload.json", "w") as f:
        json.dump(risks, f, indent=2)
    print("📁 Saved risk data to risk_payload.json")