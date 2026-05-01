from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/sales", tags=["Sales"])

class SaleCreate(BaseModel):
    buyer_name: str
    sale_date: date
    quantity_liters: float
    price_per_liter: float
    payment_status: str = "pending"
    paid_amount: Optional[float] = 0.0

@router.get("/")
async def get_sales(user=Depends(get_current_user)):
    supabase = get_supabase_service()
    query = supabase.table("sales").select("id, amount, date, status, user_id")
    
    # Secure role-based filtering
    if user.get("role") == "user":
        query = query.eq("seller_id", user["id"])
    elif user.get("role") == "distributor":
        query = query.eq("distributor_id", user["id"])
        
    res = await db(query)
    return res.data

@router.post("/")
async def add_sale(data: SaleCreate, user=Depends(get_current_user)):
    supabase = get_supabase_service()
    try:
        insert_data = data.model_dump(exclude_unset=True)
        insert_data["seller_id"] = user["id"]
        insert_data["sale_date"] = str(insert_data["sale_date"])
        
        res = await db(supabase.table("sales").insert(insert_data))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
