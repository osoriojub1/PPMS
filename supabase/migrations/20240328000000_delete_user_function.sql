-- Function to allow MHO admins to delete users from auth.users
-- SECURITY DEFINER runs with the privileges of the function owner (postgres),
-- allowing it to delete from auth.users which normal users can't access.

CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only allow mho_admin users to call this
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'mho_admin' THEN
    RAISE EXCEPTION 'Only MHO administrators can delete user accounts';
  END IF;

  -- Prevent self-deletion
  IF auth.uid() = user_id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Delete from auth.users (cascades to profiles via FK)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
