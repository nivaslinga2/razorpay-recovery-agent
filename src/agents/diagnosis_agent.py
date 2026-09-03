# src/agents/diagnosis_agent.py
import os
import json
from pathlib import Path
from dotenv import load_dotenv
try:
    from groq import Groq
except ImportError:
    Groq = None

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Initialize the raw Groq client safely
client = Groq(api_key=os.getenv("GROQ_API_KEY")) if (Groq and os.getenv("GROQ_API_KEY")) else None

# The model we will use (picked from your list)
MODEL_NAME = "openai/gpt-oss-120b"  # If you hit rate limits, change to "openai/gpt-oss-20b"

HEURISTIC_MAP = {
    "BANK_INSUFFICIENT_FUNDS": {
        "root_cause": "Customer has insufficient funds in account",
        "recovery_action": "send_reminder",
        "hinglish_message": "Sir, aapke account me funds kam the. Balance add karke dobara try karein."
    },
    "USER_TIMEOUT": {
        "root_cause": "Customer took too long on checkout screen",
        "recovery_action": "send_reminder",
        "hinglish_message": "Aapka checkout session expire ho gaya. Kripya niche diye link se complete karein."
    },
    "CHECKOUT_EXIT": {
        "root_cause": "Customer closed payment window",
        "recovery_action": "send_reminder",
        "hinglish_message": "Aapki payment incomplete reh gayi thi. Kripya yahan click karke complete karein."
    },
    "CARD_DECLINED": {
        "root_cause": "Card declined by issuing bank",
        "recovery_action": "retry_payment",
        "hinglish_message": "Aapka card bank ne decline kiya. Kripya dusra card ya UPI use karein."
    },
    "UNAUTHORIZED_TXN": {
        "root_cause": "Transaction not authorized by user/bank",
        "recovery_action": "retry_payment",
        "hinglish_message": "Transaction authenticate nahi ho payi. Kripya dubara OTP daal kar try karein."
    }
}

def cheap_heuristic_router(error_code: str):
    if not error_code:
        return None
    return HEURISTIC_MAP.get(error_code, None)

def calculate_roi(amount_rupees: float, error: str, model_type: str) -> float:
    """
    Calculates the expected net recovery for a given model.
    We use a simple heuristic scoring matrix (can be trained later).
    """
    success_prob = {
        "BANK_INSUFFICIENT_FUNDS": {"heuristic": 0.95, "groq": 0.94, "gpt": 0.96},
        "USER_TIMEOUT": {"heuristic": 0.92, "groq": 0.93, "gpt": 0.95},
        "CHECKOUT_EXIT": {"heuristic": 0.90, "groq": 0.91, "gpt": 0.94},
        "CARD_DECLINED": {"heuristic": 0.88, "groq": 0.90, "gpt": 0.95},
        "UNAUTHORIZED_TXN": {"heuristic": 0.0, "groq": 0.60, "gpt": 0.85},
        "UNKNOWN": {"heuristic": 0.0, "groq": 0.40, "gpt": 0.75}
    }
    
    prob = success_prob.get(error, success_prob["UNKNOWN"]).get(model_type, 0)
    cost = {"heuristic": 0.0, "groq": 0.0001, "gpt": 0.002}
    expected_return = (amount_rupees * prob) - cost.get(model_type, 0)
    return expected_return

def smart_router(case: dict) -> str:
    roi_heuristic = calculate_roi(case.get("amount_rupees", 0), case.get("error", "UNKNOWN"), "heuristic")
    roi_groq = calculate_roi(case.get("amount_rupees", 0), case.get("error", "UNKNOWN"), "groq")
    roi_gpt = calculate_roi(case.get("amount_rupees", 0), case.get("error", "UNKNOWN"), "gpt")
    
    if roi_gpt > roi_groq and roi_gpt > roi_heuristic and roi_gpt > 0:
        return "gpt"
    elif roi_groq > roi_heuristic and roi_groq > 0:
        return "groq"
    elif roi_heuristic > 0:
        return "heuristic"
    else:
        return "ignore"


def diagnose_risk_cases():
    risk_path = BASE_DIR / "risk_payload.json"
    with open(risk_path, "r") as f:
        risk_cases = json.load(f)

    enriched_cases = []
    print(f"🧠 Starting diagnosis for {len(risk_cases)} cases using {MODEL_NAME}...")

    for i, case in enumerate(risk_cases[:20]):  # Process first 20 to save credits
        error = case.get("error", "UNKNOWN")
        amount = case.get("amount_rupees", 0)
        status = case.get("status", "failed")

        # The CTO's specific prompt to force JSON + Hinglish
        user_prompt = f"""
        You are Razorpay's Senior Revenue Recovery Expert.
        Transaction Status: {status}
        Error Code: {error}
        Amount in Rupees: ₹{amount}

        Respond with ONLY a valid JSON object. No extra text.
        Use this exact format:
        {{
          "root_cause": "Brief technical reason for failure",
          "recovery_action": "retry_payment" or "send_reminder" or "contact_support",
          "hinglish_message": "A short, polite recovery message in Hinglish (Hindi + English mix) for the customer."
        }}
        """

        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a financial recovery expert. Output strictly JSON."},
                    {"role": "user", "content": user_prompt}
                ],
                model=MODEL_NAME,
                              temperature=0.3,
                max_tokens=1024,
                # Removing response_format strict validation for now to avoid token cut-off,
                # we will parse it manually with json.loads() as we already do.
            )

            # Parse the JSON response
            diagnosis = json.loads(chat_completion.choices[0].message.content)

            enriched_case = {
                **case,
                "ai_diagnosis": diagnosis.get("root_cause", "Unknown"),
                "recovery_action": diagnosis.get("recovery_action", "contact_support"),
                "hinglish_message": diagnosis.get("hinglish_message", "Kripya support team se contact karein.")
            }
            enriched_cases.append(enriched_case)
            print(f"✅ Diagnosed {case['transaction_id']}: {diagnosis.get('root_cause', '')[:30]}...")

        except Exception as e:
            print(f"❌ Failed for {case['transaction_id']}: {str(e)}")
            # Graceful failure fallback
            enriched_cases.append({
                **case,
                "ai_diagnosis": "System parsing error, manual review needed.",
                "recovery_action": "contact_support",
                "hinglish_message": "Sir, aapki payment fail hui. Kripya support team ko call karein."
            })

    output_path = BASE_DIR / "diagnosed_risks.json"
    with open(output_path, "w") as f:
        json.dump(enriched_cases, f, indent=2)

    print(f"💾 Saved {len(enriched_cases)} enriched diagnoses to diagnosed_risks.json")
    return enriched_cases

if __name__ == "__main__":
    diagnose_risk_cases()