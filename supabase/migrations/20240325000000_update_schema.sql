-- Migration: Update Schema to Align with Mock Data
-- Created: 2024-03-25

-- 1. Create New Enums
CREATE TYPE milestone_status AS ENUM ('completed', 'current', 'upcoming');
CREATE TYPE note_type AS ENUM ('subjective', 'objective', 'physician_log');

-- 2. Create Milestones Table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES pregnancy_cycles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  status milestone_status DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance Notes Table
-- Add milestone_id to associate notes with specific milestones
ALTER TABLE notes ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE;
-- Add note_type to distinguish between subjective, objective, and physician logs
ALTER TABLE notes ADD COLUMN IF NOT EXISTS type note_type;
-- Add physician_name for physician logs (optional, can be linked via author_id too)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS physician_name TEXT;

-- 4. Enhance Referrals Table
-- Add findings fields
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS subjective TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS objective TEXT;
-- Add recommended/physician in charge field
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS physician_id UUID REFERENCES auth.users(id);

-- 5. Enhance Laboratories Table
-- Add test details
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS test_name VARCHAR(255);
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS result_text TEXT;

-- 6. Enable RLS for Milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Milestones
CREATE POLICY "MHO Admins can access all milestones" ON milestones
  FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can access their barangay milestones" ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pregnancy_cycles 
      JOIN patients ON pregnancy_cycles.patient_id = patients.id
      WHERE pregnancy_cycles.id = milestones.cycle_id 
      AND patients.barangay = get_user_barangay()
    )
  );

CREATE POLICY "BHWs can update their barangay milestones" ON milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pregnancy_cycles 
      JOIN patients ON pregnancy_cycles.patient_id = patients.id
      WHERE pregnancy_cycles.id = milestones.cycle_id 
      AND patients.barangay = get_user_barangay()
    )
  );

-- 8. Add trigger for updated_at on milestones
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_milestones_updated_at
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
