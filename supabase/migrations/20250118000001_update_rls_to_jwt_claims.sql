-- =================================================================
-- SCRIPT DE CORREÇÃO FINAL - ATUALIZA TODAS AS RLS PARA USAR JWT
-- =================================================================

-- Helper Function para simplificar a leitura (opcional, mas recomendado)
-- Esta função torna as políticas mais limpas.
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> claim, '');
$$ LANGUAGE sql STABLE;

-- -----------------------------------------------------------------
-- Tabela 'schools'
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS schools_select_members ON public.schools;
-- A política de UPDATE e DELETE já está correta, usando auth.uid()
CREATE POLICY schools_select_members ON public.schools FOR SELECT
USING (id = (get_my_claim('school_id')::uuid));

-- -----------------------------------------------------------------
-- Tabela 'turmas'
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS turmas_select_admins ON public.turmas;
DROP POLICY IF EXISTS turmas_insert_admins ON public.turmas;
DROP POLICY IF EXISTS turmas_update_admins ON public.turmas;
DROP POLICY IF EXISTS turmas_delete_admins ON public.turmas;

CREATE POLICY turmas_manage_admins ON public.turmas FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid))
WITH CHECK (
  school_id = (get_my_claim('school_id')::uuid) AND
  get_my_claim('user_role') IN ('admin', 'diretor', 'secretario')
);

-- As políticas de 'turmas_select_professor' e 'turmas_select_aluno' já são eficientes e não precisam de alteração.

-- -----------------------------------------------------------------
-- Tabela 'professores'
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS professores_select_admins ON public.professores;
DROP POLICY IF EXISTS professores_insert_admins ON public.professores;
DROP POLICY IF EXISTS professores_update_admins ON public.professores;
DROP POLICY IF EXISTS professores_delete_admins ON public.professores;
DROP POLICY IF EXISTS professores_select_others ON public.professores;

CREATE POLICY professores_select_all_members ON public.professores FOR SELECT
USING (school_id = (get_my_claim('school_id')::uuid));

CREATE POLICY professores_manage_admins ON public.professores FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid))
WITH CHECK (
  school_id = (get_my_claim('school_id')::uuid) AND
  get_my_claim('user_role') IN ('admin', 'diretor', 'secretario')
);
-- A política 'professores_update_own' já está correta, usando user_id = auth.uid()

-- -----------------------------------------------------------------
-- Tabela 'alunos'
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS alunos_select_admins ON public.alunos;
DROP POLICY IF EXISTS alunos_insert_admins ON public.alunos;
DROP POLICY IF EXISTS alunos_update_admins ON public.alunos;
DROP POLICY IF EXISTS alunos_delete_admins ON public.alunos;

CREATE POLICY alunos_manage_admins ON public.alunos FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid))
WITH CHECK (
  school_id = (get_my_claim('school_id')::uuid) AND
  get_my_claim('user_role') IN ('admin', 'diretor', 'secretario')
);
-- As políticas para aluno e professor verem alunos já estão corretas.

-- -----------------------------------------------------------------
-- Para as outras tabelas, o padrão é o mesmo.
-- Exemplo para 'cursos':
-- -----------------------------------------------------------------
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY; -- Habilita RLS se ainda não estiver
DROP POLICY IF EXISTS cursos_manage_all ON public.cursos;

CREATE POLICY cursos_manage_all ON public.cursos FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid));

-- -----------------------------------------------------------------
-- Tabela 'aulas'
-- -----------------------------------------------------------------
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aulas_manage_all ON public.aulas;

CREATE POLICY aulas_manage_all ON public.aulas FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid));

-- -----------------------------------------------------------------
-- Tabela 'chamadas'
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS chamadas_select_admins ON public.chamadas;
DROP POLICY IF EXISTS chamadas_insert_admins ON public.chamadas;
DROP POLICY IF EXISTS chamadas_update_admins ON public.chamadas;
DROP POLICY IF EXISTS chamadas_delete_admins ON public.chamadas;

CREATE POLICY chamadas_manage_admins ON public.chamadas FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid))
WITH CHECK (
  school_id = (get_my_claim('school_id')::uuid) AND
  get_my_claim('user_role') IN ('admin', 'diretor', 'secretario')
);

-- -----------------------------------------------------------------
-- Tabela 'presencas' (mantém EXISTS pois depende de chamadas)
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS presencas_select_admins ON public.presencas;
DROP POLICY IF EXISTS presencas_insert_admins ON public.presencas;
DROP POLICY IF EXISTS presencas_update_admins ON public.presencas;
DROP POLICY IF EXISTS presencas_delete_admins ON public.presencas;

