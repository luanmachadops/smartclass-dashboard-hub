-- =================================================================
-- PARTE 0: DESTRUIÇÃO COMPLETA DO SCHEMA PUBLIC E OBJETOS PERSISTENTES
-- CUIDADO: ESTE BLOCO APAGA TODAS AS TABELAS E DADOS.
-- =================================================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(rec.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- Apaga gatilhos e políticas de storage que podem existir de execuções anteriores
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP POLICY IF EXISTS "chat_attachments_policy" ON storage.objects;
DROP POLICY IF EXISTS "student_photos_policy" ON storage.objects;


-- =================================================================
-- SCRIPT COMPLETO E REATORADO - VERSÃO DE ALTA SEGURANÇA
-- Implementa todas as correções: RLS granular, colunas qualificadas,
-- políticas da tabela 'schools', e idempotência de gatilhos e políticas.
-- =================================================================

-- =================================================================
-- PARTE 1: CRIAÇÃO DAS TABELAS
-- =================================================================
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    nome_completo TEXT,
    telefone TEXT,
    tipo_usuario TEXT DEFAULT 'diretor' CHECK (tipo_usuario IN ('diretor', 'admin', 'professor', 'aluno', 'secretario')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE public.cursos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.turmas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES public.cursos(id),
    nome TEXT NOT NULL,
    instrumento TEXT NOT NULL,
    nivel TEXT NOT NULL CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
    dia_semana TEXT NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    valor_mensal DECIMAL(10,2),
    vagas_total INTEGER DEFAULT 10,
    vagas_ocupadas INTEGER DEFAULT 0,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.professores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    especialidades TEXT[],
    valor_hora DECIMAL(10,2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.alunos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    data_nascimento DATE,
    responsavel TEXT,
    telefone_responsavel TEXT,
    endereco TEXT,
    instrumento TEXT,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.turma_professores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turma_id, professor_id)
);

CREATE TABLE public.aulas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.professores(id),
    data_aula DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    status TEXT DEFAULT 'agendada' CHECK (status IN ('agendada', 'realizada', 'cancelada')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.chamadas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.professores(id),
    data_aula DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.presencas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chamada_id UUID NOT NULL REFERENCES public.chamadas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    presente BOOLEAN NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chamada_id, aluno_id)
);

CREATE TABLE public.financeiro (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    aluno_id UUID REFERENCES public.alunos(id),
    professor_id UUID REFERENCES public.professores(id),
    metodo_pagamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT,
    is_group_chat BOOLEAN DEFAULT false,
    group_chat_class_id UUID REFERENCES turmas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(conversation_id, profile_id)
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_profile_id UUID NOT NULL REFERENCES public.profiles(id),
    text_content TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'audio', 'poll')),
    attachment_file_name TEXT,
    attachment_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================
