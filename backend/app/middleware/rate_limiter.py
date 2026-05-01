import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Standard Rate Limiter Setup
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# In-memory IP blocklist for Hacker/Abuse Protection (Phase 1)
# Note: In a scalable production environment, this should be moved to Redis.
failed_requests_tracker = defaultdict(lambda: {"count": 0, "blocked_until": 0})
BLOCK_THRESHOLD = 20      # Number of suspicious/failed attempts before blocking
BLOCK_DURATION = 300      # Block duration in seconds (5 minutes)

class IPBlockMiddleware(BaseHTTPMiddleware):
    """
    Middleware to block IPs that exhibit malicious behavior or hit 400+ errors excessively.
    """
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        
        # Check if IP is currently blocked
        tracker = failed_requests_tracker[client_ip]
        if time.time() < tracker["blocked_until"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your IP has been temporarily blocked due to suspicious activity."
            )
            
        # Proceed with request
        response = await call_next(request)
        
        # Track 4xx and 5xx errors (indicative of brute-force, unauthorized access)
        if response.status_code >= 400:
            tracker["count"] += 1
            if tracker["count"] >= BLOCK_THRESHOLD:
                tracker["blocked_until"] = time.time() + BLOCK_DURATION
                tracker["count"] = 0 # Reset count after blocking
        else:
            # Successful request resets suspicious count
            tracker["count"] = max(0, tracker["count"] - 1)
            
        return response
