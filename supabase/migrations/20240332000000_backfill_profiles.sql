-- Migration: Backfill profiles table for existing users
-- Since the profiles table and trigger were added after the initial admin account
-- was created, the admin account might be missing from the profiles table.
-- Because get_user_role() now checks the profiles table directly, the admin
-- loses access to all data if their profile doesn't exist.

INSERT INTO public.profiles (id, full_name, role, barangay, email, username)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'role',
  raw_user_meta_data->>'barangay',
  email,
  raw_user_meta_data->>'username'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  barangay = EXCLUDED.barangay,
  email = EXCLUDED.email,
  username = EXCLUDED.username;
