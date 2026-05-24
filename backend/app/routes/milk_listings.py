from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, datetime, timezone
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user
import asyncio

router = APIRouter(prefix="/milk-listings", tags=["Milk Listings"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ListingCreate(BaseModel):
    listing_date: date
    quantity_liters: float
    price_per_liter: float
    fat_percent: Optional[float] = None
    description: Optional[str] = None

    @field_validator("quantity_liters")
    @classmethod
    def qty_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Quantity must be > 0")
        return round(v, 2)

    @field_validator("price_per_liter")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be > 0")
        return round(v, 2)

    @field_validator("fat_percent")
    @classmethod
    def fat_range(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not (0 < v <= 15):
            raise ValueError("Fat % must be 0.1–15")
        return v


class MilkOrderCreate(BaseModel):
    listing_id: str
    quantity_liters: float
    delivery_address: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("quantity_liters")
    @classmethod
    def qty_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Quantity must be > 0")
        return round(v, 2)


# ─── Helper ───────────────────────────────────────────────────────────────────

def _require_seller(user: dict):
    if user.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Seller access required")


# ─── Farmer: Create Listing ───────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_listing(data: ListingCreate, user=Depends(get_current_user)):
    """Any user can list their milk available for sale."""
    supabase = get_supabase_service()
    payload = data.model_dump()
    payload["farmer_id"] = user["id"]
    payload["listing_date"] = str(payload["listing_date"])
    payload["available_liters"] = payload["quantity_liters"]  # starts full
    res = await db(supabase.table("milk_listings").insert(payload))
    return res.data[0]


# ─── Farmer: My Listings ──────────────────────────────────────────────────────

@router.get("/my")
async def my_listings(user=Depends(get_current_user)):
    """Any user sees their own listings."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("milk_listings")
        .select("*")
        .eq("farmer_id", user["id"])
        .order("listing_date", desc=True)
        .limit(100)
    )
    return res.data


# ─── Farmer: Withdraw Listing ─────────────────────────────────────────────────

@router.patch("/{listing_id}/withdraw")
async def withdraw_listing(listing_id: str, user=Depends(get_current_user)):
    """Any user withdraws their own listing."""
    supabase = get_supabase_service()
    res = await db(supabase.table("milk_listings").select("farmer_id, status, available_liters").eq("id", listing_id))
    if not res.data:
        raise HTTPException(status_code=404, detail="Listing not found")
    row = res.data[0]
    if row["farmer_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not your listing")
    if row["status"] == "withdrawn":
        raise HTTPException(status_code=400, detail="Already withdrawn")
    await db(supabase.table("milk_listings").update({
        "status": "withdrawn",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", listing_id))
    return {"message": "Listing withdrawn"}


# ─── Public: Available Listings (Customer/Distributor) ────────────────────────

@router.get("/available")
async def get_available_listings(
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
    user=Depends(get_current_user)
):
    """All available milk listings visible to customers and distributors."""
    supabase = get_supabase_service()
    query = (
        supabase.table("milk_listings")
        .select("*, users!milk_listings_farmer_id_fkey(full_name, village, phone)")
        .eq("status", "available")
        .gt("available_liters", 0)
        .order("listing_date", desc=True)
        .limit(200)
    )
    if from_date:
        query = query.gte("listing_date", str(from_date))
    if to_date:
        query = query.lte("listing_date", str(to_date))
    res = await db(query)
    return res.data


# ─── Admin/Distributor: All Listings ──────────────────────────────────────────

@router.get("/all")
async def get_all_listings(
    from_date: Optional[date] = Query(None),
    to_date:   Optional[date] = Query(None),
    user=Depends(get_current_user)
):
    """Admin/Distributor: see all listings regardless of status."""
    if user.get("role") not in ("seller", "admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    supabase = get_supabase_service()
    query = (
        supabase.table("milk_listings")
        .select("*, users!milk_listings_farmer_id_fkey(full_name, village, phone)")
        .order("listing_date", desc=True)
        .limit(300)
    )
    if from_date:
        query = query.gte("listing_date", str(from_date))
    if to_date:
        query = query.lte("listing_date", str(to_date))
    res = await db(query)
    return res.data


# ─── Customer: Place Fresh Milk Order ─────────────────────────────────────────

@router.post("/order", status_code=201)
async def order_fresh_milk(data: MilkOrderCreate, user=Depends(get_current_user)):
    """Customer orders fresh milk from a listing. Deducts available_liters."""
    supabase = get_supabase_service()

    # Fetch listing
    res = await db(supabase.table("milk_listings").select(
        "id, farmer_id, available_liters, price_per_liter, status"
    ).eq("id", data.listing_id))
    if not res.data:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing = res.data[0]

    if listing["status"] != "available":
        raise HTTPException(status_code=400, detail="Listing is not available")
    if float(listing["available_liters"]) < data.quantity_liters:
        raise HTTPException(
            status_code=400,
            detail=f"Only {listing['available_liters']}L available. You requested {data.quantity_liters}L"
        )

    new_available = round(float(listing["available_liters"]) - data.quantity_liters, 2)
    new_status = "sold_out" if new_available <= 0 else "available"

    # Atomic update + insert
    update_task = db(supabase.table("milk_listings").update({
        "available_liters": new_available,
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", data.listing_id))

    order_payload = {
        "listing_id": data.listing_id,
        "customer_id": user["id"],
        "farmer_id": listing["farmer_id"],
        "quantity_liters": data.quantity_liters,
        "price_per_liter": listing["price_per_liter"],
        "delivery_address": data.delivery_address,
        "notes": data.notes,
    }
    insert_task = db(supabase.table("milk_orders").insert(order_payload))

    _, order_res = await asyncio.gather(update_task, insert_task)
    return order_res.data[0]


# ─── Customer: My Fresh Milk Orders ───────────────────────────────────────────

@router.get("/orders/my")
async def my_milk_orders(user=Depends(get_current_user)):
    """Customer sees their own fresh milk orders."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("milk_orders")
        .select("*, milk_listings(listing_date, price_per_liter, fat_percent), users!milk_orders_farmer_id_fkey(full_name, village)")
        .eq("customer_id", user["id"])
        .order("created_at", desc=True)
        .limit(100)
    )
    return res.data


# ─── Admin: All Fresh Milk Orders ─────────────────────────────────────────────

@router.get("/orders/all")
async def all_milk_orders(user=Depends(get_current_user)):
    """Admin sees all fresh milk orders."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    supabase = get_supabase_service()

    # Query 1: orders + listing info + customer info (single users join)
    orders_res = await db(
        supabase.table("milk_orders")
        .select(
            "id, listing_id, farmer_id, quantity_liters, price_per_liter,"
            " total_amount, delivery_address, status, payment_status, notes, created_at,"
            " milk_listings(listing_date, fat_percent),"
            " users!milk_orders_customer_id_fkey(full_name, phone)"
        )
        .order("created_at", desc=True)
        .limit(300)
    )
    orders = orders_res.data or []
    if not orders:
        return []

    # Query 2: batch-fetch farmer info by unique farmer IDs
    farmer_ids = list({o["farmer_id"] for o in orders if o.get("farmer_id")})
    farmers_map: dict = {}
    if farmer_ids:
        f_res = await db(
            supabase.table("users")
            .select("id, full_name, village")
            .in_("id", farmer_ids)
        )
        farmers_map = {f["id"]: f for f in (f_res.data or [])}

    # Merge & rename for frontend consistency
    for o in orders:
        o["users_customer"] = o.pop("users", None)
        o["users_farmer"]   = farmers_map.get(o.get("farmer_id"))

    return orders



# ─── Admin: Update Fresh Milk Order Status ────────────────────────────────────

@router.patch("/orders/{order_id}/status")
async def update_milk_order_status(order_id: str, payload: dict, user=Depends(get_current_user)):
    """Admin confirms/delivers/cancels a fresh milk order."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    new_status = payload.get("status")
    if new_status not in ("pending", "confirmed", "delivered", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    supabase = get_supabase_service()
    await db(supabase.table("milk_orders").update({
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", order_id))
    return {"message": f"Order status updated to '{new_status}'"}
