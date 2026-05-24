# Project Context: CommilK (Buffalo Dairy Management System)

> [!IMPORTANT]
> **READ `Memory.md` BEFORE MAKING ANY CHANGES.**

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
- **Panels**: 3 RBAC roles: `customer` (Shopping), `seller` (Farmer/Distributor functions), `admin` (Owner/all access)
- **Backend Security**: FastAPI verifies JWTs and is the **sole security gateway**. All DB access via `SUPABASE_SERVICE_ROLE_KEY`.
- **Data Isolation**: Enforced in Python — not at DB level (no RLS). Pattern: `owner_id == user["id"]`.
- **Admin**: `ADMIN_EMAIL` in `.env` auto-assigns `admin` role on registration. Never hardcode.
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
- [x] User Dashboard: Daily Milk Log + AI Farmer Assistant
- [x] Buffalo CRUD: Add, List, and Delete buffaloes in the UI
- [x] Health Records: Log vaccinations, illnesses, and costs for buffaloes
- [x] Admin Dashboard: Malik Command Center with User Directory and Global Stats
- [x] Customer (User) Dashboard: Industry-level E-Commerce storefront for ordering milk products
- [x] Farmer Dashboard (Isolated): Buffalo CRUD & Health Records moved to `FarmerDashboard.tsx`
- [x] Phase 2: Distributor Panel Full Implementation (Farmer Search + Collection Logging)
- [x] Distributor: Produced Milk listing page (`/distributor/produced-milk`) — lists all farmers' milk_logs.
- [x] **Option B — Full Milk Inventory Flow**:
  - DB: `milk_listings` (farmer stock) + `milk_orders` (fresh milk purchases) tables → `002_milk_listings.sql`
  - Backend: `milk_listings.py` route (create, my listings, withdraw, available, all, order, my orders, all orders, update status)
  - Farmer role: `/user/my-listings` → create listings, view stock bar, withdraw. Redirected here on login.
  - Customer: `/user/fresh-milk` → Fresh Milk Market (card grid with stock bar, order modal)
  - Admin: `/admin/fresh-milk-orders` → manage fresh milk orders; Overview shows inventory stats
  - Admin analytics: total_milk_listed, total_milk_available, total_milk_listing_sold, active_listings, fresh_milk_orders, fresh_milk_revenue, fresh_milk_liters_sold
  - Navbar: `farmer` role gets own nav (My Listings, AI Chat). Customer gets "Fresh Milk" tab. Admin gets "Fresh Milk" tab.
- [ ] Phase 3: Analytics & Reporting (Charts, PDF Exports)

- [x] Home Page completely refactored with Tag-based splitting (Bestsellers, Premium)
- [x] ProductCard optimized with two variants (`detailed` vs `compact`)
- [x] Navigation bar overhauled (Role badges updated, scrollbars hidden, AI Chat added globally)
- [x] Backend CI/CD pipeline setup for EC2 deployment (GHCR + Nginx)
- [x] **Admin Role Upgrades**: Added `POST /admin/farmers` and `POST /admin/distributors`. If user exists, their role is upgraded without losing password.
- [x] **AI Chat Streaming**: Refactored `/ai/chat/stream` using Server-Sent Events (SSE). UI now supports real-time streaming and custom markdown rendering (zero dependency).
- [x] **DB Query Stability**: Fixed all `select` statements across models (`buffaloes`, `milk_logs`) to perfectly match the `001_master_migration.sql` schema (removed `dob`, `session` etc).
- [ ] Phase 3: Analytics & Reporting (Charts, PDF Exports)

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
- Split UserDashboard into separate pages (Home, Cart, Checkout, MyOrders, Profile, Support, PaymentIssues, BulkOrders). Centralized Cart state in cartStore.ts
- Split AdminDashboard into separate modular pages (Overview, Users, Orders, Payments, Settings).
- Replaced all select('*') queries with explicit column selections in backend routes.
- Updated email service to prioritize Resend with a smart sandbox fallback (onboarding@resend.dev) when custom domain is not verified, falling back to SMTP if both fail.
- Updated backend CORS settings (ALLOWED_ORIGINS) and FRONTEND_URL in backend/.env to point to emilk.focitech.in.
- Created frontend/.env.production to configure production builds with VITE_API_URL=https://commilk.focitech.in/api/v1.
- Redesigned Auth page to split-screen layout with visual features showcase and polished input styling.
- Overhauled Farmer Dashboard with responsive CSS weekly yield trend chart, breed breakdown analytics, ear-tag styled cattle cards, and edit buffalo capabilities (supported by extending backend BuffaloUpdate model).
- Upgraded Farmer AI Chat to support smooth SSE real-time streaming with markdown rendering.
- Simplified and consolidated system roles to customer, seller, and admin.
- Updated database schema enum, backend routes, and frontend navigation/views to use simplified roles.
- Created `008_update_user_roles.sql` database migration script.
- Implemented unified tabbed Settings Panel for Customer (preferences), Seller (dairy settings), and Admin (UPI payment config).
- Added `PUT /auth/profile` and `POST /auth/change-password` backend endpoints.
- Updated registration validator and signup form to make Phone Number a required field.
- Created `009_add_settings_columns.sql` database migration script.
