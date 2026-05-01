from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user
import hmac, hashlib, json

router = APIRouter(prefix="/payments", tags=["Payments"])


# ─── Public: fetch active payment settings ──────────────────────────────────
@router.get("/settings")
async def get_payment_settings(user=Depends(get_current_user)):
    """Returns the active UPI payment details for the checkout page."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("payment_settings").select("*").eq("is_active", True).limit(1)
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Payment settings not configured by admin yet.")
    return res.data[0]


# ─── Customer: submit UTR after paying ──────────────────────────────────────
class SubmitUTR(BaseModel):
    order_id: str
    utr: str


@router.post("/submit-utr")
async def submit_utr(data: SubmitUTR, user=Depends(get_current_user)):
    """Customer submits the UPI transaction reference after paying."""
    if user.get("role") != "user":
        raise HTTPException(status_code=403, detail="Customers only")

    utr = data.utr.strip()
    if len(utr) < 6:
        raise HTTPException(status_code=400, detail="Invalid UTR number")

    supabase = get_supabase_service()

    # Verify this order belongs to the customer
    res = await db(
        supabase.table("orders")
        .select("id, customer_id, payment_status")
        .eq("id", data.order_id)
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")

    order = res.data[0]
    if order["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your order")

    if order["payment_status"] == "verified":
        raise HTTPException(status_code=400, detail="Payment already verified")

    # Update order with UTR
    from datetime import datetime, timezone
    await db(
        supabase.table("orders").update({
            "payment_utr": utr,
            "payment_status": "submitted",
            "payment_submitted_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", data.order_id)
    )
    return {"message": "Payment reference submitted. Admin will verify shortly."}


# ─── Webhook endpoint ────────────────────────────────────────────────────────
@router.post("/webhook")
async def payment_webhook(request: Request, x_webhook_secret: Optional[str] = Header(None)):
    """
    Generic webhook endpoint. Receives payment notifications from UPI gateways
    (e.g., Razorpay, Cashfree, etc.) and auto-verifies orders.
    
    To use with a real gateway, set WEBHOOK_SECRET in .env and configure
    the gateway to POST to /api/v1/payments/webhook with that secret header.
    """
    import os
    expected_secret = os.getenv("WEBHOOK_SECRET", "")
    
    body_bytes = await request.body()
    payload = {}

    try:
        payload = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Validate secret if configured
    if expected_secret and x_webhook_secret != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    supabase = get_supabase_service()

    # Log the webhook event regardless
    await db(
        supabase.table("webhook_events").insert({
            "source": payload.get("source", "unknown"),
            "payload": payload,
            "processed": False
        })
    )

    # Try to auto-verify if the payload contains a known UTR/order_id
    order_id = payload.get("order_id") or payload.get("merchant_order_id")
    utr = payload.get("utr") or payload.get("transaction_id") or payload.get("cf_payment_id")
    status = payload.get("status", "").lower()

    if order_id and utr and status in ("success", "captured", "paid"):
        from datetime import datetime, timezone
        res = await db(
            supabase.table("orders").select("id").eq("id", order_id)
        )
        if res.data:
            await db(
                supabase.table("orders").update({
                    "payment_status": "verified",
                    "payment_utr": str(utr),
                    "payment_verified_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", order_id)
            )
            # Mark webhook event as processed
            await db(
                supabase.table("webhook_events")
                .update({"processed": True, "order_id": order_id})
                .eq("order_id", None)  # last inserted
            )

    return {"status": "received"}
