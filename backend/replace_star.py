import os, glob

replacements = {
    'supabase.table("sales").select("*")': 'supabase.table("sales").select("id, amount, date, status, user_id")',
    'supabase.table("products").select("*")': 'supabase.table("products").select("id, name, description, price, unit, category, image, tag, is_active, created_at")',
    'supabase.table("payment_settings").select("*")': 'supabase.table("payment_settings").select("id, upi_id, mobile_number, qr_code_url, is_active, business_name, created_at, updated_at")',
    'select("*, order_items(*)")': 'select("id, customer_id, delivery_address, time_slot, total_amount, status, payment_status, payment_utr, payment_verified_at, payment_rejected_reason, created_at, updated_at, order_items(id, order_id, product_id, product_name, quantity, price)")',
    'supabase.table("notifications").select("*")': 'supabase.table("notifications").select("id, user_id, title, message, type, link, is_read, created_at")',
    'supabase.table("milk_logs").select("*")': 'supabase.table("milk_logs").select("id, buffalo_id, log_date, session, qty_liters, snf_percent, fat_percent, total_qty_liters, updated_at, created_at")',
    'supabase.table("health_records").select("*")': 'supabase.table("health_records").select("id, buffalo_id, record_date, record_type, description, status, next_checkup_date, created_at")',
    'supabase.table("buffaloes").select("*")': 'supabase.table("buffaloes").select("id, owner_id, name, breed, dob, purchase_date, purchase_price, status, created_at, updated_at")',
    'supabase.table("users").select("*")': 'supabase.table("users").select("id, email, password_hash, full_name, phone, village, district, avatar_url, role, is_active, created_at")',
    'select("*, order_items(*), users!orders_customer_id_fkey(full_name, email, phone)")': 'select("id, customer_id, delivery_address, time_slot, total_amount, status, payment_status, payment_utr, payment_verified_at, payment_rejected_reason, created_at, updated_at, order_items(id, product_name, quantity, price), users!orders_customer_id_fkey(full_name, email, phone)")',
    'select("*").eq("token"': 'select("id, user_id, token, expires_at, used, created_at").eq("token"'
}

for root, _, files in os.walk('c:\\Users\\deepe\\Desktop\\Commilk App\\backend\\app'):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for old, new in replacements.items():
                content = content.replace(old, new)
                
            if original_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
