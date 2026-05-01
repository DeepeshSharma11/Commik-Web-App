-- 006_support_and_bulk_orders.sql
-- Create Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    issue_type TEXT NOT NULL, -- 'general', 'payment_dispute'
    description TEXT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- optional, for payment disputes
    utr_reference TEXT, -- optional, for payment disputes
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create Bulk Orders Table
CREATE TABLE IF NOT EXISTS bulk_order_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    estimated_quantity INTEGER NOT NULL,
    requirement_date DATE NOT NULL,
    specific_requirements TEXT,
    status TEXT DEFAULT 'pending_review', -- 'pending_review', 'contacted', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Policies for Support Tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own support tickets"
    ON support_tickets FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'anon');

CREATE POLICY "Users can view their own support tickets"
    ON support_tickets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all support tickets"
    ON support_tickets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('malik')
        )
    );

-- Policies for Bulk Orders
ALTER TABLE bulk_order_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own bulk order requests"
    ON bulk_order_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bulk order requests"
    ON bulk_order_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all bulk order requests"
    ON bulk_order_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('malik')
        )
    );
