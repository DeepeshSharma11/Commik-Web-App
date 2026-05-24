-- Migration: Add settings and preferences columns to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS farm_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_yield_target NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_delivery_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_time_slot TEXT;
