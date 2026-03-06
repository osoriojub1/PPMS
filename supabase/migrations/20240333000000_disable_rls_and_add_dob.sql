-- Migration: Add DOB and Disable RLS
-- Created: 2024-03-33

-- 1. Add columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_admitted BOOLEAN DEFAULT FALSE;

-- 2. Disable Row Level Security on all core tables to prioritize functionality
-- as requested by the user. SECURITY WARNING: Not suitable for production.

ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 3. Grant full privileges to authenticated users (BHW/MHO)
GRANT ALL ON patients TO authenticated;
GRANT ALL ON pregnancy_cycles TO authenticated;
GRANT ALL ON referrals TO authenticated;
GRANT ALL ON laboratories TO authenticated;
GRANT ALL ON notes TO authenticated;
GRANT ALL ON milestones TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON notifications TO authenticated;
