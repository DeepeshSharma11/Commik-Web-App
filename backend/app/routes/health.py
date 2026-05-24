from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/health", tags=["Health Records"])

class HealthRecordCreate(BaseModel):
    buffalo_id: str
    record_date: date
    record_type: str
    description: str
    cost: Optional[float] = 0.0

@router.get("/{buffalo_id}")
async def get_health_records(buffalo_id: str, user=Depends(get_current_user)):
    supabase = get_supabase_service()
    
    # Verify buffalo ownership
    buffalo = await db(supabase.table("buffaloes").select("owner_id").eq("id", buffalo_id))
    if not buffalo.data or (buffalo.data[0]["owner_id"] != user["id"] and user.get("role") != "admin"):
         raise HTTPException(status_code=404, detail="Buffalo not found")
         
    res = await db(supabase.table("health_records").select("id, buffalo_id, record_date, record_type, description, status, next_checkup_date, created_at").eq("buffalo_id", buffalo_id).order("record_date", desc=True))
    return res.data

@router.post("/")
async def add_health_record(data: HealthRecordCreate, user=Depends(get_current_user)):
    supabase = get_supabase_service()
    
    # Verify buffalo ownership
    buffalo = await db(supabase.table("buffaloes").select("owner_id").eq("id", data.buffalo_id))
    if not buffalo.data or (buffalo.data[0]["owner_id"] != user["id"] and user.get("role") != "admin"):
         raise HTTPException(status_code=404, detail="Buffalo not found")
         
    try:
        insert_data = data.model_dump()
        insert_data["record_date"] = str(insert_data["record_date"])
        res = await db(supabase.table("health_records").insert(insert_data))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
