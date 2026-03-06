-- Migration: Add patient_id to referrals for direct access
-- and add title column to notes for descriptive note entries

-- 1. Add patient_id to referrals for simpler querying
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;

-- 2. Add title column to notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS title TEXT;

-- 3. Add order_index to milestones for proper ordering
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 4. Add patient_id to notes for direct patient access in dashboard queries
ALTER TABLE notes ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;
