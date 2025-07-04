-- Versão Consolidada da Migração: SmartClass
-- Data: 2025-07-05
-- Descrição: Este arquivo consolida todas as migrações anteriores, corrigindo
--            problemas de recursão em RLS e simplificando a lógica de criação de usuários.

-- =================================================================
-- PARTE 1: LIMPEZA E PREPARAÇÃO DO ESQUEMA
-- =================================================================

-- Drop de todas as tabelas existentes no schema public para um recomeço limpo.
-- A ordem é importante para respeitar as dependências de chaves estrangeiras.
DROP TABLE IF EXISTS public.presencas CASCADE;
DROP TABLE IF EXISTS public.chamadas CASCADE;
DROP TABLE IF EXISTS public.aulas CASCADE;
DROP TABLE IF EXISTS public.turma_professores CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.professores CASCADE;
DROP TABLE IF EXISTS public.turmas CASCADE;
DROP TABLE IF EXISTS public.cursos CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.financeiro CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;

-- Drop de funções e gatilhos para garantir que as versões mais recentes sejam usadas.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_school_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =================================================================
-- PARTE 2: CRIAÇÃO DAS TABELAS
-- =================================================================

CREATE TABLE public.schools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
    tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('admin', 'diretor', 'secretario', 'professor', 'aluno', 'responsavel')),
    nome_completo TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_school UNIQUE (id, school_id)
);

