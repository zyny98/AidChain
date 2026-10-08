from datetime import datetime, timedelta
import uuid
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt

from app.config import settings
from app.models.user import UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

class GoogleAuthRequest(BaseModel):
    id_token: str
    email: str
    name: str

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

@router.post("/google", response_model=TokenResponse)
async def google_login(payload: GoogleAuthRequest):
    """
    Google Social Login (Account Abstraction).
    Creates or retrieves user, generates internal wallet abstraction, returns JWT.
    """
    user_id = uuid.uuid4()
    # Simulated Account Abstraction smart account address derived from user
    smart_wallet_address = f"0x{user_id.hex[:40]}"
    
    token = create_access_token({
        "sub": str(user_id),
        "email": payload.email,
        "role": UserRole.DONOR.value,
        "wallet": smart_wallet_address,
    })

    user_resp = UserResponse(
        id=user_id,
        email=payload.email,
        full_name=payload.name,
        role=UserRole.DONOR,
        wallet_address=smart_wallet_address,
        is_active=True,
        created_at=datetime.utcnow(),
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_resp,
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user_id = uuid.uuid4()
    smart_wallet_address = f"0x{user_id.hex[:40]}"
    role = UserRole.ADMIN if "admin" in payload.email else UserRole.ORGANIZER
    token = create_access_token({
        "sub": str(user_id),
        "email": payload.email,
        "role": role.value,
        "wallet": smart_wallet_address,
    })
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=payload.email,
            full_name=payload.email.split("@")[0],
            role=role,
            wallet_address=smart_wallet_address,
            is_active=True,
            created_at=datetime.utcnow(),
        ),
    )
