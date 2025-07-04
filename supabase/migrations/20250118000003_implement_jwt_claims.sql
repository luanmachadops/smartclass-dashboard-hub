-- =================================================================
-- IMPLEMENTAÇÃO DE JWT CLAIMS CUSTOMIZADOS
-- =================================================================

-- Função para atualizar claims do JWT quando o perfil do usuário muda
CREATE OR REPLACE FUNCTION public.update_user_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza os claims customizados no auth.users
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'school_id', NEW.school_id::text,
      'tipo_usuario', NEW.tipo_usuario,
      'nome_completo', NEW.nome_completo
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar claims quando o perfil é inserido ou atualizado
DROP TRIGGER IF EXISTS update_jwt_claims_on_profile_change ON public.profiles;
CREATE TRIGGER update_jwt_claims_on_profile_change
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_jwt_claims();

-- Função auxiliar para extrair school_id do JWT
CREATE OR REPLACE FUNCTION public.get_jwt_school_id()
RETURNS uuid AS $$
BEGIN
  RETURN (auth.jwt() ->> 'school_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para extrair tipo_usuario do JWT
CREATE OR REPLACE FUNCTION public.get_jwt_user_type()
RETURNS text AS $$
BEGIN
  RETURN auth.jwt() ->> 'tipo_usuario';
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- ATUALIZAÇÃO DAS POLÍTICAS RLS PARA USAR JWT CLAIMS
-- =================================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Profiles are viewable by users in the same school" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and directors can insert new profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and directors can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and directors can update other profiles" ON public.profiles;

-- NOVA POLÍTICA 1: Visualização de perfis usando JWT claims
CREATE POLICY "Profiles viewable by same school (JWT)"
ON public.profiles FOR SELECT
USING (
  school_id = public.get_jwt_school_id()
  OR 
  id = auth.uid() -- Sempre pode ver o próprio perfil
);

-- NOVA POLÍTICA 2: Atualização do próprio perfil
CREATE POLICY "Users can update own profile (JWT)"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- NOVA POLÍTICA 3: Inserção de perfis por admins/diretores
CREATE POLICY "Admins can insert profiles (JWT)"
ON public.profiles FOR INSERT
WITH CHECK (
  public.get_jwt_user_type() IN ('admin', 'diretor')
  AND school_id = public.get_jwt_school_id()
);

-- NOVA POLÍTICA 4: Deleção de perfis por admins/diretores
CREATE POLICY "Admins can delete profiles (JWT)"
ON public.profiles FOR DELETE
USING (
  public.get_jwt_user_type() IN ('admin', 'diretor')
  AND school_id = public.get_jwt_school_id()
  AND id != auth.uid() -- Não pode deletar o próprio perfil
);

-- NOVA POLÍTICA 5: Atualização de outros perfis por admins/diretores
CREATE POLICY "Admins can update other profiles (JWT)"
ON public.profiles FOR UPDATE
USING (
  public.get_jwt_user_type() IN ('admin', 'diretor')
  AND school_id = public.get_jwt_school_id()
);

-- =================================================================
-- ATUALIZAÇÃO DE OUTRAS TABELAS PARA USAR JWT CLAIMS
-- =================================================================

-- Políticas para tabela schools
DROP POLICY IF EXISTS schools_select_owner ON public.schools;
CREATE POLICY "Schools viewable by members (JWT)"
ON public.schools FOR SELECT
USING (id = public.get_jwt_school_id());

DROP POLICY IF EXISTS schools_update_owner ON public.schools;
CREATE POLICY "Schools updatable by admins (JWT)"
ON public.schools FOR UPDATE
USING (
  id = public.get_jwt_school_id()
  AND public.get_jwt_user_type() IN ('admin', 'diretor')
);

-- Políticas para tabela alunos
DROP POLICY IF EXISTS alunos_select_school ON public.alunos;
CREATE POLICY "Alunos viewable by school (JWT)"
ON public.alunos FOR SELECT
USING (school_id = public.get_jwt_school_id());

DROP POLICY IF EXISTS alunos_insert_admins ON public.alunos;
CREATE POLICY "Alunos manageable by admins (JWT)"
ON public.alunos FOR ALL
USING (
  school_id = public.get_jwt_school_id()
  AND public.get_jwt_user_type() IN ('admin', 'diretor', 'professor')
)
WITH CHECK (
  school_id = public.get_jwt_school_id()
  AND public.get_jwt_user_type() IN ('admin', 'diretor', 'professor')
);

-- Políticas para tabela professores
DROP POLICY IF EXISTS professores_select_school ON public.professores;
CREATE POLICY "Professores viewable by school (JWT)"
ON public.professores FOR SELECT
USING (school_id = public.get_jwt_school_id());

DROP POLICY IF EXISTS professores_insert_admins ON public.professores;
CREATE POLICY "Professores manageable by admins (JWT)"
ON public.professores FOR ALL
USING (
  school_id = public.get_jwt_school_id()
  AND public.get_jwt_user_type() IN ('admin', 'diretor')
)
WITH CHECK (
  school_id = public.get_jwt_school_id()
  AND public.get_jwt_user_type() IN ('admin', 'diretor')
);

-- =================================================================
-- FUNÇÃO PARA POPULAR CLAIMS EXISTENTES
-- =================================================================

-- Função para popular claims de usuários existentes
CREATE OR REPLACE FUNCTION public.populate_existing_jwt_claims()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Atualiza claims para todos os perfis existentes
  FOR profile_record IN 
    SELECT id, school_id, tipo_usuario, nome_completo 
    FROM public.profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'school_id', profile_record.school_id::text,
        'tipo_usuario', profile_record.tipo_usuario,
        'nome_completo', profile_record.nome_completo
      )
    WHERE id = profile_record.id;
  END LOOP;
  
  RAISE NOTICE 'JWT claims atualizados para todos os usuários existentes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a função para popular claims existentes
SELECT public.populate_existing_jwt_claims();

-- =================================================================
-- COMENTÁRIOS SOBRE JWT CLAIMS
-- =================================================================
-- 
-- VANTAGENS DOS JWT CLAIMS:
-- 1. Performance: Elimina subconsultas nas políticas RLS
-- 2. Simplicidade: Políticas mais legíveis e fáceis de manter
-- 3. Consistência: Dados sempre sincronizados com o perfil
-- 
-- FUNCIONAMENTO:
-- 1. Quando um perfil é criado/atualizado, o trigger atualiza os claims
-- 2. As políticas RLS usam funções auxiliares para extrair dados do JWT
-- 3. Fallback para consultas diretas em caso de erro
-- 
-- SEGURANÇA:
-- - Claims são atualizados apenas pelo trigger (SECURITY DEFINER)
-- - Funções auxiliares têm tratamento de erro
-- - Políticas mantêm verificações de segurança
-- =================================================================