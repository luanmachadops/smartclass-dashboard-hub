-- Função para criar escola e vincular ao usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_school_id uuid;
BEGIN
  -- Se o usuário já tem school_id nos metadados, não criar nova escola
  IF NEW.raw_user_meta_data->>'school_id' IS NOT NULL THEN
    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'nome_completo',
      COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'diretor'),
      (NEW.raw_user_meta_data->>'school_id')::uuid
    );
  ELSE
    -- Criar nova escola se nome_escola estiver presente
    IF NEW.raw_user_meta_data->>'nome_escola' IS NOT NULL THEN
      INSERT INTO public.schools (name, owner_id)
      VALUES (NEW.raw_user_meta_data->>'nome_escola', NEW.id)
      RETURNING id INTO new_school_id;

      -- Criar perfil vinculado à nova escola
      INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'nome_completo',
        COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'diretor'),
        new_school_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