CREATE TABLE public.cursos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.turmas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    curso_id uuid REFERENCES public.cursos(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    ano_letivo INT,
    periodo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.professores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.alunos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    turma_id uuid REFERENCES public.turmas(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    email TEXT UNIQUE,
    data_nascimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.turma_professores (
    turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id uuid NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
    PRIMARY KEY (turma_id, professor_id)
);

CREATE TABLE public.aulas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id uuid REFERENCES public.professores(id) ON DELETE SET NULL,
    data_aula DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    conteudo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.chamadas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aula_id uuid NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
    turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id uuid REFERENCES public.professores(id) ON DELETE SET NULL, -- denormalized for easier access
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE, -- denormalized for RLS
    data_chamada TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.presencas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chamada_id uuid NOT NULL REFERENCES public.chamadas(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('presente', 'ausente', 'justificado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.financeiro (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    aluno_id uuid REFERENCES public.alunos(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'atrasado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.conversation_participants (
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text_content TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'audio', 'poll')),
    attachment_file_name TEXT,
    attachment_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================
-- PARTE 3: FUNÇÕES E GATILHOS (TRIGGERS)
-- =================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicando o gatilho de atualização para as tabelas relevantes
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON public.financeiro FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para lidar com a criação de novos usuários (diretores ou convidados)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_school_id uuid;
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
  metadata jsonb;
BEGIN
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'nome_completo', user_email);

  -- Cenário 1: Novo Diretor criando uma nova escola
  IF NEW.raw_user_meta_data->>'nome_escola' IS NOT NULL THEN
    user_role := 'diretor';
    -- Cria a nova escola
    INSERT INTO public.schools (name, owner_id)
    VALUES (NEW.raw_user_meta_data->>'nome_escola', NEW.id)
    RETURNING id INTO new_school_id;

    -- Cria o perfil do diretor para a nova escola
    INSERT INTO public.profiles (id, nome_completo, email, tipo_usuario, school_id)
    VALUES (NEW.id, user_name, user_email, user_role, new_school_id);

    metadata := jsonb_build_object('school_id', new_school_id, 'tipo_usuario', user_role);

  -- Cenário 2: Novo usuário sendo convidado para uma escola existente
  ELSIF (NEW.raw_user_meta_data->>'school_id') IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'aluno'); -- Padrão para 'aluno'
    new_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;

    -- Cria o perfil para o novo usuário
    INSERT INTO public.profiles (id, nome_completo, email, tipo_usuario, school_id)
    VALUES (NEW.id, user_name, user_email, user_role, new_school_id);

    -- Se for um aluno, cria a entrada na tabela de alunos
    IF user_role = 'aluno' THEN
      INSERT INTO public.alunos (user_id, nome, email, school_id)
      VALUES (NEW.id, user_name, user_email, new_school_id);
    -- Se for um professor, cria a entrada na tabela de professores
    ELSIF user_role = 'professor' THEN
      INSERT INTO public.professores (user_id, nome, email, school_id)
      VALUES (NEW.id, user_name, user_email, new_school_id);
    END IF;

    metadata := jsonb_build_object('school_id', new_school_id, 'tipo_usuario', user_role);

  ELSE
    -- Se não houver nome da escola ou ID da escola, não faz nada.
    RAISE LOG 'Usuário % criado sem metadados de escola. Nenhum perfil ou metadados criados.', NEW.id;
    RETURN NEW;
  END IF;

  -- Atualiza os metadados do usuário em auth.users para incluir no JWT
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || metadata
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Recria o gatilho para garantir que ele use a função mais recente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================================================= 
 -- PARTE 4: HABILITAÇÃO DA SEGURANÇA (RLS) E POLÍTICAS GRANULARES 
 -- ================================================================= 
 
 -- Habilitar RLS em todas as tabelas 
 ALTER TABLE public.schools ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.profiles ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.professores ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.alunos ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.turmas ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.cursos ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.aulas ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.chamadas ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.presencas ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.financeiro ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.turma_professores ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.conversations ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.conversation_participants ENABLE ROW  LEVEL SECURITY; 
 ALTER TABLE public.messages ENABLE ROW  LEVEL SECURITY; 
 
 -- Funções para extrair dados do JWT do usuário logado. 
 CREATE OR REPLACE FUNCTION public.get_my_school_id() RETURNS uuid LANGUAGE sql STABLE AS  $$ 
   select nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'school_id', '' )::uuid; 
 $$; 
 CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text LANGUAGE sql STABLE AS  $$ 
   select nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tipo_usuario', '' )::text; 
 $$; 
 
 --- Políticas para 'schools' 
 CREATE POLICY "Membros podem ver sua própria escola" ON public.schools FOR SELECT USING (id =  public.get_my_school_id()); 
 CREATE POLICY "Dono pode atualizar sua própria escola" ON public.schools FOR UPDATE USING (owner_id =  auth.uid()); 
 CREATE POLICY "Dono pode deletar sua própria escola" ON public.schools FOR DELETE USING (owner_id =  auth.uid()); 
 
 --- Políticas para 'profiles' 
 CREATE POLICY "Admins podem gerenciar perfis da escola" ON public.profiles FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() IN ('admin', 'diretor' )); 
 CREATE POLICY "Usuários podem ver perfis da sua escola" ON public.profiles FOR SELECT USING (school_id =  public.get_my_school_id()); 
 CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles FOR UPDATE USING (id =  auth.uid()); 
 
 --- Políticas para 'cursos' 
 CREATE POLICY "Membros podem ver os cursos da escola" ON public.cursos FOR SELECT USING (school_id =  public.get_my_school_id()); 
 CREATE POLICY "Admins podem gerenciar os cursos da escola" ON public.cursos FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() IN ('admin', 'diretor', 'secretario' )); 
 
 --- Políticas para 'turmas' 
 CREATE POLICY "Membros podem ver as turmas da escola" ON public.turmas FOR SELECT USING (school_id =  public.get_my_school_id()); 
 CREATE POLICY "Admins podem gerenciar as turmas da escola" ON public.turmas FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() IN ('admin', 'diretor', 'secretario' )); 
 
 --- Políticas para 'professores' 
 CREATE POLICY "Membros podem ver os professores da escola" ON public.professores FOR SELECT USING (school_id =  public.get_my_school_id()); 
 CREATE POLICY "Admins podem gerenciar os professores da escola" ON public.professores FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() IN ('admin', 'diretor', 'secretario' )); 
 
 --- Políticas para 'alunos' 
 CREATE POLICY "Membros podem ver os alunos da escola" ON public.alunos FOR SELECT USING (school_id =  public.get_my_school_id()); 
 CREATE POLICY "Admins podem gerenciar os alunos da escola" ON public.alunos FOR ALL USING (school_id = public.get_my_school_id() AND public.get_my_role() IN ('admin', 'diretor', 'secretario' )); 
 
 --- Políticas para o sistema de Chat 
 CREATE POLICY "Membros podem gerenciar conversas da escola" ON public.conversations FOR ALL USING (school_id =  public.get_my_school_id()); 
 CREATE POLICY "Membros podem gerenciar participantes de suas conversas" ON public.conversation_participants FOR ALL USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.school_id =  public.get_my_school_id())); 
 CREATE POLICY "Membros podem gerenciar mensagens de suas conversas" ON public.messages FOR ALL USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.school_id =  public.get_my_school_id()));

-- =================================================================
-- PARTE 5: STORAGE
-- =================================================================

-- Criação dos buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('alunos-fotos', 'alunos-fotos', true) ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para os buckets
CREATE POLICY "chat_attachments_policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'chat-attachments');
CREATE POLICY "student_photos_policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'alunos-fotos');

-- Fim da migração consolidada