CREATE POLICY presencas_manage_admins ON public.presencas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c 
    WHERE c.id = presencas.chamada_id 
    AND c.school_id = (get_my_claim('school_id')::uuid)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chamadas c 
    WHERE c.id = presencas.chamada_id 
    AND c.school_id = (get_my_claim('school_id')::uuid)
    AND get_my_claim('user_role') IN ('admin', 'diretor', 'secretario')
  )
);

-- -----------------------------------------------------------------
-- Tabela 'financeiro'
-- -----------------------------------------------------------------
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financeiro_manage_all ON public.financeiro;

CREATE POLICY financeiro_manage_all ON public.financeiro FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid))
WITH CHECK (
  school_id = (get_my_claim('school_id')::uuid) AND
  get_my_claim('user_role') IN ('admin', 'diretor', 'secretario')
);

-- -----------------------------------------------------------------
-- Tabela 'turma_professores'
-- -----------------------------------------------------------------
ALTER TABLE public.turma_professores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS turma_professores_manage_all ON public.turma_professores;

CREATE POLICY turma_professores_manage_all ON public.turma_professores FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.turmas t 
    WHERE t.id = turma_professores.turma_id 
    AND t.school_id = (get_my_claim('school_id')::uuid)
  )
);

-- -----------------------------------------------------------------
-- Chat
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS chat_manage_school_members ON public.conversations;
CREATE POLICY chat_manage_school_members ON public.conversations FOR ALL
USING (school_id = (get_my_claim('school_id')::uuid));

-- As políticas de `conversation_participants` e `messages` que usam `EXISTS` já são eficientes.
-- Mas vamos atualizá-las para usar a nova função:
DROP POLICY IF EXISTS chat_participants_manage_school_members ON public.conversation_participants;
CREATE POLICY chat_participants_manage_school_members ON public.conversation_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_participants.conversation_id 
    AND c.school_id = (get_my_claim('school_id')::uuid)
  )
);

DROP POLICY IF EXISTS chat_messages_manage_school_members ON public.messages;
CREATE POLICY chat_messages_manage_school_members ON public.messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = messages.conversation_id 
    AND c.school_id = (get_my_claim('school_id')::uuid)
  )
);

-- =================================================================
-- IMPORTANTE: ATUALIZAÇÃO DO TRIGGER PARA DEFINIR APP_METADATA
-- =================================================================
-- O trigger precisa ser atualizado para definir os app_metadata no JWT
-- para que as políticas funcionem corretamente.

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
  IF NEW.raw_user_meta_data->>'school_id' IS NULL AND NEW.raw_user_meta_data->>'nome_escola' IS NOT NULL THEN
    -- Criar nova escola
    INSERT INTO public.schools (name, owner_id)
    VALUES (NEW.raw_user_meta_data->>'nome_escola', NEW.id)
    RETURNING id INTO new_school_id;

    -- Criar perfil do diretor
    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', 'diretor', new_school_id);
    
    -- Atualizar app_metadata do usuário
    UPDATE auth.users 
    SET app_metadata = jsonb_build_object(
      'school_id', new_school_id,
      'user_role', 'diretor'
    )
    WHERE id = NEW.id;
  
  ELSIF NEW.raw_user_meta_data->>'school_id' IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'aluno');
    new_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;

    -- Criar perfil do usuário
    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', user_role, new_school_id);

    -- Atualizar app_metadata do usuário
    UPDATE auth.users 
    SET app_metadata = jsonb_build_object(
      'school_id', new_school_id,
      'user_role', user_role
    )
    WHERE id = NEW.id;

    -- Inserir em tabelas específicas baseado no tipo de usuário
    IF user_role = 'aluno' THEN
      INSERT INTO public.alunos (user_id, nome, email, school_id)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', NEW.email, new_school_id);
    ELSIF user_role = 'professor' THEN
      INSERT INTO public.professores (user_id, nome, email, school_id)
      VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', NEW.email, new_school_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- =================================================================
-- NOTA: APP_METADATA
-- =================================================================
-- O app_metadata deve ser configurado via dashboard do Supabase ou API
-- para que as políticas RLS funcionem corretamente com get_my_claim()

-- =================================================================
-- Passo Opcional, mas Altamente Recomendado: Remover Funções Antigas
-- =================================================================
-- Após aplicar as políticas acima e confirmar que tudo funciona,
-- você pode deletar as funções antigas para evitar usá-las por engano no futuro.
-- Rode este comando APENAS DEPOIS de confirmar que o app está funcionando.
--
-- DROP FUNCTION IF EXISTS public.get_my_school_id();
-- DROP FUNCTION IF EXISTS public.get_my_role();
-- =================================================================