from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user
import asyncio

router = APIRouter(prefix="/distributor", tags=["Distributor"])

class CollectionCreate(BaseModel):
    farmer_id: str
    collection_date: date
    quantity_liters: float
    fat_percent: Optional[float] = None
    rate_per_liter: float
    payment_status: str = "pending"

    @field_validator("quantity_liters")
    @classmethod
    def qty_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return round(v, 2)

    @field_validator("rate_per_liter")
    @classmethod
    def rate_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Rate must be greater than 0")
        return round(v, 2)

    @field_validator("fat_percent")
    @classmethod
    def fat_range_check(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 < v <= 15):
            raise ValueError("Fat % must be between 0.1 and 15")
        return v


def _require_seller_or_admin(user: dict):
    if user.get("role") not in ["seller", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller or Admin access required"
        )


@router.get("/farmers")
async def get_farmers(
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    user=Depends(get_current_user)
):
    """Find registered sellers for milk collection."""
    _require_seller_or_admin(user)
    supabase = get_supabase_service()
    query = supabase.table("users").select("id, email, full_name, village, phone").eq("role", "seller")

    if search:
        query = query.ilike("full_name", f"%{search.strip()}%")

    res = await db(query.limit(50))
    return res.data


@router.get("/collections")
async def get_collections(user=Depends(get_current_user)):
    """Fetch history of milk collections. Sellers see their own; Admin sees all."""
    _require_seller_or_admin(user)
    supabase = get_supabase_service()
    query = (
        supabase.table("distributor_collections")
        .select("*, users!distributor_collections_farmer_id_fkey(full_name, village)")
        .order("collection_date", desc=True)
        .limit(200)
    )
    if user.get("role") == "seller":
        query = query.eq("distributor_id", user["id"])

    res = await db(query)
    return res.data


@router.get("/produced-milk")
async def get_produced_milk(
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
    farmer_id: Optional[str]  = Query(None, min_length=1),
    user=Depends(get_current_user)
):
    """List milk production logs from all farmers. Seller & Admin only."""
    _require_seller_or_admin(user)
    supabase = get_supabase_service()

    query = (
        supabase.table("milk_logs")
        .select(
            "id, log_date, total_qty_liters, fat_percent, snf_percent, notes, created_at,"
            " logged_by, users!milk_logs_logged_by_fkey(full_name, village, phone)"
        )
        .order("log_date", desc=True)
        .limit(300)
    )

    if farmer_id:
        query = query.eq("logged_by", farmer_id)
    if from_date:
        query = query.gte("log_date", str(from_date))
    if to_date:
        query = query.lte("log_date", str(to_date))

    res = await db(query)
    return res.data


@router.post("/collections")
async def log_collection(data: CollectionCreate, user=Depends(get_current_user)):
    """Log a new milk collection from a seller."""
    _require_seller_or_admin(user)
    supabase = get_supabase_service()

    # Validate farmer exists and is a seller
    farmer_res = await db(
        supabase.table("users").select("id, role").eq("id", data.farmer_id)
    )
    if not farmer_res.data:
        raise HTTPException(status_code=404, detail="Seller not found")
    if farmer_res.data[0].get("role") != "seller":
        raise HTTPException(status_code=400, detail="Selected user is not a registered seller")

    try:
        amount_due = round(data.quantity_liters * data.rate_per_liter, 2)
        insert_data = data.model_dump()
        insert_data["distributor_id"] = user["id"]
        insert_data["collection_date"] = str(insert_data["collection_date"])
        insert_data["amount_due"] = amount_due

        res = await db(supabase.table("distributor_collections").insert(insert_data))
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