-- PARTE 2: FUNÇÕES E GATILHOS (TRIGGERS)
-- =================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON public.professores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON public.alunos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON public.financeiro FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_my_school_id() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT profiles.school_id FROM public.profiles WHERE profiles.id = auth.uid() LIMIT 1; $$;
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT profiles.tipo_usuario FROM public.profiles WHERE profiles.id = auth.uid() LIMIT 1; $$;

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
    INSERT INTO public.schools (name, owner_id)
    VALUES (NEW.raw_user_meta_data->>'nome_escola', NEW.id)
    RETURNING id INTO new_school_id;

    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', 'diretor', new_school_id);
  
  ELSIF NEW.raw_user_meta_data->>'school_id' IS NOT NULL THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'aluno');
    new_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;

    INSERT INTO public.profiles (id, nome_completo, tipo_usuario, school_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', user_role, new_school_id);

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =================================================================
-- PARTE 3: HABILITAÇÃO DA SEGURANÇA (RLS) E POLÍTICAS REATORADAS
-- =================================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--- Políticas para a tabela 'schools'
CREATE POLICY schools_select_members ON public.schools FOR SELECT USING (schools.id = get_my_school_id());
CREATE POLICY schools_update_owner ON public.schools FOR UPDATE USING (schools.owner_id = auth.uid());
CREATE POLICY schools_delete_owner ON public.schools FOR DELETE USING (schools.owner_id = auth.uid());

--- Políticas para a tabela 'profiles'
CREATE POLICY profiles_select_admins ON public.profiles FOR SELECT USING (profiles.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor'));
CREATE POLICY profiles_insert_admins ON public.profiles FOR INSERT WITH CHECK (profiles.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor'));
CREATE POLICY profiles_update_admins ON public.profiles FOR UPDATE USING (profiles.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor'));
CREATE POLICY profiles_delete_admins ON public.profiles FOR DELETE USING (profiles.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor'));
CREATE POLICY profiles_select_others ON public.profiles FOR SELECT USING (profiles.school_id = get_my_school_id());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (profiles.id = auth.uid()) WITH CHECK (profiles.id = auth.uid());

--- Políticas para a tabela 'turmas'
CREATE POLICY turmas_select_admins ON public.turmas FOR SELECT USING (turmas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY turmas_insert_admins ON public.turmas FOR INSERT WITH CHECK (turmas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY turmas_update_admins ON public.turmas FOR UPDATE USING (turmas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY turmas_delete_admins ON public.turmas FOR DELETE USING (turmas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY turmas_select_professor ON public.turmas FOR SELECT USING (turmas.id IN (SELECT tp.turma_id FROM public.turma_professores tp JOIN public.professores p ON tp.professor_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY turmas_select_aluno ON public.turmas FOR SELECT USING (turmas.id IN (SELECT a.turma_id FROM public.alunos a WHERE a.user_id = auth.uid()));

--- Políticas para a tabela 'professores'
CREATE POLICY professores_select_admins ON public.professores FOR SELECT USING (professores.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY professores_insert_admins ON public.professores FOR INSERT WITH CHECK (professores.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY professores_update_admins ON public.professores FOR UPDATE USING (professores.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY professores_delete_admins ON public.professores FOR DELETE USING (professores.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY professores_select_others ON public.professores FOR SELECT USING (professores.school_id = get_my_school_id());
CREATE POLICY professores_update_own ON public.professores FOR UPDATE USING (professores.user_id = auth.uid()) WITH CHECK (professores.user_id = auth.uid());

--- Políticas para a tabela 'alunos'
CREATE POLICY alunos_select_admins ON public.alunos FOR SELECT USING (alunos.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY alunos_insert_admins ON public.alunos FOR INSERT WITH CHECK (alunos.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY alunos_update_admins ON public.alunos FOR UPDATE USING (alunos.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY alunos_delete_admins ON public.alunos FOR DELETE USING (alunos.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY alunos_select_professor ON public.alunos FOR SELECT USING (alunos.turma_id IN (SELECT tp.turma_id FROM public.turma_professores tp JOIN public.professores p ON tp.professor_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY alunos_select_own ON public.alunos FOR SELECT USING (alunos.user_id = auth.uid());
CREATE POLICY alunos_update_own ON public.alunos FOR UPDATE USING (alunos.user_id = auth.uid()) WITH CHECK (alunos.user_id = auth.uid());

--- Políticas para a tabela 'chamadas'
CREATE POLICY chamadas_select_admins ON public.chamadas FOR SELECT USING (chamadas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY chamadas_insert_admins ON public.chamadas FOR INSERT WITH CHECK (chamadas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY chamadas_update_admins ON public.chamadas FOR UPDATE USING (chamadas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY chamadas_delete_admins ON public.chamadas FOR DELETE USING (chamadas.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario'));
CREATE POLICY chamadas_manage_professor ON public.chamadas FOR ALL USING (chamadas.turma_id IN (SELECT tp.turma_id FROM public.turma_professores tp JOIN public.professores p ON tp.professor_id = p.id WHERE p.user_id = auth.uid()));

--- Políticas para a tabela 'presencas'
CREATE POLICY presencas_select_admins ON public.presencas FOR SELECT USING (EXISTS (SELECT 1 FROM public.chamadas c WHERE c.id = presencas.chamada_id AND c.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario')));
CREATE POLICY presencas_insert_admins ON public.presencas FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.chamadas c WHERE c.id = presencas.chamada_id AND c.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario')));
CREATE POLICY presencas_update_admins ON public.presencas FOR UPDATE USING (EXISTS (SELECT 1 FROM public.chamadas c WHERE c.id = presencas.chamada_id AND c.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario')));
CREATE POLICY presencas_delete_admins ON public.presencas FOR DELETE USING (EXISTS (SELECT 1 FROM public.chamadas c WHERE c.id = presencas.chamada_id AND c.school_id = get_my_school_id() AND get_my_role() IN ('admin', 'diretor', 'secretario')));
CREATE POLICY presencas_manage_professor ON public.presencas FOR ALL USING (presencas.chamada_id IN (SELECT c.id FROM public.chamadas c JOIN public.professores p ON c.professor_id = p.id WHERE p.user_id = auth.uid()));
CREATE POLICY presencas_select_aluno ON public.presencas FOR SELECT USING (presencas.aluno_id IN (SELECT a.id FROM public.alunos a WHERE a.user_id = auth.uid()));

--- Políticas para o sistema de Chat (simplificado para isolamento de escola)
CREATE POLICY chat_manage_school_members ON public.conversations FOR ALL USING (conversations.school_id = get_my_school_id());
CREATE POLICY chat_participants_manage_school_members ON public.conversation_participants FOR ALL USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_participants.conversation_id AND c.school_id = get_my_school_id()));
CREATE POLICY chat_messages_manage_school_members ON public.messages FOR ALL USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.school_id = get_my_school_id()));


-- =================================================================
-- PARTE 4: STORAGE
-- =================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('alunos-fotos', 'alunos-fotos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat_attachments_policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'chat-attachments');
CREATE POLICY "student_photos_policy" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'alunos-fotos');