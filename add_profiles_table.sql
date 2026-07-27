CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('User', 'Admin')) DEFAULT 'User',
    status TEXT NOT NULL CHECK (status IN ('Hold', 'Active')) DEFAULT 'Hold',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the Super Admin automatically so you have full access
INSERT INTO profiles (email, role, status)
VALUES ('asrafulislamai1983@gmail.com', 'Admin', 'Active')
ON CONFLICT (email) DO NOTHING;

-- Disable RLS so our API can easily query and insert users without complex Auth tokens
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
