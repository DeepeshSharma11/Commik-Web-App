-- Migration: Update user roles to customer, seller, admin and update dependent policies

-- Drop the dependent policies first
DROP POLICY IF EXISTS "Admins can view and update all support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view and update all bulk order requests" ON bulk_order_requests;

-- 1. Rename existing enum
ALTER TYPE user_role RENAME TO user_role_old;

-- 2. Create new enum
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');

-- 3. Alter users table column role to use the new enum
ALTER TABLE users 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role USING (
    CASE role::text
      WHEN 'user' THEN 'customer'::user_role
      WHEN 'farmer' THEN 'seller'::user_role
      WHEN 'distributor' THEN 'seller'::user_role
      WHEN 'malik' THEN 'admin'::user_role
      ELSE 'customer'::user_role
    END
  ),
  ALTER COLUMN role SET DEFAULT 'customer'::user_role;

-- 4. Drop old enum type
DROP TYPE user_role_old;

-- 5. Recreate the policies referencing the new 'admin' role
CREATE POLICY "Admins can view and update all support tickets"
    ON support_tickets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin')
        )
    );

CREATE POLICY "Admins can view and update all bulk order requests"
    ON bulk_order_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin')
        )
    );
