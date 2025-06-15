
-- Helper function to get the school_id of the first school, used for migrating existing data.
-- This might already exist from a previous migration, so we use CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION get_first_school_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  first_school_id uuid;
BEGIN
  SELECT id INTO first_school_id FROM public.schools ORDER BY created_at LIMIT 1;
  RETURN first_school_id;
END;
$$;

-- Update existing profiles that don't have a school_id yet
UPDATE public.profiles SET school_id = get_first_school_id() WHERE school_id IS NULL;

-- Drop the helper function as it's no longer needed for regular operations
DROP FUNCTION get_first_school_id();

-- Drop the existing restrictive policy on profiles
DROP POLICY IF EXISTS "Users can see profiles from their own school" ON public.profiles;

-- Create a new policy that allows users to see their own profile AND other profiles from their school
CREATE POLICY "Users can view profiles in their school"
ON public.profiles
FOR SELECT
USING (id = auth.uid() OR school_id = get_my_school_id());
