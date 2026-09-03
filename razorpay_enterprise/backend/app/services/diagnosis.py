import json
from app.core.config import settings

MODEL_NAME = "openai/gpt-oss-120b"

def get_groq_client():
    if not settings.GROQ_API_KEY:
        return None
    try:
        from groq import Groq
        return Groq(api_key=settings.GROQ_API_KEY)
    except Exception:
        return None

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
    }
}

def calculate_roi(amount_rupees: float, error: str, model_type: str) -> float:
    """
    Calculates the expected net recovery for a given model.
    We use a heuristic scoring matrix based on error complexity and model strength.
    """
    # Base success probability per error and model
    success_prob = {
        # For common errors, heuristics are 95% accurate. GPT is 96%.
        "BANK_INSUFFICIENT_FUNDS": {"heuristic": 0.95, "groq": 0.94, "gpt": 0.96},
        "USER_TIMEOUT": {"heuristic": 0.92, "groq": 0.93, "gpt": 0.95},
        "CHECKOUT_EXIT": {"heuristic": 0.90, "groq": 0.91, "gpt": 0.94},
        "CARD_DECLINED": {"heuristic": 0.88, "groq": 0.90, "gpt": 0.95},
        # For complex errors, Heuristics is 0%, GPT is 85%.
        "UNAUTHORIZED_TXN": {"heuristic": 0.0, "groq": 0.60, "gpt": 0.85},
        "GATEWAY_TIMEOUT": {"heuristic": 0.10, "groq": 0.70, "gpt": 0.88},
        "UNKNOWN": {"heuristic": 0.0, "groq": 0.40, "gpt": 0.75}
    }
    
    prob = success_prob.get(error, success_prob["UNKNOWN"]).get(model_type, 0)
    cost = {"heuristic": 0.0, "groq": 0.0001, "gpt": 0.002}
    expected_return = (amount_rupees * prob) - cost.get(model_type, 0)
    return expected_return

def smart_router(case: dict) -> str:
    """
    Dynamically routes a case to the model that yields the highest net positive ROI.
    Prevents losing ₹1,000 on complex errors just to save $0.001 in LLM cost.
    """
    amount_rupees = case.get("amount_rupees", 0)
    error = case.get("error", "UNKNOWN")

    roi_heuristic = calculate_roi(amount_rupees, error, "heuristic")
    roi_groq = calculate_roi(amount_rupees, error, "groq")
    roi_gpt = calculate_roi(amount_rupees, error, "gpt")
    
    # Pick the model with the highest positive ROI
    if roi_gpt > roi_groq and roi_gpt > roi_heuristic and roi_gpt > 0:
        return "gpt"
    elif roi_groq > roi_heuristic and roi_groq > 0:
        return "groq"
    elif roi_heuristic > 0:
        return "heuristic"
    else:
        return "ignore"

def diagnose_transaction(error: str, amount: int) -> dict:
    amount_rupees = amount / 100 if amount > 1000 else float(amount)
    
    # Use the Dynamic Cost-Performance Optimizer
    decision = smart_router({"amount_rupees": amount_rupees, "error": error})
    
    # If heuristic wins or error has deterministic solution, return immediately with 0 latency & 0 cost
    if decision == "heuristic" and error in HEURISTIC_MAP:
        return HEURISTIC_MAP[error]
    
    if decision == "ignore":
        return {
            "root_cause": f"Low ROI transaction ({error})",
            "recovery_action": "skip",
            "hinglish_message": "Payment recovery skipped due to negative expected ROI."
        }
    prompt = f"""
    You are Razorpay's Senior Revenue Recovery Expert.
    Error Code: {error}
    Amount in Rupees: ₹{amount_rupees}

    Respond with ONLY a valid JSON object. No extra text.
    Use this exact format:
    {{
      "root_cause": "Brief technical reason for failure",
      "recovery_action": "retry_payment",
      "hinglish_message": "A short, polite recovery message in Hinglish for the customer."
    }}
    """
    client = get_groq_client()
    if client:
        try:
            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a financial recovery expert. Output strictly JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=MODEL_NAME,
                temperature=0.3,
                max_tokens=512,
            )
            return json.loads(resp.choices[0].message.content)
        except Exception:
            pass

    return {
        "root_cause": f"Payment failure ({error})",
        "recovery_action": "retry_payment",
        "hinglish_message": f"Aapki payment of ₹{amount_rupees:,.0f} complete nahi ho payi. Kripya niche diye link se dubara try karein."
    }
