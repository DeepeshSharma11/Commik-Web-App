-- Payment settings table (admin manages UPI details)
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upi_id TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT 'CommilK Dairy',
    qr_code_url TEXT,
    instructions TEXT DEFAULT 'Scan the QR code or use the UPI ID to pay. Enter the UTR/Transaction ID below to confirm your order.',
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial payment settings (replace with your real values)
INSERT INTO payment_settings (upi_id, mobile_number, business_name, qr_code_url)
VALUES (
    'yourname@upi',
    '9999999999',
    'CommilK Dairy',
    NULL
)
ON CONFLICT DO NOTHING;

-- Add payment columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
-- pending = not yet paid, submitted = UTR entered by customer, verified = admin verified, failed = rejected

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_utr TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_submitted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejected_reason TEXT;

-- Webhook events log (for audit trail)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,          -- e.g., 'upi_gateway', 'manual'
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast admin payment lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
