from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from typing import List
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user
from app.routes.notifications import push_notification

router = APIRouter(prefix="/orders", tags=["Orders"])

class OrderItemCreate(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

class OrderCreate(BaseModel):
    delivery_address: str
    time_slot: str
    total_amount: float
    items: List[OrderItemCreate]

    @field_validator("delivery_address")
    @classmethod
    def address_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Delivery address cannot be empty")
        return v.strip()

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: List[OrderItemCreate]) -> List[OrderItemCreate]:
        if not v:
            raise ValueError("Order must contain at least one item")
        return v

    @field_validator("total_amount")
    @classmethod
    def total_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Order total must be greater than 0")
        return round(v, 2)


def _require_customer(user: dict):
    if user.get("role") not in ["customer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can place orders"
        )


@router.post("/")
async def place_order(data: OrderCreate, user=Depends(get_current_user)):
    """Customer places an e-commerce order."""
    _require_customer(user)

    # Verify total_amount matches sum of items (prevent tampered requests)
    computed_total = round(sum(item.price * item.quantity for item in data.items), 2)
    if abs(computed_total - data.total_amount) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Total amount mismatch: expected ₹{computed_total}, got ₹{data.total_amount}"
        )

    supabase = get_supabase_service()

    try:
        order_res = await db(supabase.table("orders").insert({
            "customer_id": user["id"],
            "delivery_address": data.delivery_address,
            "time_slot": data.time_slot,
            "total_amount": data.total_amount,
            "status": "pending",
            "payment_method": "cod"
        }))

        if not order_res.data:
            raise HTTPException(status_code=500, detail="Failed to create order")

        order_id = order_res.data[0]["id"]

        items_data = [
            {
                "order_id": order_id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "price": item.price
            }
            for item in data.items
        ]

        await db(supabase.table("order_items").insert(items_data))

        # Notify customer
        await push_notification(
            user["id"],
            "Order Placed ✅",
            f"Your order of ₹{data.total_amount} has been placed. Please complete UPI payment.",
            type_="success",
            link="/orders"
        )

        return {"message": "Order placed successfully", "order_id": order_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order failed: {str(e)}")


@router.get("/")
async def get_my_orders(user=Depends(get_current_user)):
    """Fetch order history. Customers see own orders; Malik sees all."""
    if user.get("role") not in ["customer", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")

    supabase = get_supabase_service()
    query = (
        supabase.table("orders")
        .select("id, customer_id, delivery_address, time_slot, total_amount, status, payment_status, payment_utr, payment_verified_at, payment_rejected_reason, created_at, updated_at, order_items(id, order_id, product_id, product_name, quantity, price)")
        .order("created_at", desc=True)
        .limit(100)
    )

    if user.get("role") == "customer":
        query = query.eq("customer_id", user["id"])

    res = await db(query)
    return res.data


@router.patch("/{order_id}/cancel")
async def cancel_order(order_id: str, user=Depends(get_current_user)):
    """Cancel an order. Only possible if status is 'pending'."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("orders").select("status, customer_id").eq("id", order_id)
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")

    order = res.data[0]

    # Only owner or admin can cancel
    if user.get("role") != "admin" and order["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your order")

    if order["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel an order with status '{order['status']}'"
        )

    await db(
        supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id)
    )

    # Notify customer
    await push_notification(
        order["customer_id"],
        "Order Cancelled",
        "Your order has been cancelled successfully.",
        type_="info",
        link="/orders"
    )
    return {"message": "Order cancelled successfully"}
