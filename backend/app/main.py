from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.middleware.rate_limiter import limiter, IPBlockMiddleware
from app.services.email_queue import start_worker, stop_worker

from app.routes import auth, buffaloes, milk_logs, sales, admin, ai_chat, distributor, health, orders, products, payments

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch email queue worker
    await start_worker()
    yield
    # Shutdown: drain queue then stop
    await stop_worker()

app = FastAPI(
    title="CommilK API",
    description="Backend API for CommilK Buffalo Dairy Management System",
    version=settings.API_VERSION,
    lifespan=lifespan
)

# Register API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(buffaloes.router, prefix="/api/v1")
app.include_router(milk_logs.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(ai_chat.router, prefix="/api/v1")
app.include_router(distributor.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")

# 1. Rate Limiting Setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. CORS Setup (Secure configuration)
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. IP Block Middleware (Hacker/Abuse Protection)
app.add_middleware(IPBlockMiddleware)

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "Welcome to CommilK API. System is running."}

@app.get("/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    return {"status": "ok", "environment": settings.ENVIRONMENT}
