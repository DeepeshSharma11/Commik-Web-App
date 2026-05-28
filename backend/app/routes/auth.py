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
from app.services.email_queue import enqueue_password_reset, enqueue_signup_otp

logger = logging.getLogger("commilk.auth")
router = APIRouter(prefix="/auth", tags=["Auth"])


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    role: str = "customer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str


@router.post("/register")
async def register_user(data: UserRegister):
    supabase = get_supabase_service()

    # Check duplicate — async
    existing = await db(supabase.table("users").select("id").ilike("email", data.email))
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password — async (CPU-bound in thread pool)
    hashed_pw = await get_password_hash(data.password)
    assigned_role = "admin" if data.email.lower() == settings.ADMIN_EMAIL.lower() else data.role

    # Generate 6-digit verification code
    otp = "".join(secrets.choice("0123456789") for _ in range(6))
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    try:
        # Clear any existing pending signups for this email to prevent conflict
        await db(supabase.table("signup_otps").delete().eq("email", data.email.lower()))

        # Save signup info + OTP
        await db(supabase.table("signup_otps").insert({
            "email": data.email.lower(),
            "hashed_password": hashed_pw,
            "full_name": data.full_name,
            "phone": data.phone,
            "role": assigned_role,
            "otp": otp,
            "expires_at": expires_at
        }))

        # Queue the verification email
        await enqueue_signup_otp(data.email.lower(), otp)
        
        return {"message": "Verification code sent to your email"}
    except Exception as e:
        logger.error(f"[Register] Error during register: {e}")
        raise HTTPException(status_code=400, detail="Registration failed. Please try again.")


@router.post("/verify-otp")
async def verify_otp(data: VerifyOtpRequest):
    supabase = get_supabase_service()

    # Fetch OTP record
    res = await db(
        supabase.table("signup_otps")
        .select("id, email, hashed_password, full_name, phone, role, otp, expires_at")
        .eq("email", data.email.lower())
        .eq("otp", data.otp.strip())
    )

    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    otp_record = res.data[0]

    expires_at = datetime.fromisoformat(otp_record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        # Delete expired OTP
        await db(supabase.table("signup_otps").delete().eq("id", otp_record["id"]))
        raise HTTPException(status_code=400, detail="Verification code has expired. Please sign up again.")

    # Check duplicate in users
    existing = await db(supabase.table("users").select("id").ilike("email", otp_record["email"]))
    if existing.data:
        await db(supabase.table("signup_otps").delete().eq("id", otp_record["id"]))
        raise HTTPException(status_code=400, detail="Email already registered")

    # Insert into users table and clean up OTP record
    try:
        assigned_role = "admin" if otp_record["email"].lower() == settings.ADMIN_EMAIL.lower() else otp_record["role"]

        # Insert user & delete OTP record concurrently
        insert_res, _ = await asyncio.gather(
            db(supabase.table("users").insert({
                "email": otp_record["email"].lower(),
                "hashed_password": otp_record["hashed_password"],
                "full_name": otp_record["full_name"],
                "phone": otp_record["phone"],
                "role": assigned_role,
            })),
            db(supabase.table("signup_otps").delete().eq("id", otp_record["id"]))
        )

        new_user = insert_res.data[0]
        access_token = create_access_token(data={"sub": new_user["id"], "role": new_user["role"]})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": new_user["role"],
            "message": "Account verified and created successfully!"
        }
    except Exception as e:
        logger.error(f"[VerifyOTP] Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Error creating account. Please try again.")


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
    res = await db(
        supabase.table("users")
        .select("id, email, full_name, phone, village, district, avatar_url, role, farm_name, daily_yield_target, preferred_delivery_address, preferred_time_slot, created_at")
        .eq("id", user["id"])
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data[0]


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    avatar_url: Optional[str] = None
    # Seller specific
    farm_name: Optional[str] = None
    daily_yield_target: Optional[float] = None
    # Customer specific
    preferred_delivery_address: Optional[str] = None
    preferred_time_slot: Optional[str] = None


@router.put("/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    supabase = get_supabase_service()
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No data provided to update"}
    try:
        res = await db(supabase.table("users").update(update_data).eq("id", user["id"]))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
async def change_password(data: ChangePasswordRequest, user=Depends(get_current_user)):
    supabase = get_supabase_service()
    
    # Fetch user's current password hash
    res = await db(supabase.table("users").select("hashed_password").eq("id", user["id"]))
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_record = res.data[0]
    if not await verify_password(data.old_password, user_record["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    hashed_pw = await get_password_hash(data.new_password)
    await db(supabase.table("users").update({"hashed_password": hashed_pw}).eq("id", user["id"]))
    return {"message": "Password updated successfully"}
