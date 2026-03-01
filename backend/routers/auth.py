from fastapi import APIRouter, HTTPException
import os
import hashlib
import secrets
from datetime import datetime
from supabase import create_client
from models.shared import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ["SUPABASE_KEY"])
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production-32chars!!")


def get_db():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def hash_password(password: str) -> str:
    salt = "rift_apps_salt"  # In production use bcrypt
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def make_token(user_id: str) -> str:
    """Simple token: sha256(user_id + JWT_SECRET + random). In production use JWT."""
    nonce = secrets.token_hex(8)
    raw = f"{user_id}:{JWT_SECRET}:{nonce}"
    token = hashlib.sha256(raw.encode()).hexdigest()
    return f"{user_id}:{token}"


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    db = get_db()
    existing = db.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_row = {
        "email": data.email,
        "display_name": data.display_name,
        "password_hash": hash_password(data.password),
        "created_at": datetime.utcnow().isoformat(),
    }

    # Note: add password_hash column to users table in migration
    result = db.table("users").insert(user_row).execute()
    user = result.data[0]
    token = make_token(user["id"])

    return TokenResponse(
        access_token=token,
        user=UserOut(id=user["id"], email=user["email"], display_name=user["display_name"], created_at=user["created_at"])
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    db = get_db()
    result = db.table("users").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    if user.get("password_hash") != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = make_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user["id"], email=user["email"], display_name=user["display_name"], created_at=user["created_at"])
    )
