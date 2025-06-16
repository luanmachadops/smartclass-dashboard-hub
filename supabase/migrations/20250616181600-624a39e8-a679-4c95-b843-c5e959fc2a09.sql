
-- 1. Cria a tabela de escolas, se não existir
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT schools_pkey PRIMARY KEY (id)
);

-- 2. Adiciona RLS para a tabela schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own school" ON public.schools
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can update their own school" ON public.schools
FOR UPDATE USING (owner_id = auth.uid());

-- 3. Cria ou atualiza a função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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

-- 4. Remove o trigger antigo e cria o novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Garante que a função get_my_school_id está funcionando corretamente
CREATE OR REPLACE FUNCTION public.get_my_school_id()
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
