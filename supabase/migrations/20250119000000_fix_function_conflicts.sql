-- =================================================================
-- CORREÇÃO DE CONFLITOS ENTRE FUNÇÕES RLS
-- =================================================================
-- Este script resolve o conflito entre as funções antigas (get_my_school_id, get_my_role)
-- e a nova função get_my_claim, garantindo que apenas uma abordagem seja usada.

-- PASSO 1: Remover as funções antigas que causam conflito
DROP FUNCTION IF EXISTS public.get_my_school_id();
DROP FUNCTION IF EXISTS public.get_my_role();

-- PASSO 2: Garantir que a função get_my_claim está corretamente definida
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> claim, '');
$$ LANGUAGE sql STABLE;

-- PASSO 3: Atualizar a função handle_new_user para garantir que o app_metadata seja definido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_school_id uuid;
  user_role TEXT;
BEGIN
  -- Cenário 1: Novo Diretor criando uma nova escola
  IF NEW.raw_user_meta_data->>'school_id' IS NULL AND NEW.raw_user_meta_data->>'nome_escola' IS NOT NULL THEN
    -- Cria a nova escola
    INSERT INTO public.schools (name, owner_id)
    VALUES (NEW.raw_user_meta_data->>'nome_escola', NEW.id)
    RETURNING id INTO new_school_id;

    -- Cria o perfil do diretor para a nova escola
    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', 'diretor', new_school_id);
    
    -- IMPORTANTE: Atualizar app_metadata do usuário para JWT claims
    UPDATE auth.users 
    SET app_metadata = jsonb_build_object(
      'school_id', new_school_id,
      'user_role', 'diretor'
    )
    WHERE id = NEW.id;

  -- Cenário 2: Novo usuário sendo convidado para uma escola existente
  ELSIF NEW.raw_user_meta_data->>'school_id' IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'aluno');
    new_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;

    -- Cria o perfil para o novo usuário
    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', user_role, new_school_id);

    -- IMPORTANTE: Atualizar app_metadata do usuário para JWT claims
    UPDATE auth.users 
    SET app_metadata = jsonb_build_object(
      'school_id', new_school_id,
      'user_role', user_role
    )
    WHERE id = NEW.id;

    -- Se for um aluno, cria a entrada na tabela de alunos
    IF user_role = 'aluno' THEN
      INSERT INTO public.alunos (user_id, nome, email, school_id)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', NEW.email, new_school_id);
    -- Se for um professor, cria a entrada na tabela de professores
    ELSIF user_role = 'professor' THEN
      INSERT INTO public.professores (user_id, nome, email, school_id)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', NEW.email, new_school_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- PASSO 4: Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- PASSO 5: Atualizar app_metadata para usuários existentes que não têm
-- (Isso é importante para usuários criados antes desta correção)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT u.id, p.school_id, p.tipo_usuario
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE u.app_metadata IS NULL OR u.app_metadata = '{}'
    LOOP
        UPDATE auth.users 
        SET app_metadata = jsonb_build_object(
            'school_id', user_record.school_id,
            'user_role', user_record.tipo_usuario
        )
        WHERE id = user_record.id;
    END LOOP;
END;
$$;

-- PASSO 6: Comentário de verificação
-- Para verificar se a correção funcionou, execute:
-- SELECT id, email, app_metadata FROM auth.users LIMIT 5;
-- Todos os usuários devem ter app_metadata com school_id e user_role

COMMENT ON FUNCTION public.handle_new_user() IS 'Função corrigida que cria perfis e define app_metadata para JWT claims';
COMMENT ON FUNCTION get_my_claim(TEXT) IS 'Função para acessar claims do JWT de forma segura';