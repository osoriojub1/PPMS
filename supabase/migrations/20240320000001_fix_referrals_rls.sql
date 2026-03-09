-- Update Referrals RLS to allow BHWs to see all referrals in their assigned barangay
-- This replaces the restrictive "own referrals only" policy with a barangay-wide policy

DROP POLICY IF EXISTS "BHWs can view their referrals" ON referrals;

CREATE POLICY "BHWs can view their barangay referrals" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pregnancy_cycles 
      JOIN patients ON pregnancy_cycles.patient_id = patients.id
      WHERE pregnancy_cycles.id = referrals.cycle_id 
      AND patients.barangay = get_user_barangay()
    )
  );
