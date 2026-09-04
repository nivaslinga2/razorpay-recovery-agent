import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

try:
    import jwt
    from jwt.exceptions import ExpiredSignatureError, InvalidTokenError, PyJWTError
except ImportError:
    from jose import jwt
    from jose.exceptions import ExpiredSignatureError, JWTError as InvalidTokenError, JWTError as PyJWTError

security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "payresq-enterprise-jwt-super-secret-key-2026")
ALGORITHM = "HS256"

DEMO_TOKENS = {
    "demo-key": "merch_flagship_001",
    "demo_merchant": "merch_flagship_001",
    "merch_flagship_001": "merch_flagship_001",
    os.getenv("MERCHANT_API_KEY", "demo-key"): "merch_flagship_001"
}

def create_jwt_token(merchant_id: str = "merch_flagship_001", expiry_minutes: int = 120) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "merchant_id": merchant_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expiry_minutes)).timestamp())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_merchant(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Header. Provide 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()

    if token in DEMO_TOKENS:
        return DEMO_TOKENS[token]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        merchant_id = payload.get("merchant_id")
        if not merchant_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: merchant_id missing",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return merchant_id
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired. Please generate a new session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (InvalidTokenError, PyJWTError):
        if token == "merch_flagship_001" or token == "demo-key":
            return "merch_flagship_001"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
            headers={"WWW-Authenticate": "Bearer"},
        )
