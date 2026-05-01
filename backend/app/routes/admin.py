import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator, EmailStr
from typing import Optional
from datetime import datetime, timezone
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user, get_password_hash
from app.routes.notifications import push_notification

router = APIRouter(prefix="/admin", tags=["Admin (Malik)"])


def _require_malik(user: dict):
    if user.get("role") != "malik":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Malik access required")


class CreateDistributorData(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    village: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


@router.post("/distributors", status_code=201)
async def create_distributor(data: CreateDistributorData, user=Depends(get_current_user)):
    """Admin creates a distributor account directly."""
    _require_malik(user)
    supabase = get_supabase_service()

    # Check email not already taken
    existing = await db(supabase.table("users").select("id").ilike("email", data.email))
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = await get_password_hash(data.password)
    payload = {
        "full_name": data.full_name,
        "email": data.email.lower(),
        "hashed_password": hashed,
        "role": "distributor",
        "phone": data.phone,
        "village": data.village,
    }
    res = await db(supabase.table("users").insert(payload))
    new_user = res.data[0]
    return {"message": f"Distributor account created for {new_user['full_name']}", "id": new_user["id"]}


class RoleUpdate(BaseModel):
    role: str


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
    _require_malik(user)
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    allowed = {"user", "farmer", "distributor", "malik"}
    if data.role not in allowed:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {allowed}")
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
    buf_res, logs_res, orders_res, collections_res, users_res = await asyncio.gather(
        db(supabase.table("buffaloes").select("id", count="exact")),
        db(supabase.table("milk_logs").select("total_qty_liters")),
        db(supabase.table("orders").select("id, total_amount, status, payment_status")),
        db(supabase.table("distributor_collections").select("amount_due")),
        db(supabase.table("users").select("id, role")),
    )
    total_milk = sum(float(log.get("total_qty_liters", 0) or 0) for log in (logs_res.data or []))
    total_orders_revenue = sum(
        float(o.get("total_amount", 0) or 0)
        for o in (orders_res.data or [])
        if o.get("status") != "cancelled"
    )
    total_collections_payout = sum(float(c.get("amount_due", 0) or 0) for c in (collections_res.data or []))
    role_counts: dict = {}
    for u in (users_res.data or []):
        r = u.get("role", "unknown")
        role_counts[r] = role_counts.get(r, 0) + 1
    pending_orders = [o for o in (orders_res.data or []) if o.get("status") == "pending"]
    pending_payment = [o for o in (orders_res.data or []) if o.get("payment_status") == "submitted"]
    return {
        "total_buffaloes": buf_res.count or 0,
        "total_milk_produced": round(total_milk, 2),
        "total_orders": len(orders_res.data or []),
        "pending_orders": len(pending_orders),
        "pending_payment_verifications": len(pending_payment),
        "total_orders_revenue": round(total_orders_revenue, 2),
        "total_collections_payout": round(total_collections_payout, 2),
        "user_role_breakdown": role_counts,
    }


@router.get("/orders")
async def get_all_orders(user=Depends(get_current_user)):
    _require_malik(user)
    supabase = get_supabase_service()
    res = await db(
        supabase.table("orders")
        .select("id, customer_id, delivery_address, time_slot, total_amount, status, payment_status, payment_utr, payment_verified_at, payment_rejected_reason, created_at, updated_at, order_items(id, product_name, quantity, price), users!orders_customer_id_fkey(full_name, email, phone)")
        .order("created_at", desc=True)
        .limit(200)
    )
    return res.data


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: dict, user=Depends(get_current_user)):
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


# ─── Payment Settings ─────────────────────────────────────────────────────────

class PaymentSettingsUpdate(BaseModel):
    upi_id: str
    mobile_number: str
    business_name: str
    qr_code_url: Optional[str] = None
    instructions: Optional[str] = None

    @field_validator("upi_id")
    @classmethod
    def validate_upi(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Invalid UPI ID. Must contain '@'")
        return v.strip()

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.isdigit() or len(cleaned) < 10:
            raise ValueError("Invalid mobile number")
        return cleaned


@router.get("/payment-settings")
async def get_payment_settings_admin(user=Depends(get_current_user)):
    _require_malik(user)
    supabase = get_supabase_service()
    res = await db(supabase.table("payment_settings").select("id, upi_id, mobile_number, qr_code_url, is_active, business_name, created_at, updated_at").limit(1))
    return res.data[0] if res.data else {}


@router.put("/payment-settings")
async def update_payment_settings(data: PaymentSettingsUpdate, user=Depends(get_current_user)):
    _require_malik(user)
    supabase = get_supabase_service()
    existing = await db(supabase.table("payment_settings").select("id").limit(1))
    payload = {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}
    if existing.data:
        await db(supabase.table("payment_settings").update(payload).eq("id", existing.data[0]["id"]))
    else:
        await db(supabase.table("payment_settings").insert({**payload, "is_active": True}))
    return {"message": "Payment settings updated"}


# ─── Payment Verification ─────────────────────────────────────────────────────

class PaymentVerdict(BaseModel):
    verdict: str  # "verified" or "rejected"
    reason: Optional[str] = None

    @field_validator("verdict")
    @classmethod
    def validate_verdict(cls, v: str) -> str:
        if v not in ("verified", "rejected"):
            raise ValueError("verdict must be 'verified' or 'rejected'")
        return v


@router.get("/payments")
async def get_payments(user=Depends(get_current_user)):
    """All orders with payment info for admin review."""
    _require_malik(user)
    supabase = get_supabase_service()
    res = await db(
        supabase.table("orders")
        .select(
            "id, total_amount, payment_status, payment_utr, payment_submitted_at, "
            "payment_verified_at, payment_rejected_reason, created_at, "
            "users!orders_customer_id_fkey(full_name, email, phone)"
        )
        .order("payment_submitted_at", desc=True, nullsfirst=False)
        .limit(200)
    )
    return res.data


@router.patch("/payments/{order_id}/verify")
async def verify_payment(order_id: str, data: PaymentVerdict, user=Depends(get_current_user)):
    """Admin verifies or rejects a submitted UTR."""
    _require_malik(user)
    supabase = get_supabase_service()
    res = await db(supabase.table("orders").select("id, payment_status, customer_id").eq("id", order_id))
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    if res.data[0]["payment_status"] not in ("submitted", "pending"):
        raise HTTPException(status_code=400, detail="Nothing to verify")

    now = datetime.now(timezone.utc).isoformat()
    update_payload: dict = {"payment_status": data.verdict}
    if data.verdict == "verified":
        update_payload["payment_verified_at"] = now
        update_payload["status"] = "confirmed"
    else:
        update_payload["payment_rejected_reason"] = data.reason or "Payment verification failed"

    await db(supabase.table("orders").update(update_payload).eq("id", order_id))

    # Notify the customer
    customer_id = res.data[0].get("customer_id")
    if customer_id:
        if data.verdict == "verified":
            await push_notification(
                customer_id,
                "Payment Verified ✅",
                "Your payment has been verified! Your order is now confirmed.",
                type_="success",
                link="/orders"
            )
        else:
            await push_notification(
                customer_id,
                "Payment Rejected ❌",
                f"Your payment could not be verified. Reason: {data.reason or 'Verification failed'}. Please contact support.",
                type_="error",
                link="/orders"
            )

    return {"message": f"Payment {data.verdict}"}
