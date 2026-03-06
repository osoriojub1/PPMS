-- Migration: Update helper functions to query profiles table instead of JWT
-- JWT claims can become stale or might be missing if accounts were created
-- before recent metadata fixes. The profiles table is the source of truth.

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION get_user_barangay()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT barangay FROM public.profiles WHERE id = auth.uid()),
    ''
  );
$$;
