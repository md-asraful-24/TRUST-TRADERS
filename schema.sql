-- SQL Schema for Chemical Factory Full-Stack Web Application

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- 2. ORDER ITEMS TABLE (Single order can have multiple items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit TEXT NOT NULL DEFAULT 'kg', -- kg, Liter, Ton, Drum, etc.
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- Index for items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 3. CHALANS (DELIVERY NOTES) TABLE
CREATE TABLE IF NOT EXISTS chalans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chalan_number TEXT NOT NULL UNIQUE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    chalan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_address TEXT,
    contact_person TEXT,
    phone TEXT,
    vehicle_no TEXT,
    driver_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for chalans
CREATE INDEX IF NOT EXISTS idx_chalans_customer_name ON chalans(customer_name);
CREATE INDEX IF NOT EXISTS idx_chalans_chalan_date ON chalans(chalan_date);
CREATE INDEX IF NOT EXISTS idx_chalans_chalan_number ON chalans(chalan_number);

-- 3.1 CHALAN ITEMS TABLE
CREATE TABLE IF NOT EXISTS chalan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chalan_id UUID NOT NULL REFERENCES chalans(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit TEXT NOT NULL DEFAULT 'kg'
);

CREATE INDEX IF NOT EXISTS idx_chalan_items_chalan_id ON chalan_items(chalan_id);

-- 4. DOCUMENTS TABLE (For tracking PDF/Image file metadata uploaded to Supabase Storage)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path inside the supabase storage bucket
    file_type TEXT, -- e.g. 'application/pdf', 'image/png'
    file_size INTEGER,
    associated_type TEXT NOT NULL CHECK (associated_type IN ('order', 'chalan', 'general')) DEFAULT 'general',
    associated_id UUID, -- References order_id or chalan_id if applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for documents search
CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name);

-- 5. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_chalans_modtime
    BEFORE UPDATE ON chalans
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 6. DISABLE RLS (For local/unauthenticated usage)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE chalans DISABLE ROW LEVEL SECURITY;
ALTER TABLE chalan_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
