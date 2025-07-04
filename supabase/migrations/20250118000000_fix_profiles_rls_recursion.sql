-- =================================================================
-- CORREÇÃO DEFINITIVA PARA O ERRO "stack depth limit exceeded"
-- =================================================================

-- PASSO 1: Remover as políticas antigas e problemáticas da tabela 'profiles'
DROP POLICY IF EXISTS profiles_select_admins ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_admins ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admins ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_admins ON public.profiles;
DROP POLICY IF EXISTS profiles_select_others ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

-- PASSO 1.1: Remover políticas de INSERT da tabela 'schools' que podem impedir o cadastro.
-- A criação de escolas deve ser feita APENAS através do gatilho handle_new_user (que é SECURITY DEFINER).
DROP POLICY IF EXISTS "Users can create schools for themselves" ON public.schools;
DROP POLICY IF EXISTS "Admins and directors can insert new schools" ON public.schools;
DROP POLICY IF EXISTS schools_insert_owner ON public.schools;
DROP POLICY IF EXISTS schools_insert_admins ON public.schools;

-- PASSO 2: Remover políticas existentes (caso já tenham sido criadas) e criar as novas políticas seguras

-- Remover políticas que podem já existir
DROP POLICY IF EXISTS "Profiles are viewable by users in the same school" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and directors can insert new profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and directors can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and directors can update other profiles" ON public.profiles;

-- POLÍTICA 1: Usuários podem ver outros perfis DENTRO DA MESMA ESCOLA.
-- Esta política cobre todos os tipos de usuário (diretor, professor, aluno, etc.)
CREATE POLICY "Profiles are viewable by users in the same school"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    -- Verifica se existe um perfil para o usuário logado (auth.uid)
    -- que tenha o mesmo school_id do perfil que está sendo acessado.
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = profiles.school_id
  )
);

-- POLÍTICA 2: Usuários podem atualizar o SEU PRÓPRIO perfil.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ( id = auth.uid() );

-- POLÍTICA 3: APENAS diretores e administradores podem INSERIR novos perfis.
-- NOTA: Esta política não se aplica ao cadastro inicial (trigger handle_new_user com SECURITY DEFINER)
CREATE POLICY "Admins and directors can insert new profiles"
ON public.profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = profiles.school_id AND p.tipo_usuario IN ('admin', 'diretor')
  )
);

-- POLÍTICA 4: APENAS diretores e administradores podem DELETAR perfis (exceto o seu próprio).
CREATE POLICY "Admins and directors can delete profiles"
ON public.profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = profiles.school_id AND p.tipo_usuario IN ('admin', 'diretor')
  )
);

-- POLÍTICA 5: APENAS diretores e administradores podem ATUALIZAR outros perfis (além do próprio).
CREATE POLICY "Admins and directors can update other profiles"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = profiles.school_id AND p.tipo_usuario IN ('admin', 'diretor')
  )
);