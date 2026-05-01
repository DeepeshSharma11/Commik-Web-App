import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/milk-logs", tags=["Milk Logs"])


class MilkLogCreate(BaseModel):
    buffalo_id: str
    log_date: date
    morning_qty_liters: Optional[float] = 0.0
    evening_qty_liters: Optional[float] = 0.0
    fat_percent: Optional[float] = None
    snf_percent: Optional[float] = None
    notes: Optional[str] = None


@router.get("/")
async def get_milk_logs(
    log_date: Optional[date] = None,
    buffalo_id: Optional[str] = None,
    user=Depends(get_current_user)
):
    supabase = get_supabase_service()
    query = supabase.table("milk_logs").select("id, buffalo_id, log_date, session, qty_liters, snf_percent, fat_percent, total_qty_liters, updated_at, created_at")

    if user.get("role") != "malik":
        query = query.eq("logged_by", user["id"])
    if log_date:
        query = query.eq("log_date", str(log_date))
    if buffalo_id:
        query = query.eq("buffalo_id", buffalo_id)

    res = await db(query)
    return res.data


@router.post("/")
async def add_milk_log(data: MilkLogCreate, user=Depends(get_current_user)):
    supabase = get_supabase_service()

    # Verify buffalo ownership — async
    buffalo_check = await db(
        supabase.table("buffaloes").select("owner_id").eq("id", data.buffalo_id)
    )
    if not buffalo_check.data or (
        buffalo_check.data[0]["owner_id"] != user["id"] and user.get("role") != "malik"
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buffalo not found or unauthorized"
        )

    try:
        insert_data = data.model_dump(exclude_unset=True)
        insert_data["logged_by"] = user["id"]
        insert_data["log_date"] = str(insert_data["log_date"])
        res = await db(supabase.table("milk_logs").insert(insert_data))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
