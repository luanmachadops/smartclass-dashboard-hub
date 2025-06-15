
-- Criar tabela de cursos
CREATE TABLE public.cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de aulas
CREATE TABLE public.aulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Adicionar coluna curso_id na tabela turmas
ALTER TABLE public.turmas ADD COLUMN curso_id UUID REFERENCES public.cursos(id);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cursos (acesso público para leitura, apenas autenticados para escrita)
CREATE POLICY "Anyone can view courses" ON public.cursos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage courses" ON public.cursos
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para aulas (apenas usuários autenticados)
CREATE POLICY "Authenticated users can view classes" ON public.aulas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage classes" ON public.aulas
  FOR ALL USING (auth.role() = 'authenticated');

-- Corrigir políticas RLS do sistema de chat para evitar recursão
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view participants of conversations they're in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view messages from conversations they participate in" ON public.messages;

-- Criar função de segurança para verificar participação em conversas
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_participants.conversation_id = $1 
    AND conversation_participants.profile_id = auth.uid()
  );
$$;

-- Novas políticas RLS usando a função de segurança
CREATE POLICY "Users can view conversations they participate in" ON public.conversations
  FOR SELECT USING (public.user_can_access_conversation(id));

CREATE POLICY "Users can view participants of conversations they're in" ON public.conversation_participants
  FOR SELECT USING (public.user_can_access_conversation(conversation_id));

CREATE POLICY "Users can view messages from conversations they participate in" ON public.messages
  FOR SELECT USING (public.user_can_access_conversation(conversation_id));

-- Triggers para atualizar updated_at
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns cursos padrão
INSERT INTO public.cursos (nome, descricao) VALUES
  ('Piano', 'Curso de piano para todos os níveis'),
  ('Violão', 'Curso de violão popular e clássico'),
  ('Guitarra', 'Curso de guitarra elétrica'),
  ('Bateria', 'Curso de bateria e percussão'),
  ('Canto', 'Curso de técnica vocal'),
  ('Violino', 'Curso de violino clássico'),
  ('Saxofone', 'Curso de saxofone'),
  ('Teclado', 'Curso de teclado e sintetizador');
