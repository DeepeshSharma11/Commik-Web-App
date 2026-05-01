import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin (Malik)"])

@router.get("/users")
async def list_users(user=Depends(get_current_user)):
    # Highly secure route blocking
    if user.get("role") != "malik":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Malik access required")
        
    supabase = get_supabase_service()
    res = await db(
        supabase.table("users").select("id, email, full_name, role, phone, village, is_active, created_at")
    )
    return res.data

@router.get("/analytics")
async def business_analytics(user=Depends(get_current_user)):
    if user.get("role") != "malik":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Malik access required")
        
    supabase = get_supabase_service()
    try:
        # Run independent analytics queries concurrently
        buf_res, logs_res = await asyncio.gather(
            db(supabase.table("buffaloes").select("id", count="exact")),
            db(supabase.table("milk_logs").select("total_qty_liters"))
        )
        
        total_milk = sum(float(log.get("total_qty_liters", 0) or 0) for log in logs_res.data) if logs_res.data else 0
        return {
            "total_buffaloes": buf_res.count if buf_res.count else 0,
            "total_milk_produced": total_milk
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
