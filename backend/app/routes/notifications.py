from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def get_notifications(user=Depends(get_current_user)):
    """Fetch the 20 most recent notifications for the logged-in user."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(20)
    )
    return res.data


@router.get("/unread-count")
async def unread_count(user=Depends(get_current_user)):
    """Returns count of unread notifications."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("user_id", user["id"])
        .eq("is_read", False)
    )
    return {"count": res.count or 0}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    """Mark a single notification as read."""
    supabase = get_supabase_service()
    res = await db(
        supabase.table("notifications")
        .select("id, user_id")
        .eq("id", notification_id)
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    if res.data[0]["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    await db(
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
    )
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    """Mark all notifications as read for the logged-in user."""
    supabase = get_supabase_service()
    await db(
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("user_id", user["id"])
        .eq("is_read", False)
    )
    return {"ok": True}


# ── Internal helper (call from other routes) ─────────────────────────────────
async def push_notification(user_id: str, title: str, message: str, type_: str = "info", link: str | None = None):
    """Create a notification for a user. Call this from order/payment routes."""
    supabase = get_supabase_service()
    await db(
        supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": type_,
            "link": link,
        })
    )
