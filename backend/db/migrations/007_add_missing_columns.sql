-- 007_add_missing_columns.sql
-- Run this in Supabase SQL Editor to add all missing columns safely

-- Orders table: add updated_at
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Products table: add category
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- Payment Settings table: add created_at
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Users table: add is_active (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Users table: add avatar_url (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Users table: add district (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT;
