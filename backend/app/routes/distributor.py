from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/distributor", tags=["Distributor"])

class CollectionCreate(BaseModel):
    farmer_id: str
    collection_date: date
    quantity_liters: float
    fat_percent: Optional[float] = None
    rate_per_liter: float
    payment_status: str = "pending"

@router.get("/farmers")
async def get_farmers(search: Optional[str] = None, user=Depends(get_current_user)):
    """
    Allow distributors and admins to find farmers for milk collection.
    """
    if user.get("role") not in ["distributor", "malik"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Distributor access required")
        
    supabase = get_supabase_service()
    query = supabase.table("users").select("id, email, full_name, village, phone").eq("role", "user")
    
    if search:
        query = query.ilike("full_name", f"%{search}%")
        
    res = await db(query)
    return res.data

@router.get("/collections")
async def get_collections(user=Depends(get_current_user)):
    """
    Fetch history of collections logged by this distributor.
    """
    if user.get("role") not in ["distributor", "malik"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Distributor access required")
        
    supabase = get_supabase_service()
    query = supabase.table("distributor_collections") \
        .select("*, users!distributor_collections_farmer_id_fkey(full_name, village)") \
        .order("collection_date", desc=True)
        
    if user.get("role") == "distributor":
        query = query.eq("distributor_id", user["id"])
        
    res = await db(query)
    return res.data

@router.post("/collections")
async def log_collection(data: CollectionCreate, user=Depends(get_current_user)):
    """
    Log a new milk collection from a farmer.
    """
    if user.get("role") not in ["distributor", "malik"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Distributor access required")
        
    supabase = get_supabase_service()
    
    try:
        insert_data = data.model_dump()
        insert_data["distributor_id"] = user["id"]
        insert_data["collection_date"] = str(insert_data["collection_date"])
        
        res = await db(supabase.table("distributor_collections").insert(insert_data))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
