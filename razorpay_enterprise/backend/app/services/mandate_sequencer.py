from datetime import datetime, timedelta

class MandateState:
    def __init__(self, mandate_id: str, retry_count: int = 0, last_attempt: datetime = None, max_retries: int = 3):
        self.mandate_id = mandate_id
        self.retry_count = retry_count
        self.last_attempt = last_attempt
        self.max_retries = max_retries
        self.bank_working_hours = (9, 17)  # 09:00 to 17:00 IST

def get_ist_time() -> datetime:
    """Returns current Indian Standard Time (UTC + 5:30)."""
    return datetime.utcnow() + timedelta(hours=5, minutes=30)

def should_retry_mandate(mandate_state: MandateState, allow_force: bool = False) -> tuple[bool, str]:
    if allow_force:
        return True, "READY_FORCE"

    if mandate_state.retry_count >= mandate_state.max_retries:
        return False, "MAX_RETRIES_EXHAUSTED"

    now_ist = get_ist_time()
    if now_ist.hour < mandate_state.bank_working_hours[0] or now_ist.hour >= mandate_state.bank_working_hours[1]:
        return False, "OUTSIDE_BANK_HOURS"

    if mandate_state.last_attempt:
        hours_since_last = (now_ist - mandate_state.last_attempt).total_seconds() / 3600.0
        if hours_since_last < 4.0:
            remaining_minutes = int((4.0 - hours_since_last) * 60)
            return False, f"COOLDOWN_ACTIVE ({remaining_minutes}m remaining)"

    return True, "READY"

def get_next_optimal_window(mandate_state: MandateState) -> datetime:
    """Calculates the exact next optimal window for e-mandate execution."""
    now_ist = get_ist_time()
    
    # If in cooldown
    if mandate_state.last_attempt:
        cooldown_end = mandate_state.last_attempt + timedelta(hours=4)
        if cooldown_end > now_ist:
            next_time = cooldown_end
        else:
            next_time = now_ist
    else:
        next_time = now_ist

    # Adjust to 09:00 IST if outside banking hours
    if next_time.hour >= 17:
        next_time = (next_time + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
    elif next_time.hour < 9:
        next_time = next_time.replace(hour=9, minute=0, second=0, microsecond=0)

    return next_time
