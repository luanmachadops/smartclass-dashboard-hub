-- =================================================================
-- ADIÇÃO DE ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- =================================================================

-- Índices para otimizar as políticas RLS da tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_usuario ON public.profiles(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_profiles_school_tipo ON public.profiles(school_id, tipo_usuario);

-- Índices para otimizar consultas nas tabelas principais
CREATE INDEX IF NOT EXISTS idx_schools_owner_id ON public.schools(owner_id);
CREATE INDEX IF NOT EXISTS idx_alunos_school_id ON public.alunos(school_id);
CREATE INDEX IF NOT EXISTS idx_professores_school_id ON public.professores(school_id);
CREATE INDEX IF NOT EXISTS idx_turmas_school_id ON public.turmas(school_id);
CREATE INDEX IF NOT EXISTS idx_cursos_school_id ON public.cursos(school_id);

-- Índices para otimizar consultas de relacionamentos
CREATE INDEX IF NOT EXISTS idx_turma_professores_turma_id ON public.turma_professores(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_professores_professor_id ON public.turma_professores(professor_id);
CREATE INDEX IF NOT EXISTS idx_aulas_turma_id ON public.aulas(turma_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_turma_id ON public.chamadas(turma_id);
CREATE INDEX IF NOT EXISTS idx_chamadas_professor_id ON public.chamadas(professor_id);
CREATE INDEX IF NOT EXISTS idx_presencas_chamada_id ON public.presencas(chamada_id);
CREATE INDEX IF NOT EXISTS idx_presencas_aluno_id ON public.presencas(aluno_id);

-- Índices para otimizar consultas de chat
CREATE INDEX IF NOT EXISTS idx_conversations_school_id ON public.conversations(school_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_profile_id ON public.conversation_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_profile_id ON public.messages(sender_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Índices para otimizar consultas financeiras
CREATE INDEX IF NOT EXISTS idx_financeiro_school_id ON public.financeiro(school_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_aluno_id ON public.financeiro(aluno_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_data_vencimento ON public.financeiro(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_financeiro_status ON public.financeiro(status);

-- Índices compostos para consultas complexas
CREATE INDEX IF NOT EXISTS idx_financeiro_school_status ON public.financeiro(school_id, status);
CREATE INDEX IF NOT EXISTS idx_alunos_school_ativo ON public.alunos(school_id, ativo);
CREATE INDEX IF NOT EXISTS idx_professores_school_ativo ON public.professores(school_id, ativo);

-- =================================================================
-- COMENTÁRIOS SOBRE OS ÍNDICES
-- =================================================================
-- 
-- ÍNDICES DE POLÍTICAS RLS:
-- - idx_profiles_school_id: Otimiza verificações de escola nas políticas
-- - idx_profiles_tipo_usuario: Otimiza verificações de papel do usuário
-- - idx_profiles_school_tipo: Índice composto para consultas que verificam ambos
-- 
-- ÍNDICES DE RELACIONAMENTOS:
-- - Otimizam JOINs entre tabelas relacionadas
-- - Melhoram performance de consultas de listagem
-- 
-- ÍNDICES DE ORDENAÇÃO:
-- - idx_messages_created_at: Otimiza ordenação de mensagens por data
-- - idx_financeiro_data_vencimento: Otimiza consultas por vencimento
-- 
-- ÍNDICES COMPOSTOS:
-- - Otimizam consultas que filtram por múltiplas colunas simultaneamente
-- - Reduzem necessidade de múltiplas consultas de índice
-- =================================================================