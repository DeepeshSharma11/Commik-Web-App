"""
Async DB helper — wraps sync Supabase calls in asyncio.to_thread()
so they never block the FastAPI event loop.

Usage:
    res = await db(supabase.table("users").select("*").eq("id", uid))
    # res.data is available normally
"""
import asyncio
from typing import Any


async def db(query) -> Any:
    """Run any synchronous Supabase query builder in a thread pool."""
    return await asyncio.to_thread(query.execute)
