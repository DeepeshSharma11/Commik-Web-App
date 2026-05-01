import asyncio
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def verify_password(plain: str, hashed: str) -> bool:
    """Non-blocking bcrypt verify (CPU-bound → thread pool)."""
    return await asyncio.to_thread(
        bcrypt.checkpw, plain.encode("utf-8"), hashed.encode("utf-8")
    )


async def get_password_hash(password: str) -> str:
    """Non-blocking bcrypt hash (CPU-bound → thread pool)."""
    salt = await asyncio.to_thread(bcrypt.gensalt)
    hashed = await asyncio.to_thread(bcrypt.hashpw, password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Async: JWT decode + non-blocking DB lookup."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    supabase = get_supabase_service()
    res = await db(
        supabase.table("users").select("id, email, role, full_name").eq("id", user_id)
    )
    if not res.data:
        raise credentials_exception
    return res.data[0]
