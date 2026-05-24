-- ==========================================
-- DATABASE CLEANUP SCRIPT (PRESERVING ADMIN)
-- ==========================================
-- WARNING: Running this script deletes all test data and users
-- except the admin account: Deepeshtech8433@gmail.com

-- 1. Truncate all transactional tables
TRUNCATE TABLE 
    buffaloes, 
    milk_logs, 
    sales, 
    health_records, 
    breeding_records, 
    distributor_collections, 
    ai_chat_logs, 
    password_reset_tokens, 
    orders, 
    order_items, 
    milk_listings, 
    milk_orders,
    notifications,
    support_tickets,
    bulk_order_requests,
    webhook_events,
    payment_settings,
    products
    CASCADE;

-- 2. Delete all users except the target admin
DELETE FROM users 
WHERE email <> 'Deepeshtech8433@gmail.com';

-- 3. Re-seed default catalog products (so E-commerce shop isn't empty)
INSERT INTO products (name, description, price, unit, image, tag) VALUES
('Fresh Buffalo Milk', '100% pure, unadulterated raw buffalo milk directly from our farm. Rich in A2 protein and fat.', 65.00, 'L', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800', 'Bestseller'),
('Pure Desi Ghee', 'Traditional bilona churned ghee made from A2 buffalo milk. Perfect aroma and granular texture.', 850.00, 'kg', 'https://images.unsplash.com/photo-1605296830501-c889781ce7db?auto=format&fit=crop&q=80&w=800', 'Premium'),
('Fresh Farm Paneer', 'Soft, creamy, and freshly prepared paneer. No preservatives or artificial softeners added.', 320.00, 'kg', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&q=80&w=800', NULL);
