import logging
import secrets
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.email_queue import enqueue_password_reset

logger = logging.getLogger("commilk.auth")
router = APIRouter(prefix="/auth", tags=["Auth"])


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "user"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/register")
async def register_user(data: UserRegister):
    supabase = get_supabase_service()

    # Check duplicate — async
    existing = await db(supabase.table("users").select("id").ilike("email", data.email))
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password — async (CPU-bound in thread pool)
    hashed_pw = await get_password_hash(data.password)
    assigned_role = "malik" if data.email.lower() == settings.ADMIN_EMAIL.lower() else "user"

    try:
        res = await db(supabase.table("users").insert({
            "email": data.email.lower(),
            "hashed_password": hashed_pw,
            "full_name": data.full_name,
            "phone": data.phone,
            "role": assigned_role,
        }))
        return {"message": "Registration successful", "user_id": res.data[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    supabase = get_supabase_service()

    res = await db(supabase.table("users").select("id, email, hashed_password, full_name, phone, village, district, avatar_url, role, is_active, created_at").ilike("email", form_data.username))
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = res.data[0]

    # Verify password — async (CPU-bound in thread pool)
    if not await verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    supabase = get_supabase_service()

    res = await db(supabase.table("users").select("id, email").ilike("email", data.email))
    if not res.data:
        return {"message": "If this email exists, a reset link has been sent."}

    user = res.data[0]
    token = secrets.token_urlsafe(48)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()

    try:
        # Invalidate old tokens + insert new — run concurrently
        await asyncio.gather(
            db(supabase.table("password_reset_tokens")
               .update({"used": True})
               .eq("user_id", user["id"]).eq("used", False)),
            db(supabase.table("password_reset_tokens").insert({
                "user_id": user["id"],
                "token": token,
                "expires_at": expires_at,
            }))
        )
        logger.info(f"[Reset] Token stored for user_id={user['id']}")
    except Exception as e:
        logger.error(f"[Reset] DB Error: {e}")
        raise HTTPException(status_code=500, detail=f"DB Error: {str(e)}")

    await enqueue_password_reset(user["email"], token)
    return {"message": "If this email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    supabase = get_supabase_service()

    res = await db(
        supabase.table("password_reset_tokens")
        .select("id, user_id, token, expires_at, used, created_at").eq("token", data.token).eq("used", False)
    )
    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    token_record = res.data[0]

    expires_at = datetime.fromisoformat(token_record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    # Hash + update password + mark token used — concurrently
    hashed_pw = await get_password_hash(data.new_password)

    await asyncio.gather(
        db(supabase.table("users")
           .update({"hashed_password": hashed_pw})
           .eq("id", token_record["user_id"])),
        db(supabase.table("password_reset_tokens")
           .update({"used": True})
           .eq("token", data.token))
    )

    return {"message": "Password reset successfully. Please login."}

@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    supabase = get_supabase_service()
    res = await db(supabase.table("users").select("id, email, full_name, phone, village, district, avatar_url, role, created_at").eq("id", user["id"]))
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data[0]
