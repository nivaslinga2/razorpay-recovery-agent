import re
import json
from app.core.logging import logger
from app.services.diagnosis import get_groq_client, MODEL_NAME

NLU_PROMPT = """
You are PayResQ's AI Assistant for payment recovery. Extract structured intent and parameters from the merchant's natural language query.

Output ONLY a valid JSON object. No other text.
Format:
{
  "intent": "recover_payment" | "retry_mandate" | "resend_invoice" | "check_status" | "general_query",
  "transaction_id": "...",
  "customer_id": "...",
  "amount": 0,
  "confidence": 0.0 to 1.0
}

Query: "{query}"
"""

def parse_merchant_query(query: str) -> dict:
    """
    Extracts intent and parameters using Groq LLM with a robust regex/heuristic fallback.
    """
    cleaned_query = query.strip()
    
    # 1. Attempt LLM Parsing via Groq if available
    client = get_groq_client()
    if client:
        try:
            prompt = NLU_PROMPT.format(query=cleaned_query)
            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a payment recovery assistant. Output strictly JSON."},
                    {"role": "user", "content": prompt}
                ],
                model=MODEL_NAME,
                temperature=0.1,
                max_tokens=256,
            )
            content = resp.choices[0].message.content.strip()
            # Clean possible markdown block
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            data = json.loads(content.strip())
            if isinstance(data, dict) and "intent" in data:
                return data
        except Exception as e:
            logger.warning("nlu_llm_fallback", error=str(e))
    
    # 2. Rule-based & Regex Fallback Engine
    q_lower = cleaned_query.lower()
    
    # Extract transaction ID pattern (e.g. txn_ent_0001, txn_123, ord_123, etc.)
    txn_match = re.search(r'\b(txn_[a-zA-Z0-9_]+|ord_[a-zA-Z0-9_]+|pay_[a-zA-Z0-9_]+)\b', cleaned_query, re.IGNORECASE)
    txn_id = txn_match.group(1) if txn_match else None
    
    # If not found with prefix, check for #txn_... or bare #123
    if not txn_id:
        hash_match = re.search(r'#([a-zA-Z0-9_-]+)', cleaned_query)
        if hash_match:
            txn_id = hash_match.group(1)
            
    # Extract amount if present (e.g. ₹500, 500 inr, 500 rupees)
    amount_match = re.search(r'(?:₹|rs\.?|inr)\s*([\d,]+)|([\d,]+)\s*(?:rs|rupees|inr)', cleaned_query, re.IGNORECASE)
    amount = 0
    if amount_match:
        val_str = (amount_match.group(1) or amount_match.group(2) or "0").replace(",", "")
        try:
            amount = float(val_str)
        except ValueError:
            amount = 0

    # Classify intent
    if any(k in q_lower for k in ["mandate", "autopay", "enach", "e-nach", "subscription"]):
        return {
            "intent": "retry_mandate",
            "transaction_id": txn_id,
            "amount": amount,
            "confidence": 0.85
        }
    elif any(k in q_lower for k in ["invoice", "chaser", "receivable", "overdue", "resend"]):
        return {
            "intent": "resend_invoice",
            "transaction_id": txn_id,
            "amount": amount,
            "confidence": 0.85
        }
    elif any(k in q_lower for k in ["status", "check", "track", "audit", "detail"]):
        return {
            "intent": "check_status",
            "transaction_id": txn_id,
            "amount": amount,
            "confidence": 0.80
        }
    elif any(k in q_lower for k in ["recover", "salvage", "failed", "retry", "payment", "link", "collect"]):
        return {
            "intent": "recover_payment",
            "transaction_id": txn_id,
            "amount": amount,
            "confidence": 0.90 if txn_id else 0.60
        }
        
    return {
        "intent": "general_query",
        "transaction_id": txn_id,
        "amount": amount,
        "confidence": 0.40
    }
