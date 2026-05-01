from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/buffaloes", tags=["Buffaloes"])


class BuffaloCreate(BaseModel):
    name: str
    tag_number: Optional[str] = None
    breed: Optional[str] = None
    status: str = "milking"


class BuffaloUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def list_buffaloes(user=Depends(get_current_user)):
    supabase = get_supabase_service()
    query = supabase.table("buffaloes").select("id, owner_id, name, breed, dob, purchase_date, purchase_price, status, created_at, updated_at")
    if user.get("role") != "malik":
        query = query.eq("owner_id", user["id"])
    res = await db(query)
    return res.data


@router.post("/")
async def add_buffalo(data: BuffaloCreate, user=Depends(get_current_user)):
    supabase = get_supabase_service()
    try:
        insert_data = data.model_dump(exclude_unset=True)
        insert_data["owner_id"] = user["id"]
        res = await db(supabase.table("buffaloes").insert(insert_data))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{buffalo_id}")
async def update_buffalo(buffalo_id: str, data: BuffaloUpdate, user=Depends(get_current_user)):
    supabase = get_supabase_service()

    existing = await db(
        supabase.table("buffaloes").select("owner_id").eq("id", buffalo_id)
    )
    if not existing.data or (
        existing.data[0]["owner_id"] != user["id"] and user.get("role") != "malik"
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buffalo not found or unauthorized")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No data provided to update"}

    try:
        res = await db(supabase.table("buffaloes").update(update_data).eq("id", buffalo_id))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{buffalo_id}")
async def delete_buffalo(buffalo_id: str, user=Depends(get_current_user)):
    supabase = get_supabase_service()

    # Verify ownership
    existing = await db(supabase.table("buffaloes").select("owner_id").eq("id", buffalo_id))
    if not existing.data or (existing.data[0]["owner_id"] != user["id"] and user.get("role") != "malik"):
        raise HTTPException(status_code=404, detail="Buffalo not found")

    try:
        await db(supabase.table("buffaloes").delete().eq("id", buffalo_id))
        return {"message": "Buffalo deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
