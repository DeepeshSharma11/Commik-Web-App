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

- **3 Role Panels**: Customer (shopping), Seller (farming & collections), Admin (all access)
- **Secure Auth**: Custom bcrypt + JWT — no Supabase Auth dependency
- **IP Blocking**: Auto-blocks IPs after repeated suspicious requests
- **Rate Limiting**: Per-endpoint via `slowapi`
- **AI Assistant**: RAG-powered (reads live farm data) + conversation memory
- **Password Reset**: Resend API primary, Google SMTP fallback
- **Email Queue**: Async background worker with retry logic
- **Fully Asynchronous**: High performance API via `asyncio` and thread-pool DB wrapping
- **Dark / Light Mode**: Persisted across sessions
- **Dynamic UI Engine**: Flexible `SectionLayout` for grids, sliders, and lists
- **Role-Based Navigation**: Dynamic headers, hidden scrollbars, strict RBAC
- **Multi-variant Components**: Adaptive cards that transition gracefully between grid and list modes
- **Interactive UI Feedback**: Global top-level network progress bar, local submit loaders for forms, and bouncing "thinking" dots for streaming AI Chats


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
│   │   │   ├── admin.py           # Admin-only analytics
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
Open **Supabase SQL Editor** and run the master migration files:
```
backend/db/migrations/001_master_migration.sql
backend/db/migrations/008_update_user_roles.sql
```

For production launch preparation, run the cleanup script to wipe all test data and re-seed default products:
```
backend/db/migrations/db_cleanup.sql
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

## Deployment (EC2 + GHCR)

1. Set up GitHub Secrets: `SERVER_IP`, `USER`, `SSH_KEY`, `GITHUB_TOKEN`.
2. Push to `main` branch to trigger CI/CD pipeline.
3. The pipeline builds and pushes the image to GitHub Container Registry (GHCR).
4. The pipeline SSHs into EC2, pulls the image, and runs it on port 8000.
5. Setup Nginx on EC2 and use Certbot to proxy `commilk.focitech.in` to `localhost:8000`.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register user (Phone Number required) |
| POST | `/api/v1/auth/login` | — | Login → JWT |
| POST | `/api/v1/auth/forgot-password` | — | Send reset email |
| POST | `/api/v1/auth/reset-password` | — | Reset with token |
| PUT | `/api/v1/auth/profile` | JWT | Update profile details / preferences |
| POST | `/api/v1/auth/change-password` | JWT | Change password securely |
| GET | `/api/v1/buffaloes/` | JWT | List buffaloes |
| POST | `/api/v1/buffaloes/` | JWT | Add buffalo |
| GET | `/api/v1/milk-logs/` | JWT | Get milk logs |
| POST | `/api/v1/milk-logs/` | JWT | Log milk |
| GET | `/api/v1/sales/` | JWT | Get sales |
| POST | `/api/v1/admin/sellers` | Admin | Create/Upgrade Seller |
| GET | `/api/v1/admin/analytics` | Admin | Business analytics |
| POST | `/api/v1/ai/chat` | JWT | AI chat (Fallback) |
| POST | `/api/v1/ai/chat/stream` | JWT | AI chat (Real-time SSE) |

---

## Security Notes

- **No hardcoded keys** anywhere in codebase
- **Admin role** assigned via `ADMIN_EMAIL` env var only
- **Single-use** password reset tokens (expire in 30 min)
- **IP auto-blocking** on repeated 4xx/5xx responses (proxy-aware supporting X-Forwarded-For / X-Real-IP)
- **Rate limiting** on API endpoints to prevent DDoS and brute-force (proxy-aware)
