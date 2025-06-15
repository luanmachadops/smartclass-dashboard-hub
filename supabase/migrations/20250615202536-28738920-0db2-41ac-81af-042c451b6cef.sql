
-- Helper function to get the school_id of the first school, used for migrating existing data.
CREATE OR REPLACE FUNCTION get_first_school_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  first_school_id uuid;
BEGIN
  SELECT id INTO first_school_id FROM public.schools ORDER BY created_at LIMIT 1;
  RETURN first_school_id;
END;
$$;

-- Add school_id to tables and apply RLS
-- ALUNOS
ALTER TABLE public.alunos ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.alunos SET school_id = get_first_school_id() WHERE school_id IS NULL;
ALTER TABLE public.alunos ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage alunos in their own school" ON public.alunos FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- PROFESSORES
ALTER TABLE public.professores ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.professores SET school_id = get_first_school_id() WHERE school_id IS NULL;
ALTER TABLE public.professores ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage professores in their own school" ON public.professores FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- CURSOS
ALTER TABLE public.cursos ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.cursos SET school_id = get_first_school_id() WHERE school_id IS NULL;
ALTER TABLE public.cursos ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage cursos in their own school" ON public.cursos FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- TURMAS
ALTER TABLE public.turmas ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.turmas SET school_id = get_first_school_id() WHERE school_id IS NULL;
ALTER TABLE public.turmas ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage turmas in their own school" ON public.turmas FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- FINANCEIRO
ALTER TABLE public.financeiro ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.financeiro SET school_id = get_first_school_id() WHERE school_id IS NULL;
ALTER TABLE public.financeiro ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage financeiro in their own school" ON public.financeiro FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- AULAS
ALTER TABLE public.aulas ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.aulas SET school_id = get_first_school_id() WHERE school_id IS NULL;
ALTER TABLE public.aulas ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage aulas in their own school" ON public.aulas FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- CHAMADAS
ALTER TABLE public.chamadas ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
UPDATE public.chamadas SET school_id = (SELECT school_id FROM public.turmas WHERE id = turma_id) WHERE school_id IS NULL;
ALTER TABLE public.chamadas ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage chamadas in their own school" ON public.chamadas FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- PRESENCAS
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage presencas in their own school" ON public.presencas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_id AND c.school_id = get_my_school_id()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_id AND c.school_id = get_my_school_id()
  )
);

-- POLLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage polls in their own school" ON public.polls FOR ALL USING (school_id = get_my_school_id()) WITH CHECK (school_id = get_my_school_id());

-- POLL_OPTIONS
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage poll_options in their own school" ON public.poll_options FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND p.school_id = get_my_school_id()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_id AND p.school_id = get_my_school_id()
  )
);

-- POLL_VOTES
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage poll_votes in their own school" ON public.poll_votes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.poll_options po
    JOIN public.polls p ON po.poll_id = p.id
    WHERE po.id = poll_option_id AND p.school_id = get_my_school_id()
  )
);

-- PROFILES (allow users to see other users from the same school)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see profiles from their own school" ON public.profiles FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Drop the helper function as it's no longer needed
DROP FUNCTION get_first_school_id();
