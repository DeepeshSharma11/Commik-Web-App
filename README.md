# CommilK — Buffalo Dairy Management System

A production-grade multi-panel dairy management system for buffalo farmers in India.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL) — Thread-pool wrapped for full async |
| Auth | Custom JWT (Bcrypt + python-jose) |
| AI | Groq Llama 3.3 70B (RAG + Memory) |
| Email | Resend API → Gmail SMTP fallback |

---

## Features

- **3 Role Panels**: Farmer (user), Distributor, Malik (Admin/Owner)
- **Secure Auth**: Custom bcrypt + JWT — no Supabase Auth dependency
- **IP Blocking**: Auto-blocks IPs after repeated suspicious requests
- **Rate Limiting**: Per-endpoint via `slowapi`
- **AI Assistant**: RAG-powered (reads live farm data) + conversation memory
- **Password Reset**: Resend API primary, Google SMTP fallback
- **Email Queue**: Async background worker with retry logic
- **Fully Asynchronous**: High performance API via `asyncio` and thread-pool DB wrapping
- **Dark / Light Mode**: Persisted across sessions

---

## Project Structure

```
Commilk App/
├── backend/
│   ├── app/
│   │   ├── core/config.py         # All config from .env (no hardcoding)
│   │   ├── db/supabase_client.py  # Service role Supabase client
│   │   ├── dependencies/auth.py   # JWT + bcrypt helpers
│   │   ├── middleware/
│   │   │   └── rate_limiter.py    # IP blocking + rate limiting
│   │   ├── routes/
│   │   │   ├── auth.py            # Register, Login, Forgot/Reset Password
│   │   │   ├── buffaloes.py       # CRUD for buffaloes
│   │   │   ├── milk_logs.py       # Daily milk tracking
│   │   │   ├── sales.py           # Sales management
│   │   │   ├── admin.py           # Malik-only analytics
│   │   │   └── ai_chat.py         # RAG + memory AI chat
│   │   ├── services/
│   │   │   ├── email.py           # Resend → SMTP logic
│   │   │   └── email_queue.py     # Async background email worker
│   │   └── main.py
│   ├── db/
│   │   └── migrations/
│   │       └── 001_master_migration.sql  ← Run in Supabase SQL Editor
│   ├── .env                       # Real keys (gitignored)
│   ├── .env.example               # Key template
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.tsx                # Full UI: Auth + Dashboard + AI Chat
        ├── store.ts               # Zustand global state
        ├── api.ts                 # Axios client with JWT interceptor
        └── index.css
```

---

## Setup

### 1. Database
Open **Supabase SQL Editor** and run the entire file:
```
backend/db/migrations/001_master_migration.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # Fill in your real keys
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables (`.env`)

```env
SECRET_KEY=your_strong_secret
ADMIN_EMAIL=your_admin_email@gmail.com

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_ANON_KEY=sb_publishable_...

GROQ_API_KEY=gsk_...

RESEND_API_KEY=re_...         # Primary email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com      # Fallback email
SMTP_PASSWORD=xxxx xxxx xxxx  # Gmail App Password
EMAIL_FROM=your@gmail.com
FRONTEND_URL=http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register user |
| POST | `/api/v1/auth/login` | — | Login → JWT |
| POST | `/api/v1/auth/forgot-password` | — | Send reset email |
| POST | `/api/v1/auth/reset-password` | — | Reset with token |
| GET | `/api/v1/buffaloes/` | JWT | List buffaloes |
| POST | `/api/v1/buffaloes/` | JWT | Add buffalo |
| GET | `/api/v1/milk-logs/` | JWT | Get milk logs |
| POST | `/api/v1/milk-logs/` | JWT | Log milk |
| GET | `/api/v1/sales/` | JWT | Get sales |
| GET | `/api/v1/admin/analytics` | Malik | Business analytics |
| POST | `/api/v1/ai/chat` | JWT | AI chat (RAG + memory) |

---

## Security Notes

- **No hardcoded keys** anywhere in codebase
- **Admin role** assigned via `ADMIN_EMAIL` env var only
- **Single-use** password reset tokens (expire in 30 min)
- **IP auto-blocking** on repeated 4xx/5xx responses
