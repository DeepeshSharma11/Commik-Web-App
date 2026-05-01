# Project Context: CommilK (Buffalo Dairy Management System)

## Core Stack
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL) — Supabase Project: `foorykkzhchzyfmhvsew`
- **Auth**: Custom FastAPI Auth (Bcrypt + Python-JOSE JWTs) — **No Supabase Auth**
- **AI Assistant**: RAG-powered (reads live farm data) + conversation memory
- **Password Reset**: Resend API primary, Google SMTP fallback
- **Email Queue**: Asyncio-based background worker with retry logic
- **Fully Asynchronous**: High performance APIs, non-blocking DB calls (`async_db.py`)
- **Dark / Light Mode**: Persisted across sessions
- **Panels**: 3 RBAC roles: `user` (Farmer), `distributor`, `malik` (Admin/Owner)
- **Backend Security**: FastAPI verifies JWTs and is the **sole security gateway**. All DB access via `SUPABASE_SERVICE_ROLE_KEY`.
- **Data Isolation**: Enforced in Python — not at DB level (no RLS). Pattern: `owner_id == user["id"]`.
- **Admin**: `ADMIN_EMAIL` in `.env` auto-assigns `malik` role on registration. Never hardcode.
- **No hardcoded secrets**: All keys in `.env`. Template in `.env.example`.
- **Migration SQL**: All DB queries managed in `backend/db/migrations/001_master_migration.sql`. Run this in Supabase SQL Editor for full setup.

## AI System Architecture
- **RAG**: On each chat, fetches user's buffaloes + last 3 milk logs + last health record per buffalo → injected into system prompt.
- **Memory**: Chat history stored in `ai_chat_logs` with `session_id`. Last 10 messages fetched per session and passed to Groq as conversation history.

## Password Reset Flow
1. `POST /auth/forgot-password` → generates `secrets.token_urlsafe(48)` token → stored in `password_reset_tokens` table → email sent via Resend → SMTP fallback.
2. `POST /auth/reset-password` → validates token expiry (30 min) + single-use flag → updates `hashed_password`.

## Current Progress
- [x] Custom Auth system (bcrypt + python-jose JWTs) — no Supabase Auth
- [x] Rate limiting (slowapi) + IP blocking middleware
- [x] All API routes: auth, buffaloes, milk_logs, sales, admin, ai_chat
- [x] AI Chat with RAG (live farm data) + Conversation Memory (session_id)
- [x] Password reset with Resend (primary) + SMTP (fallback)
- [x] Email Queue (asyncio) for background dispatch with retry logic
- [x] Frontend: Login / Signup / Forgot Password / Reset Password (full flow)
- [x] Frontend: Dashboard with real-time buffalo count, milk yield, AI chat
- [x] Dark/Light mode toggle (persisted via Zustand localStorage)
- [x] Master migration SQL consolidated in `backend/db/migrations/001_master_migration.sql`
- [x] Modular Frontend Routing: Separate Route & Page components for Malik, User, and Distributor
- [x] Admin Dashboard: 👑 Malik Overview with global analytics
- [x] User Dashboard: Daily Milk Log + AI Farmer Assistant
- [ ] Phase 2: Distributor Panel Full Implementation

## File Structure
```
Commilk App/
├── backend/
│   ├── app/
│   │   ├── core/config.py         # Pydantic settings from .env
│   │   ├── db/
│   │   │   ├── async_db.py        # Wrapper for async DB calls
│   │   │   └── supabase_client.py # Service role client
│   │   ├── dependencies/auth.py   # JWT verify, bcrypt helpers
│   │   ├── middleware/rate_limiter.py
│   │   ├── routes/                # auth, buffaloes, milk_logs, sales, admin, ai_chat
│   │   ├── services/
│   │   │   ├── email.py           # Resend → SMTP fallback
│   │   │   └── email_queue.py     # Async background email worker
│   │   └── main.py
│   ├── db/
│   │   └── migrations/
│   │       └── 001_master_migration.sql  ← Run this in Supabase
│   ├── .env                       # Real keys (gitignored)
│   └── .env.example               # Template
└── frontend/
    └── src/
        ├── components/            # ProtectedRoute, etc.
        ├── layouts/               # Main App Layout
        ├── pages/                 # UserDashboard, AdminDashboard, Auth
        ├── routes/                # UserRoutes, AdminRoutes, DistributorRoutes
        ├── App.tsx                # Main Router
        ├── store.ts               # Zustand state
        └── api.ts                 # Axios client
```

> **CRITICAL RULE**: Always read this `Memory.md` before making any project changes.
