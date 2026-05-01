import asyncio
import uuid
import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.db.supabase_client import get_supabase_service
from app.db.async_db import db
from app.dependencies.auth import get_current_user

logger = logging.getLogger("commilk.ai_chat")
router = APIRouter(prefix="/ai", tags=["AI Chat (RAG)"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


async def fetch_user_context(supabase, user_id: str) -> str:
    """
    Async RAG: Fetches user info, buffaloes, milk logs, and health records
    concurrently to minimize latency.
    """
    # Fetch user + buffaloes concurrently
    user_res, buf_res = await asyncio.gather(
        db(supabase.table("users").select("full_name, village").eq("id", user_id)),
        db(supabase.table("buffaloes").select("id, name, status, breed").eq("owner_id", user_id)),
    )

    context = []

    if user_res.data:
        u = user_res.data[0]
        context.append(f"Farmer Name: {u['full_name']}, Location: {u.get('village', 'Unknown')}")

    buffaloes = buf_res.data
    if not buffaloes:
        context.append("The farmer currently has no buffaloes registered.")
        return "\n".join(context)

    context.append(f"Registered Buffaloes: {len(buffaloes)}")

    # Fetch milk logs + health records for ALL buffaloes concurrently
    async def fetch_buffalo_detail(b):
        milk_res, health_res = await asyncio.gather(
            db(supabase.table("milk_logs")
               .select("log_date, total_qty_liters")
               .eq("buffalo_id", b["id"])
               .order("log_date", desc=True).limit(3)),
            db(supabase.table("health_records")
               .select("record_type, description, record_date")
               .eq("buffalo_id", b["id"])
               .order("record_date", desc=True).limit(1)),
        )
        info = f"- {b['name']} ({b['breed'] or 'Unknown breed'}): Status is {b['status']}."
        if milk_res.data:
            yields = [f"{m['total_qty_liters']}L on {m['log_date']}" for m in milk_res.data]
            info += f" Recent yields: {', '.join(yields)}."
        if health_res.data:
            h = health_res.data[0]
            info += f" Last health: {h['record_type']} ({h['description']}) on {h['record_date']}."
        return info

    buffalo_details = await asyncio.gather(*[fetch_buffalo_detail(b) for b in buffaloes])
    context.extend(buffalo_details)

    return "\n".join(context)


@router.post("/chat")
async def chat_with_ai(data: ChatRequest, user=Depends(get_current_user)):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=501, detail="AI Not Configured")

    supabase = get_supabase_service()
    session_id = data.session_id or str(uuid.uuid4())

    try:
        # 1. Save user message + fetch RAG context + fetch history — all concurrently
        save_task = db(supabase.table("ai_chat_logs").insert({
            "user_id": user["id"],
            "session_id": session_id,
            "role": "user",
            "message": data.message,
            "model_used": "groq-llama-3.3-70b",
        }))
        context_task = fetch_user_context(supabase, user["id"])
        history_task = db(
            supabase.table("ai_chat_logs")
            .select("role, message")
            .eq("user_id", user["id"])
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(10)
        )

        _, farm_context, history_res = await asyncio.gather(save_task, context_task, history_task)

        # Build conversation history (exclude latest user msg already saved)
        all_history = history_res.data or []
        conversation_history = [
            {"role": m["role"], "content": m["message"]}
            for m in all_history[:-1]
        ]

        # 2. Build prompt
        system_prompt = f"""You are an elite AI assistant for a buffalo dairy farmer using CommilK.
Give practical, highly personalized, concise advice for buffalo health, milk yield, and farming.
Remember everything said in this conversation — reference past context when relevant.

### LIVE FARM DATA ###
{farm_context}
######################
"""
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": data.message})

        # 3. Call Groq async
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": "llama-3.3-70b-versatile", "messages": messages},
            )

        if response.status_code != 200:
            raise Exception(f"Groq API Error: {response.text}")

        ai_reply = response.json()["choices"][0]["message"]["content"]

        # 4. Save AI reply — fire and forget (don't await, response already ready)
        asyncio.ensure_future(db(supabase.table("ai_chat_logs").insert({
            "user_id": user["id"],
            "session_id": session_id,
            "role": "assistant",
            "message": ai_reply,
            "model_used": "groq-llama-3.3-70b",
        })))

        return {
            "reply": ai_reply,
            "session_id": session_id,
            "rag_context_injected": True,
            "memory_messages": len(conversation_history),
        }

    except Exception as e:
        logger.error(f"[AI Chat] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
