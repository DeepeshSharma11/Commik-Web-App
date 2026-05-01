-- Password Reset Tokens Table
-- Run this in Supabase SQL Editor (add to existing schema)

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-cleanup: index for fast token lookup
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
