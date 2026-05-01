import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin (Malik)"])


def _require_malik(user: dict):
    if user.get("role") != "malik":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Malik access required")


class RoleUpdate(BaseModel):
    role: str

    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"user", "farmer", "distributor", "malik"}
        if v not in allowed:
            raise ValueError(f"Role must be one of: {allowed}")
        return v


@router.get("/users")
async def list_users(user=Depends(get_current_user)):
    _require_malik(user)
    supabase = get_supabase_service()
    res = await db(
        supabase.table("users")
        .select("id, email, full_name, role, phone, village, created_at")
        .order("created_at", desc=True)
    )
    return res.data


@router.patch("/users/{user_id}/role")
async def change_user_role(user_id: str, data: RoleUpdate, user=Depends(get_current_user)):
    """Admin can promote/demote any user's role."""
    _require_malik(user)
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    supabase = get_supabase_service()
    res = await db(supabase.table("users").select("id").eq("id", user_id))
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")

    await db(supabase.table("users").update({"role": data.role}).eq("id", user_id))
    return {"message": f"Role updated to '{data.role}'"}


@router.get("/analytics")
async def business_analytics(user=Depends(get_current_user)):
    _require_malik(user)
    supabase = get_supabase_service()

    # Run all analytics concurrently
    buf_res, logs_res, orders_res, collections_res, users_res = await asyncio.gather(
        db(supabase.table("buffaloes").select("id", count="exact")),
        db(supabase.table("milk_logs").select("total_qty_liters")),
        db(supabase.table("orders").select("id, total_amount, status")),
        db(supabase.table("distributor_collections").select("amount_due")),
        db(supabase.table("users").select("id, role")),
    )

    total_milk = sum(float(log.get("total_qty_liters", 0) or 0) for log in (logs_res.data or []))
    total_orders_revenue = sum(float(o.get("total_amount", 0) or 0) for o in (orders_res.data or []) if o.get("status") != "cancelled")
    total_collections_payout = sum(float(c.get("amount_due", 0) or 0) for c in (collections_res.data or []))

    role_counts = {}
    for u in (users_res.data or []):
        r = u.get("role", "unknown")
        role_counts[r] = role_counts.get(r, 0) + 1

    pending_orders = [o for o in (orders_res.data or []) if o.get("status") == "pending"]

    return {
        "total_buffaloes": buf_res.count or 0,
        "total_milk_produced": round(total_milk, 2),
        "total_orders": len(orders_res.data or []),
        "pending_orders": len(pending_orders),
        "total_orders_revenue": round(total_orders_revenue, 2),
        "total_collections_payout": round(total_collections_payout, 2),
        "user_role_breakdown": role_counts,
    }


@router.get("/orders")
async def get_all_orders(user=Depends(get_current_user)):
    """Malik sees all customer orders with items."""
    _require_malik(user)
    supabase = get_supabase_service()
    res = await db(
        supabase.table("orders")
        .select("*, order_items(*), users!orders_customer_id_fkey(full_name, email, phone)")
        .order("created_at", desc=True)
        .limit(200)
    )
    return res.data


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: dict, user=Depends(get_current_user)):
    """Malik can update order status."""
    _require_malik(user)
    new_status = status_update.get("status")
    allowed_statuses = {"pending", "confirmed", "delivered", "cancelled"}
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {allowed_statuses}")

    supabase = get_supabase_service()
    res = await db(supabase.table("orders").select("id").eq("id", order_id))
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")

    await db(supabase.table("orders").update({"status": new_status}).eq("id", order_id))
    return {"message": f"Order status updated to '{new_status}'"}
