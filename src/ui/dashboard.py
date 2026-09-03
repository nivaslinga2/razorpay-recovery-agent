# src/ui/dashboard.py (Production-Ready UI)
import streamlit as st
import pandas as pd
import json
import sqlite3
from pathlib import Path
from datetime import datetime
import time

# Import the service
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from services.recovery_service import RecoveryService

# --- Page Config ---
st.set_page_config(page_title="Razorpay Revenue Recovery", page_icon="💰", layout="wide")

# --- Database Connection Helper ---
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "recovery_data.db"

def load_data():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM transactions")
    rows = cur.fetchall()
    conn.close()
    return pd.DataFrame([dict(row) for row in rows])

def get_audit_trail():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 20")
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- Session State for Notifications ---
if "toast" not in st.session_state:
    st.session_state.toast = None

def show_toast(message, type="success"):
    st.session_state.toast = {"message": message, "type": type}

# --- Main UI ---
def main():
    st.title("💰 Razorpay Revenue Recovery Agent")
    st.caption("Production-Grade | Persistent State | Bulk Recovery | Audit Trail")
    st.divider()

    df = load_data()
    if df.empty:
        st.warning("No data found. Run seeder.py first!")
        st.stop()

    # --- METRICS (Calculated from DB) ---
    total_risk = df[df["is_recovered"] == 0]["amount"].sum() / 100
    recovered_amount = df[df["is_recovered"] == 1]["amount"].sum() / 100
    pending_count = len(df[df["is_recovered"] == 0])

    col1, col2, col3, col4 = st.columns(4)
    with col1: st.metric("📊 Total Cases", len(df))
    with col2: st.metric("💰 At-Risk Revenue", f"₹{total_risk:,.0f}")
    with col3: st.metric("✅ Recovered", f"₹{recovered_amount:,.0f}")
    with col4: st.metric("⏳ Pending", f"{pending_count} cases")

    st.divider()

    # --- Filtering ---
    col_f1, col_f2 = st.columns(2)
    with col_f1:
        status_filter = st.selectbox("Filter by Status", ["All", "failed", "abandoned", "captured"])
    with col_f2:
        recovered_filter = st.selectbox("Show", ["Pending Only", "Recovered Only", "All"])

    filtered_df = df[df["status"] == status_filter] if status_filter != "All" else df
    if recovered_filter == "Pending Only":
        filtered_df = filtered_df[filtered_df["is_recovered"] == 0]
    elif recovered_filter == "Recovered Only":
        filtered_df = filtered_df[filtered_df["is_recovered"] == 1]

    # --- Bulk Recovery Selection ---
    st.subheader("📋 Transactions")
    
    # Initialize service
    service = RecoveryService()
    
    # Show toast if exists
    if st.session_state.toast:
        if st.session_state.toast["type"] == "success":
            st.success(st.session_state.toast["message"])
        else:
            st.error(st.session_state.toast["message"])
        st.session_state.toast = None

    # --- Table with Checkboxes ---
    selected_ids = []
    for idx, row in filtered_df.iterrows():
        col1, col2, col3, col4, col5 = st.columns([0.5, 1.5, 2, 2, 1.5])
        with col1:
            if row["is_recovered"] == 0:
                checked = st.checkbox("", key=f"cb_{row['id']}")
                if checked:
                    selected_ids.append(row["id"])
        with col2:
            st.write(f"**{row['id']}**")
            st.caption(f"₹{row['amount']/100:,.0f}")
        with col3:
            st.write(f"Status: {row['status'].upper()}")
            if row.get("error_code"):
                st.caption(f"Error: {row['error_code']}")
        with col4:
            if row["is_recovered"] == 1:
                st.success("✅ Recovered")
            else:
                # Load AI diagnosis if available (optional)
                st.info("⏳ Pending")
        with col5:
            if row["is_recovered"] == 0:
                # Single Recover Button (Legacy support)
                if st.button("🚀 Recover", key=f"btn_{row['id']}", type="primary"):
                    with st.spinner("Processing..."):
                        success, msg = service.recover(row["id"], row["amount"]/100, row["customer_email"])
                    if success:
                        show_toast(f"✅ Recovered ₹{row['amount']/100:,.0f}! Link: {msg}", "success")
                        st.rerun()
                    else:
                        show_toast(f"❌ Failed: {msg}", "error")
                        st.rerun()

    # --- Bulk Action Button ---
    if selected_ids:
        st.divider()
        col_b1, col_b2 = st.columns([1, 5])
        with col_b1:
            if st.button("🚀 Recover Selected", type="primary", use_container_width=True):
                progress_bar = st.progress(0, text="Processing recoveries...")
                success_count = 0
                total_count = len(selected_ids)
                
                for i, txn_id in enumerate(selected_ids):
                    # Fetch amount and email from df
                    row = df[df["id"] == txn_id].iloc[0]
                    success, msg = service.recover(txn_id, row["amount"]/100, row["customer_email"])
                    if success:
                        success_count += 1
                    progress_bar.progress((i + 1) / total_count, text=f"Processing {i+1}/{total_count}")
                
                progress_bar.empty()
                show_toast(f"✅ Successfully recovered {success_count} out of {total_count} transactions!", "success")
                st.rerun()
        with col_b2:
            st.write(f"**{len(selected_ids)}** transactions selected for recovery.")

    # --- Audit Trail (Always visible at bottom) ---
    st.divider()
    with st.expander("📜 Audit Trail (Last 20 Actions)", expanded=False):
        audit = get_audit_trail()
        if audit:
            st.dataframe(pd.DataFrame(audit))
        else:
            st.info("No actions logged yet.")

if __name__ == "__main__":
    main()