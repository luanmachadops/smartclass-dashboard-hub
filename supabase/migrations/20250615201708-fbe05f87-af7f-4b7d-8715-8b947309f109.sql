
-- 1. Create a table to manage schools (tenants)
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on the schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Add a policy to ensure school owners can manage their own school
CREATE POLICY "Owners can manage their own school"
ON public.schools
FOR ALL
USING (auth.uid() = owner_id);


-- 2. Add a school_id column to the profiles table to link users to a school
ALTER TABLE public.profiles
ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;


-- 3. Create a helper function to securely get the current user's school_id
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT school_id
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;


-- 4. Update the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_school_id uuid;
BEGIN
  -- Create a new school using the name provided at sign-up
  INSERT INTO public.schools (name, owner_id)
  VALUES (NEW.raw_user_meta_data->>'nome_escola', NEW.id)
  RETURNING id INTO new_school_id;

  -- Create the user's profile and link them to the newly created school
  INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', 'diretor', new_school_id);

  RETURN NEW;
END;
$$;


-- 5. Update RLS policies for conversations to enforce school tenancy
DROP POLICY IF EXISTS "Allow authenticated users to create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations in their school"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (school_id = get_my_school_id());

DROP POLICY IF EXISTS "Allow users to view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations from their school if they are a participant"
ON public.conversations
FOR SELECT
TO authenticated
USING (school_id = get_my_school_id() AND public.user_can_access_conversation(id));
