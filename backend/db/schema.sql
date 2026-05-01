-- CommilK Database Schema (Custom Auth / FastAPI Managed)

CREATE TYPE user_role AS ENUM ('user', 'distributor', 'malik');
CREATE TYPE buffalo_status AS ENUM ('milking', 'dry', 'pregnant', 'sold', 'dead');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE health_record_type AS ENUM ('vaccination', 'illness', 'checkup', 'deworming', 'other');
CREATE TYPE breeding_method AS ENUM ('natural', 'AI');
CREATE TYPE calf_gender_enum AS ENUM ('male', 'female', 'unknown');
CREATE TYPE ai_role AS ENUM ('user', 'assistant');

-- 1. Custom Users Table (Replaces Supabase Auth)
CREATE TABLE users (
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

-- 2. Create Buffaloes Table
CREATE TABLE buffaloes (
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

-- 3. Create Milk Logs Table
CREATE TABLE milk_logs (
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

-- 4. Create Sales Table
CREATE TABLE sales (
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

-- 5. Create Health Records Table
CREATE TABLE health_records (
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

-- 6. Create Breeding Records Table
CREATE TABLE breeding_records (
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

-- 7. Create Distributor Collections Table
CREATE TABLE distributor_collections (
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

-- 8. Create AI Chat Logs Table
CREATE TABLE ai_chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    role ai_role NOT NULL,
    message TEXT NOT NULL,
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: Since FastAPI acts as the exclusive security gateway handling custom JWTs and enforcing data access, 
-- we do not need Supabase Row Level Security (RLS) for the database layer. 
-- All database queries are executed securely via the Supabase Service Role key inside FastAPI.
