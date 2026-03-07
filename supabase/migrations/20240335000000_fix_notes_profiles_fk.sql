-- Missing Foreign Key Relationship for Notes and Profiles
-- This allows Supabase (PostgREST) to correctly execute:
-- supabase.from('notes').select('*, profiles(full_name)')

ALTER TABLE notes
ADD CONSTRAINT fk_notes_profiles
FOREIGN KEY (author_id)
REFERENCES profiles(id)
ON DELETE SET NULL;
