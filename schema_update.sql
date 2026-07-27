-- SQL Schema Update for Supabase Migration

-- 1. CUSTOM USERS TABLE (Since we are keeping your custom Auth logic)
CREATE TABLE IF NOT EXISTS custom_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'User',
    status TEXT NOT NULL DEFAULT 'Hold',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching transactions by company
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- 3. APP SETTINGS TABLE (Single row to store global settings)
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    theme JSONB DEFAULT '{}'::jsonb,
    company_info JSONB DEFAULT '{}'::jsonb,
    companies JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default global settings row if it doesn't exist
INSERT INTO app_settings (id, theme, company_info, companies) 
VALUES (
    'global', 
    '{"primary": "#0d9488", "backgroundDark": "#0f172a", "backgroundLight": "#f8fafc", "backgroundImageUrl": "", "heroTitleGradient": "from-teal-400 to-emerald-300", "heroLogoBackground": "bg-slate-900/40 backdrop-blur-md"}'::jsonb,
    '{"facebook": "", "mobile": "", "mobile2": "", "email": "", "location": "", "footerText": "", "heroBannerUrl": "", "logoUrl": "", "heroSubtitle": ""}'::jsonb,
    '["Ovi Tex", "Alif Dyeing", "General Archive"]'::jsonb
) 
ON CONFLICT (id) DO NOTHING;

-- 4. DISABLE RLS (For simple access without Supabase Auth headers)
ALTER TABLE custom_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
