
-- REMOVER TODAS AS POLÍTICAS EXISTENTES para evitar conflitos de RLS
DROP POLICY IF EXISTS "Users can view alunos in their school" ON public.alunos;
DROP POLICY IF EXISTS "Users can insert alunos in their school" ON public.alunos;
DROP POLICY IF EXISTS "Users can update alunos in their school" ON public.alunos;
DROP POLICY IF EXISTS "Users can delete alunos in their school" ON public.alunos;

DROP POLICY IF EXISTS "Users can view professores in their school" ON public.professores;
DROP POLICY IF EXISTS "Users can insert professores in their school" ON public.professores;
DROP POLICY IF EXISTS "Users can update professores in their school" ON public.professores;
DROP POLICY IF EXISTS "Users can delete professores in their school" ON public.professores;

DROP POLICY IF EXISTS "Users can view turmas in their school" ON public.turmas;
DROP POLICY IF EXISTS "Users can insert turmas in their school" ON public.turmas;
DROP POLICY IF EXISTS "Users can update turmas in their school" ON public.turmas;
DROP POLICY IF EXISTS "Users can delete turmas in their school" ON public.turmas;

DROP POLICY IF EXISTS "Users can view cursos in their school" ON public.cursos;
DROP POLICY IF EXISTS "Users can insert cursos in their school" ON public.cursos;
DROP POLICY IF EXISTS "Users can update cursos in their school" ON public.cursos;
DROP POLICY IF EXISTS "Users can delete cursos in their school" ON public.cursos;

DROP POLICY IF EXISTS "Users can view aulas in their school" ON public.aulas;
DROP POLICY IF EXISTS "Users can insert aulas in their school" ON public.aulas;
DROP POLICY IF EXISTS "Users can update aulas in their school" ON public.aulas;
DROP POLICY IF EXISTS "Users can delete aulas in their school" ON public.aulas;

DROP POLICY IF EXISTS "Users can view chamadas in their school" ON public.chamadas;
DROP POLICY IF EXISTS "Users can insert chamadas in their school" ON public.chamadas;
DROP POLICY IF EXISTS "Users can update chamadas in their school" ON public.chamadas;
DROP POLICY IF EXISTS "Users can delete chamadas in their school" ON public.chamadas;

DROP POLICY IF EXISTS "Users can view financeiro in their school" ON public.financeiro;
DROP POLICY IF EXISTS "Users can insert financeiro in their school" ON public.financeiro;
DROP POLICY IF EXISTS "Users can update financeiro in their school" ON public.financeiro;
DROP POLICY IF EXISTS "Users can delete financeiro in their school" ON public.financeiro;

DROP POLICY IF EXISTS "Users can view presencas in their school" ON public.presencas;
DROP POLICY IF EXISTS "Users can insert presencas in their school" ON public.presencas;
DROP POLICY IF EXISTS "Users can update presencas in their school" ON public.presencas;
DROP POLICY IF EXISTS "Users can delete presencas in their school" ON public.presencas;

-- GARANTIR QUE TODAS AS TABELAS TENHAM RLS ATIVADA
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

-- RECRIAÇÃO DAS POLÍTICAS CORRETAS COM school_id
-- ALUNOS
CREATE POLICY "Users can view alunos in their school" ON public.alunos FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert alunos in their school" ON public.alunos FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update alunos in their school" ON public.alunos FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete alunos in their school" ON public.alunos FOR DELETE USING (school_id = get_my_school_id());

-- PROFESSORES
CREATE POLICY "Users can view professores in their school" ON public.professores FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert professores in their school" ON public.professores FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update professores in their school" ON public.professores FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete professores in their school" ON public.professores FOR DELETE USING (school_id = get_my_school_id());

-- TURMAS
CREATE POLICY "Users can view turmas in their school" ON public.turmas FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert turmas in their school" ON public.turmas FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update turmas in their school" ON public.turmas FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete turmas in their school" ON public.turmas FOR DELETE USING (school_id = get_my_school_id());

-- CURSOS
CREATE POLICY "Users can view cursos in their school" ON public.cursos FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert cursos in their school" ON public.cursos FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update cursos in their school" ON public.cursos FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete cursos in their school" ON public.cursos FOR DELETE USING (school_id = get_my_school_id());

-- AULAS
CREATE POLICY "Users can view aulas in their school" ON public.aulas FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert aulas in their school" ON public.aulas FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update aulas in their school" ON public.aulas FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete aulas in their school" ON public.aulas FOR DELETE USING (school_id = get_my_school_id());

-- CHAMADAS
CREATE POLICY "Users can view chamadas in their school" ON public.chamadas FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert chamadas in their school" ON public.chamadas FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update chamadas in their school" ON public.chamadas FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete chamadas in their school" ON public.chamadas FOR DELETE USING (school_id = get_my_school_id());

-- FINANCEIRO
CREATE POLICY "Users can view financeiro in their school" ON public.financeiro FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "Users can insert financeiro in their school" ON public.financeiro FOR INSERT WITH CHECK (school_id = get_my_school_id());
CREATE POLICY "Users can update financeiro in their school" ON public.financeiro FOR UPDATE USING (school_id = get_my_school_id());
CREATE POLICY "Users can delete financeiro in their school" ON public.financeiro FOR DELETE USING (school_id = get_my_school_id());

-- PRESENCAS (relaciona chamadas -> school)
CREATE POLICY "Users can view presencas in their school" ON public.presencas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_id AND c.school_id = get_my_school_id()
  )
);
CREATE POLICY "Users can insert presencas in their school" ON public.presencas FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_id AND c.school_id = get_my_school_id()
  )
);
CREATE POLICY "Users can update presencas in their school" ON public.presencas FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_id AND c.school_id = get_my_school_id()
  )
);
CREATE POLICY "Users can delete presencas in their school" ON public.presencas FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_id AND c.school_id = get_my_school_id()
  )
);
