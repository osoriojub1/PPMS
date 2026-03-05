-- Create Enums
CREATE TYPE cycle_status AS ENUM ('Active', 'Completed');
CREATE TYPE referral_status AS ENUM ('Pending', 'Admitted');
CREATE TYPE lab_status AS ENUM ('Pending', 'Submitted');

-- Create Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  mi VARCHAR(50),
  purok VARCHAR(255),
  barangay VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  contact_no VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Pregnancy Cycles Table
CREATE TABLE IF NOT EXISTS pregnancy_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status cycle_status DEFAULT 'Active',
  estimated_due_date DATE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES pregnancy_cycles(id) ON DELETE CASCADE,
  status referral_status DEFAULT 'Pending',
  referred_by_user_id UUID REFERENCES auth.users(id),
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  admitted_at TIMESTAMPTZ
);

-- Create Laboratories Table
CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES pregnancy_cycles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status lab_status DEFAULT 'Pending',
  results_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES pregnancy_cycles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.user_metadata', true)::jsonb->>'role',
    ''
  );
$$;

-- Helper function to get user barangay
CREATE OR REPLACE FUNCTION get_user_barangay()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.user_metadata', true)::jsonb->>'assigned_barangay',
    ''
  );
$$;

-- RLS Policies for Patients
CREATE POLICY "MHO Admins can access all patients" ON patients
  FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can access their barangay patients" ON patients
  FOR SELECT USING (barangay = get_user_barangay());

CREATE POLICY "BHWs can update their barangay patients" ON patients
  FOR UPDATE USING (barangay = get_user_barangay());

CREATE POLICY "BHWs can insert their barangay patients" ON patients
  FOR INSERT WITH CHECK (barangay = get_user_barangay());

-- RLS Policies for Pregnancy Cycles
CREATE POLICY "MHO Admins can access all cycles" ON pregnancy_cycles
  FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can access their barangay cycles" ON pregnancy_cycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = pregnancy_cycles.patient_id 
      AND patients.barangay = get_user_barangay()
    )
  );

CREATE POLICY "BHWs can insert their barangay cycles" ON pregnancy_cycles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_id 
      AND patients.barangay = get_user_barangay()
    )
  );
  
CREATE POLICY "BHWs can update their barangay cycles" ON pregnancy_cycles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = pregnancy_cycles.patient_id 
      AND patients.barangay = get_user_barangay()
    )
  );

-- RLS Policies for Referrals
CREATE POLICY "MHO Admins can access all referrals" ON referrals
  FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can insert referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_by_user_id);

CREATE POLICY "BHWs can view their referrals" ON referrals
  FOR SELECT USING (auth.uid() = referred_by_user_id);

-- RLS Policies for Laboratories
CREATE POLICY "MHO Admins can access all laboratories" ON laboratories
  FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can view their barangay laboratories" ON laboratories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pregnancy_cycles 
      JOIN patients ON pregnancy_cycles.patient_id = patients.id
      WHERE pregnancy_cycles.id = laboratories.cycle_id 
      AND patients.barangay = get_user_barangay()
    )
  );

-- RLS Policies for Notes
CREATE POLICY "MHO Admins can access all notes" ON notes
  FOR ALL USING (get_user_role() = 'mho_admin');

CREATE POLICY "BHWs can view their barangay notes" ON notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pregnancy_cycles 
      JOIN patients ON pregnancy_cycles.patient_id = patients.id
      WHERE pregnancy_cycles.id = notes.cycle_id 
      AND patients.barangay = get_user_barangay()
    )
  );

CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = author_id);
