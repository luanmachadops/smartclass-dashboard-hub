
-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome_completo TEXT,
  telefone TEXT,
  tipo_usuario TEXT DEFAULT 'diretor' CHECK (tipo_usuario IN ('diretor', 'professor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Criar tabela de professores
CREATE TABLE public.professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  especialidades TEXT[],
  valor_hora DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de turmas
CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Criar tabela de relacionamento professor-turma (muitos para muitos)
CREATE TABLE public.turma_professores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(turma_id, professor_id)
);

-- Criar tabela de alunos
CREATE TABLE public.alunos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_nascimento DATE,
  responsavel TEXT,
  telefone_responsavel TEXT,
  endereco TEXT,
  turma_id UUID REFERENCES public.turmas(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de chamadas/presença
CREATE TABLE public.chamadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professores(id),
  data_aula DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de presença dos alunos
CREATE TABLE public.presencas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chamada_id UUID NOT NULL REFERENCES public.chamadas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chamada_id, aluno_id)
);

-- Criar tabela financeira
CREATE TABLE public.financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turma_professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir tudo para usuários autenticados por enquanto)
CREATE POLICY "Usuários autenticados podem ver profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver professores" ON public.professores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver turmas" ON public.turmas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver turma_professores" ON public.turma_professores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver alunos" ON public.alunos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver chamadas" ON public.chamadas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver presencas" ON public.presencas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem ver financeiro" ON public.financeiro FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, tipo_usuario)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo', 'diretor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
