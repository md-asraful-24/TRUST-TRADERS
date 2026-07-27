-- =========================================================================
-- 2026 TRUST TRADERS SUPABASE SECURITY LOCKDOWN SCRIPT
-- =========================================================================
-- INSTRUCTIONS:
-- 1. Copy everything in this file.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste this code and click "Run".
-- =========================================================================

-- Step 1: Enable Row Level Security (RLS) on all tables to instantly block unauthorized queries.
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing insecure public policies (if they exist) to ensure a clean slate.
-- (Note: It's okay if these return errors if policies don't exist yet)
DROP POLICY IF EXISTS "Public Select" ON "public"."orders";
DROP POLICY IF EXISTS "Public Insert" ON "public"."orders";
DROP POLICY IF EXISTS "Public Update" ON "public"."orders";
DROP POLICY IF EXISTS "Public Delete" ON "public"."orders";

-- Step 3: Create Highly Secure Policies using Authenticated Roles.
-- This ensures that only users who are logged in through the proper Supabase Auth system
-- can read or write to the database. The public anon_key will be strictly limited.

-- ORDERS TABLE POLICIES
CREATE POLICY "Enable read access for authenticated users only"
ON "public"."orders" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON "public"."orders" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON "public"."orders" FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
ON "public"."orders" FOR DELETE
TO authenticated
USING (true);

-- ORDER ITEMS TABLE POLICIES
CREATE POLICY "Enable read access for authenticated users only"
ON "public"."order_items" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON "public"."order_items" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON "public"."order_items" FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
ON "public"."order_items" FOR DELETE
TO authenticated
USING (true);

-- DOCUMENTS TABLE POLICIES
CREATE POLICY "Enable read access for authenticated users only"
ON "public"."documents" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON "public"."documents" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
ON "public"."documents" FOR DELETE
TO authenticated
USING (true);

-- Step 4: (OPTIONAL) If you haven't set up standard Supabase Auth yet and want to temporarily 
-- allow public reads but block public inserts/deletes, run the lines below INSTEAD of Step 3:
/*
CREATE POLICY "Allow public read-only access" ON "public"."orders" FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read-only access" ON "public"."order_items" FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read-only access" ON "public"."documents" FOR SELECT TO public USING (true);
*/
