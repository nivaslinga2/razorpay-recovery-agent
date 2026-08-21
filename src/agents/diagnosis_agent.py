# src/agents/diagnosis_agent.py
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Initialize the raw Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# The model we will use (picked from your list)
MODEL_NAME = "openai/gpt-oss-120b"  # If you hit rate limits, change to "openai/gpt-oss-20b"

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