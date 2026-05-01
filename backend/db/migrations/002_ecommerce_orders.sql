-- Run this in your Supabase SQL Editor to support E-Commerce Orders and the new Farmer role

-- 1. Add 'farmer' to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'farmer';

-- 2. Create the Orders table for customers
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    delivery_address TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, confirmed, delivered, cancelled
    payment_method TEXT DEFAULT 'cod',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create the Order Items table to store products within an order
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
