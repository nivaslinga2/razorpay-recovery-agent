# 💰 Razorpay Revenue Recovery Agent

**AI Agent that detects revenue leaks, diagnoses failures in Hinglish, and recovers lost money—all with a human in the loop.**

---

## 📌 Overview

When a payment fails, a checkout is abandoned, or a subscription lapses, merchants lose money silently. This project is an **AI-powered agent** built for the Razorpay /buildathon that:

1. **Detects** at-risk transactions (failed & abandoned payments).
2. **Diagnoses** the root cause using a Large Language Model (Groq).
3. **Communicates** recovery actions in **Hinglish** (Hindi + English) for Indian merchants.
4. **Executes** the recovery via Razorpay's Test API, but **only after manual approval** (human-in-the-loop).
5. **Logs** every action to an audit trail for compliance.

---

## 🎯 Key Features

- ✅ **Instant Detection**: Scans SQLite database to find failed/abandoned transactions.
- 🧠 **Smart Diagnosis**: Uses `openai/gpt-oss-120b` (via Groq) to explain *why* a payment failed.
- 🗣️ **Hinglish Messaging**: Generates polite, culturally relevant recovery messages (e.g., *"Namaste, aapke ₹49,544 ka payment insufficient funds ki wajah se fail ho gaya hai..."*).
- 🚀 **Bounded Recovery**: Calls Razorpay's Payment Link API to retry the transaction.
- 🛡️ **Human Gating**: Merchant must click "Recover" in the dashboard—nothing happens automatically.
- 📜 **Audit Trail**: Logs every recovery attempt, including timestamps and API responses (compliance-ready).

---

## 🏗️ System Architecture
┌─────────────────────────────────────────────────────────────────┐
│ DATA LAYER (SQLite + Faker) │
│ Generates 100 synthetic transactions with statuses: │
│ captured / failed / abandoned │
└───────────────────────────────┬─────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ COGNITION LAYER (Groq API + LLM) │
│ Takes failed transactions, extracts root cause, outputs │
│ structured JSON with Hinglish recovery message. │
└───────────────────────────────┬─────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────────────┐
│ ACTION LAYER (Streamlit Dashboard + Razorpay SDK) │
│ Displays AI diagnoses to merchant. Merchant clicks "Recover" │
│ → Razorpay Test API creates a payment link for the customer. │
└─────────────────────────────────────────────────────────────────┘


---

## 🛠️ Tech Stack

| Category       | Tools Used                                                                 |
|----------------|----------------------------------------------------------------------------|
| **Language**   | Python 3.12                                                                |
| **Framework**  | Streamlit (UI), LangChain (Prompt Engineering)                             |
| **AI Model**   | `openai/gpt-oss-120b` (via Groq) – fallback: `openai/gpt-oss-20b`          |
| **Payments**   | Razorpay Test API (Payment Link creation)                                  |
| **Database**   | SQLite (local file-based)                                                  |
| **Data Gen**   | Faker (synthetic emails, bank RRNs, merchant data)                         |
| **DevOps**     | Git, Virtual Environment (`venv`)                                          |

---

## 📦 Getting Started

Follow these steps exactly to run the project on your local machine.

### 1. Prerequisites

- **Python 3.12** (Do NOT use Python 3.13 – it has compatibility issues).
  - Check your version: `python --version`
  - Download 3.12 from [python.org](https://www.python.org/downloads/) if needed.
- A **Groq API Key** (Free tier works! Sign up at [console.groq.com](https://console.groq.com)).
- A **Razorpay Test API Key** (Free test mode keys from [dashboard.razorpay.com](https://dashboard.razorpay.com/)).

### 2. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/razorpay-recovery-agent.git
cd razorpay-recovery-agent

# Create a virtual environment (Python 3.12)
python -m venv venv

# Activate it
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
