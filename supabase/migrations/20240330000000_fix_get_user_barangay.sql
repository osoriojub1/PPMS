-- Migration: Fix get_user_barangay function
-- Update the helper function to look for the correct 'barangay' key in the JWT user_metadata
-- instead of 'assigned_barangay', to match how user management creates accounts.

CREATE OR REPLACE FUNCTION get_user_barangay()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.user_metadata', true)::jsonb->>'barangay',
    ''
  );
$$;
