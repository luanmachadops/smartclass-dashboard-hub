
-- Primeiro, vamos verificar e criar as políticas RLS para todas as tabelas principais

-- Políticas para a tabela alunos
DROP POLICY IF EXISTS "Users can view alunos from their school" ON public.alunos;
DROP POLICY IF EXISTS "Users can insert alunos to their school" ON public.alunos;
DROP POLICY IF EXISTS "Users can update alunos from their school" ON public.alunos;
DROP POLICY IF EXISTS "Users can delete alunos from their school" ON public.alunos;

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alunos from their school"
ON public.alunos
FOR SELECT
USING (school_id = get_my_school_id());

CREATE POLICY "Users can insert alunos to their school"
ON public.alunos
FOR INSERT
WITH CHECK (school_id = get_my_school_id());

CREATE POLICY "Users can update alunos from their school"
ON public.alunos
FOR UPDATE
USING (school_id = get_my_school_id());

CREATE POLICY "Users can delete alunos from their school"
ON public.alunos
FOR DELETE
USING (school_id = get_my_school_id());

-- Políticas para a tabela turmas
DROP POLICY IF EXISTS "Users can view turmas from their school" ON public.turmas;
DROP POLICY IF EXISTS "Users can insert turmas to their school" ON public.turmas;
DROP POLICY IF EXISTS "Users can update turmas from their school" ON public.turmas;
DROP POLICY IF EXISTS "Users can delete turmas from their school" ON public.turmas;

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view turmas from their school"
ON public.turmas
FOR SELECT
USING (school_id = get_my_school_id());

CREATE POLICY "Users can insert turmas to their school"
ON public.turmas
FOR INSERT
WITH CHECK (school_id = get_my_school_id());

CREATE POLICY "Users can update turmas from their school"
ON public.turmas
FOR UPDATE
USING (school_id = get_my_school_id());

CREATE POLICY "Users can delete turmas from their school"
ON public.turmas
FOR DELETE
USING (school_id = get_my_school_id());

-- Políticas para a tabela professores
DROP POLICY IF EXISTS "Users can view professores from their school" ON public.professores;
DROP POLICY IF EXISTS "Users can insert professores to their school" ON public.professores;
DROP POLICY IF EXISTS "Users can update professores from their school" ON public.professores;
DROP POLICY IF EXISTS "Users can delete professores from their school" ON public.professores;

ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view professores from their school"
ON public.professores
FOR SELECT
USING (school_id = get_my_school_id());

CREATE POLICY "Users can insert professores to their school"
ON public.professores
FOR INSERT
WITH CHECK (school_id = get_my_school_id());

CREATE POLICY "Users can update professores from their school"
ON public.professores
FOR UPDATE
USING (school_id = get_my_school_id());

CREATE POLICY "Users can delete professores from their school"
ON public.professores
FOR DELETE
USING (school_id = get_my_school_id());

-- Políticas para a tabela cursos
DROP POLICY IF EXISTS "Users can view cursos from their school" ON public.cursos;
DROP POLICY IF EXISTS "Users can insert cursos to their school" ON public.cursos;
DROP POLICY IF EXISTS "Users can update cursos from their school" ON public.cursos;
DROP POLICY IF EXISTS "Users can delete cursos from their school" ON public.cursos;

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cursos from their school"
ON public.cursos
FOR SELECT
USING (school_id = get_my_school_id());

CREATE POLICY "Users can insert cursos to their school"
ON public.cursos
FOR INSERT
WITH CHECK (school_id = get_my_school_id());

CREATE POLICY "Users can update cursos from their school"
ON public.cursos
FOR UPDATE
USING (school_id = get_my_school_id());

CREATE POLICY "Users can delete cursos from their school"
ON public.cursos
FOR DELETE
USING (school_id = get_my_school_id());

-- Verificar se existe bucket para fotos dos alunos
INSERT INTO storage.buckets (id, name, public)
VALUES ('alunos-fotos', 'alunos-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de fotos dos alunos
DROP POLICY IF EXISTS "Users can upload aluno photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view aluno photos" ON storage.objects;

CREATE POLICY "Users can upload aluno photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'alunos-fotos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view aluno photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'alunos-fotos');
