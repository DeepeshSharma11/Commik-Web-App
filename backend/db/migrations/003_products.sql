-- Create products table for E-commerce store
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'L', 'kg', 'pack'
    image TEXT, -- URL to the image
    tag TEXT, -- e.g., 'Bestseller', 'Premium'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial real data so the store isn't empty right away
INSERT INTO products (name, description, price, unit, image, tag) VALUES
('Fresh Buffalo Milk', '100% pure, unadulterated raw buffalo milk directly from our farm. Rich in A2 protein and fat.', 65.00, 'L', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800', 'Bestseller'),
('Pure Desi Ghee', 'Traditional bilona churned ghee made from A2 buffalo milk. Perfect aroma and granular texture.', 850.00, 'kg', 'https://images.unsplash.com/photo-1605296830501-c889781ce7db?auto=format&fit=crop&q=80&w=800', 'Premium'),
('Fresh Farm Paneer', 'Soft, creamy, and freshly prepared paneer. No preservatives or artificial softeners added.', 320.00, 'kg', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&q=80&w=800', NULL);
