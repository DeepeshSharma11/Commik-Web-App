-- Migration: Create signup_otps table for email verification during registration
CREATE TABLE IF NOT EXISTS signup_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_signup_otps_email_otp ON signup_otps(email, otp);
