-- ============================================================
-- CommilK Master Migration
-- Run this ENTIRE file in Supabase SQL Editor (fresh setup)
-- Supabase Project: foorykkzhchzyfmhvsew
-- Last Updated: 2026-05-01
-- ============================================================

-- ============================================================
-- MIGRATION 001: ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'distributor', 'malik');
CREATE TYPE buffalo_status AS ENUM ('milking', 'dry', 'pregnant', 'sold', 'dead');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE health_record_type AS ENUM ('vaccination', 'illness', 'checkup', 'deworming', 'other');
CREATE TYPE breeding_method AS ENUM ('natural', 'AI');
CREATE TYPE calf_gender_enum AS ENUM ('male', 'female', 'unknown');
CREATE TYPE ai_role AS ENUM ('user', 'assistant');

-- ============================================================
-- MIGRATION 002: CORE TABLES
-- ============================================================

-- Users (Custom Auth — replaces Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    full_name TEXT NOT NULL,
    phone TEXT,
    village TEXT,
    district TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Buffaloes
CREATE TABLE IF NOT EXISTS buffaloes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tag_number TEXT UNIQUE,
    breed TEXT,
    date_of_birth DATE,
    status buffalo_status DEFAULT 'milking',
    purchase_date DATE,
    purchase_price NUMERIC,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Milk Logs
CREATE TABLE IF NOT EXISTS milk_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buffalo_id UUID REFERENCES buffaloes(id) ON DELETE CASCADE,
    logged_by UUID REFERENCES users(id),
    log_date DATE NOT NULL,
    morning_qty_liters NUMERIC(6,2) DEFAULT 0,
    evening_qty_liters NUMERIC(6,2) DEFAULT 0,
    total_qty_liters NUMERIC GENERATED ALWAYS AS (morning_qty_liters + evening_qty_liters) STORED,
    fat_percent NUMERIC(4,2),
    snf_percent NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    sale_date DATE NOT NULL,
    quantity_liters NUMERIC(8,2) NOT NULL,
    price_per_liter NUMERIC(6,2) NOT NULL,
    total_amount NUMERIC GENERATED ALWAYS AS (quantity_liters * price_per_liter) STORED,
    payment_status payment_status DEFAULT 'pending',
    paid_amount NUMERIC DEFAULT 0,
    distributor_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Health Records
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buffalo_id UUID REFERENCES buffaloes(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    record_type health_record_type NOT NULL,
    description TEXT NOT NULL,
    vet_name TEXT,
    cost NUMERIC,
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Breeding Records
CREATE TABLE IF NOT EXISTS breeding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buffalo_id UUID REFERENCES buffaloes(id) ON DELETE CASCADE,
    heat_date DATE,
    insemination_date DATE,
    method breeding_method,
    pregnancy_confirmed BOOLEAN DEFAULT false,
    expected_calving_date DATE,
    actual_calving_date DATE,
    calf_gender calf_gender_enum,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Distributor Collections
CREATE TABLE IF NOT EXISTS distributor_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    collection_date DATE NOT NULL,
    quantity_liters NUMERIC(8,2) NOT NULL,
    fat_percent NUMERIC(4,2),
    rate_per_liter NUMERIC(6,2),
    amount_due NUMERIC GENERATED ALWAYS AS (quantity_liters * rate_per_liter) STORED,
    payment_status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Chat Logs (with session_id for conversation memory)
CREATE TABLE IF NOT EXISTS ai_chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    role ai_role NOT NULL,
    message TEXT NOT NULL,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MIGRATION 003: PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_buffaloes_owner ON buffaloes(owner_id);
CREATE INDEX IF NOT EXISTS idx_milk_logs_buffalo ON milk_logs(buffalo_id);
CREATE INDEX IF NOT EXISTS idx_milk_logs_logged_by ON milk_logs(logged_by);
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON ai_chat_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(seller_id);

-- ============================================================
-- NOTE: No RLS needed. FastAPI + Service Role Key is the sole
-- security gateway. All data isolation enforced in Python code.
-- ============================================================
