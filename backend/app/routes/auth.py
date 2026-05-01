import logging
from app.core.config import settings
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from app.db.supabase_client import get_supabase_service
from app.dependencies.auth import get_password_hash, verify_password, create_access_token
from app.services.email_queue import enqueue_password_reset
from typing import Optional
import secrets
from datetime import datetime, timedelta, timezone

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
    
    existing = supabase.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pw = get_password_hash(data.password)
    assigned_role = "malik" if data.email.lower() == settings.ADMIN_EMAIL.lower() else "user"
    
    try:
        res = supabase.table("users").insert({
            "email": data.email.lower(),  # Always store lowercase
            "hashed_password": hashed_pw,
            "full_name": data.full_name,
            "phone": data.phone,
            "role": assigned_role
        }).execute()
        return {"message": "Registration successful", "user_id": res.data[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    supabase = get_supabase_service()
    
    res = supabase.table("users").select("*").ilike("email", form_data.username).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    user = res.data[0]
    
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    supabase = get_supabase_service()
    
    res = supabase.table("users").select("id, email").ilike("email", data.email).execute()
    if not res.data:
        # Anti-enumeration: always return same message
        return {"message": "If this email exists, a reset link has been sent."}
    
    user = res.data[0]
    token = secrets.token_urlsafe(48)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    
    try:
        # Invalidate old tokens
        supabase.table("password_reset_tokens").update({"used": True}) \
            .eq("user_id", user["id"]).eq("used", False).execute()
        
        # Store new token
        insert_res = supabase.table("password_reset_tokens").insert({
            "user_id": user["id"],
            "token": token,
            "expires_at": expires_at
        }).execute()
        logger.info(f"[Reset] Token stored for user_id={user['id']}")
    except Exception as e:
        logger.error(f"[Reset] DB Error: {e}")
        raise HTTPException(status_code=500, detail=f"DB Error: {str(e)} — Did you run the migration SQL?")
    
    # Enqueue email (non-blocking, won't crash under load)
    await enqueue_password_reset(user["email"], token)
    
    return {"message": "If this email exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    supabase = get_supabase_service()
    
    # 1. Validate token
    res = supabase.table("password_reset_tokens") \
        .select("*").eq("token", data.token).eq("used", False).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    token_record = res.data[0]
    
    # 2. Check expiry
    expires_at = datetime.fromisoformat(token_record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # 3. Update password
    hashed_pw = get_password_hash(data.new_password)
    supabase.table("users").update({"hashed_password": hashed_pw}) \
        .eq("id", token_record["user_id"]).execute()
    
    # 4. Mark token as used (single-use)
    supabase.table("password_reset_tokens").update({"used": True}) \
        .eq("token", data.token).execute()
    
    return {"message": "Password reset successfully. Please login."}
