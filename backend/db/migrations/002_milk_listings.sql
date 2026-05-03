-- ============================================================
-- CommilK Migration: Milk Listings (Inventory Flow)
-- Run this in Supabase SQL Editor AFTER 001_master_migration.sql
-- ============================================================

-- Milk Listings: Farmers list available milk for distribution/sale
CREATE TABLE IF NOT EXISTS milk_listings (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
    quantity_liters    NUMERIC(8,2)  NOT NULL CHECK (quantity_liters > 0),
    available_liters   NUMERIC(8,2)  NOT NULL CHECK (available_liters >= 0),
    price_per_liter    NUMERIC(6,2)  NOT NULL CHECK (price_per_liter > 0),
    fat_percent        NUMERIC(4,2)  CHECK (fat_percent > 0 AND fat_percent <= 15),
    description        TEXT,
    status             TEXT          NOT NULL DEFAULT 'available'
                                     CHECK (status IN ('available', 'sold_out', 'withdrawn')),
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Milk Orders: Customer purchases from a milk listing (fresh milk)
CREATE TABLE IF NOT EXISTS milk_orders (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id     UUID          NOT NULL REFERENCES milk_listings(id) ON DELETE CASCADE,
    customer_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_id      UUID          NOT NULL REFERENCES users(id),
    quantity_liters NUMERIC(8,2) NOT NULL CHECK (quantity_liters > 0),
    price_per_liter NUMERIC(6,2) NOT NULL,
    total_amount   NUMERIC       GENERATED ALWAYS AS (quantity_liters * price_per_liter) STORED,
    delivery_address TEXT,
    status         TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    payment_status TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (payment_status IN ('pending', 'submitted', 'verified', 'rejected')),
    payment_utr    TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milk_listings_farmer   ON milk_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_milk_listings_status   ON milk_listings(status);
CREATE INDEX IF NOT EXISTS idx_milk_listings_date     ON milk_listings(listing_date DESC);
CREATE INDEX IF NOT EXISTS idx_milk_orders_customer   ON milk_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_milk_orders_listing    ON milk_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_milk_orders_farmer     ON milk_orders(farmer_id);
