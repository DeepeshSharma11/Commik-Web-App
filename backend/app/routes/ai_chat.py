from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
import httpx
from app.core.config import settings
from app.db.supabase_client import get_supabase_service
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Chat (RAG)"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # Client sends same session_id to maintain memory

def fetch_user_context(supabase, user_id: str) -> str:
    """
    RAG Retrieval: Fetches user's buffaloes, recent milk logs, and health records 
    to act as structured context for the LLM.
    """
    context = []
    
    # 1. Fetch user info
    user_res = supabase.table("users").select("full_name, village").eq("id", user_id).execute()
    if user_res.data:
        u = user_res.data[0]
        context.append(f"Farmer Name: {u['full_name']}, Location: {u.get('village', 'Unknown')}")
    
    # 2. Fetch buffaloes
    buf_res = supabase.table("buffaloes").select("id, name, status, breed").eq("owner_id", user_id).execute()
    buffaloes = buf_res.data
    
    if not buffaloes:
        context.append("The farmer currently has no buffaloes registered.")
        return "\n".join(context)
        
    context.append(f"Registered Buffaloes: {len(buffaloes)}")
    
    # 3. For each buffalo, fetch recent milk logs and health
    for b in buffaloes:
        buf_info = f"- {b['name']} ({b['breed'] or 'Unknown breed'}): Status is {b['status']}."
        
        # Recent milk (Last 3 logs)
        milk_res = supabase.table("milk_logs").select("log_date, total_qty_liters").eq("buffalo_id", b["id"]).order("log_date", desc=True).limit(3).execute()
        if milk_res.data:
            yields = [f"{m['total_qty_liters']}L on {m['log_date']}" for m in milk_res.data]
            buf_info += f" Recent yields: {', '.join(yields)}."
            
        # Recent health
        health_res = supabase.table("health_records").select("record_type, description, record_date").eq("buffalo_id", b["id"]).order("record_date", desc=True).limit(1).execute()
        if health_res.data:
            h = health_res.data[0]
            buf_info += f" Last health record: {h['record_type']} ({h['description']}) on {h['record_date']}."
            
        context.append(buf_info)
        
    return "\n".join(context)

@router.post("/chat")
async def chat_with_ai(data: ChatRequest, user=Depends(get_current_user)):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=501, detail="AI Not Configured")
        
    supabase = get_supabase_service()
    
    # Generate or reuse session ID for conversation memory
    session_id = data.session_id or str(uuid.uuid4())
        
    try:
        # 1. Save user message with session_id
        supabase.table("ai_chat_logs").insert({
            "user_id": user["id"],
            "session_id": session_id,
            "role": "user",
            "message": data.message,
            "model_used": "groq-llama-3.3-70b"
        }).execute()

        # 2. RAG: Fetch live farm context
        farm_context = fetch_user_context(supabase, user["id"])

        # 3. MEMORY: Fetch last 10 messages from this session
        history_res = supabase.table("ai_chat_logs") \
            .select("role, message") \
            .eq("user_id", user["id"]) \
            .eq("session_id", session_id) \
            .order("created_at", desc=False) \
            .limit(10) \
            .execute()

        # Build conversation history for Groq (exclude the message we just inserted at end)
        conversation_history = []
        all_history = history_res.data or []
        # Exclude the last message (current user message already added)
        for msg in all_history[:-1]:
            conversation_history.append({
                "role": msg["role"],
                "content": msg["message"]
            })

        # 4. Build final messages array: system + history + current message
        system_prompt = f"""You are an elite AI assistant for a buffalo dairy farmer using the CommilK app.
Give practical, highly personalized, and concise advice for buffalo health, milk yield, and farming.
You remember everything the user has said in this conversation — reference past context when relevant.
Use the farm data below to personalize answers.

### LIVE FARM DATA (RAG CONTEXT) ###
{farm_context}
#####################################
"""
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": data.message})

        # 5. Call Groq
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers, json=payload, timeout=20.0
            )
            
        if response.status_code != 200:
            raise Exception(f"Groq API Error: {response.text}")
            
        ai_reply = response.json()["choices"][0]["message"]["content"]
        
        # 6. Save AI reply with same session_id
        supabase.table("ai_chat_logs").insert({
            "user_id": user["id"],
            "session_id": session_id,
            "role": "assistant",
            "message": ai_reply,
            "model_used": "groq-llama-3.3-70b"
        }).execute()
        
        return {
            "reply": ai_reply,
            "session_id": session_id,   # Return to frontend so next message continues same session
            "rag_context_injected": True,
            "memory_messages": len(conversation_history)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
