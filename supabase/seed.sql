-- Seed data para desenvolvimento
-- Este arquivo popula o banco com dados de exemplo

-- Comentado temporariamente para evitar erro de FK
-- INSERT INTO public.schools (id, name, owner_id) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', 'Escola de Música Harmonia', '550e8400-e29b-41d4-a716-446655440001')
-- ON CONFLICT (id) DO NOTHING;

-- Comentado temporariamente para evitar erro de FK
-- INSERT INTO public.cursos (id, school_id, nome, descricao) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Piano Básico', 'Curso de piano para iniciantes'),
-- ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', 'Violão Popular', 'Curso de violão com foco em música popular'),
-- ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', 'Canto Coral', 'Técnicas de canto e performance coral')
-- ON CONFLICT (id) DO NOTHING;

-- Comentado temporariamente para evitar erros de FK
-- INSERT INTO public.turmas (id, school_id, curso_id, nome, instrumento, nivel, dia_semana, horario_inicio, horario_fim, valor_mensal) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'Piano Iniciante A', 'Piano', 'iniciante', 'Segunda-feira', '14:00', '15:00', 150.00),
-- ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', 'Violão Popular B', 'Violão', 'intermediario', 'Quarta-feira', '16:00', '17:00', 120.00),
-- ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', 'Canto Coral C', 'Voz', 'iniciante', 'Sexta-feira', '18:00', '19:00', 100.00)
-- ON CONFLICT (id) DO NOTHING;

-- Comentado temporariamente para evitar erros de FK
-- INSERT INTO public.professores (id, school_id, nome, email, telefone, especialidades, valor_hora) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'Maria Silva', 'maria@escola.com', '(11) 99999-1111', ARRAY['Piano', 'Teclado'], 50.00),
-- ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'João Santos', 'joao@escola.com', '(11) 99999-2222', ARRAY['Violão', 'Guitarra'], 45.00),
-- ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'Ana Costa', 'ana@escola.com', '(11) 99999-3333', ARRAY['Canto', 'Coral'], 40.00)
-- ON CONFLICT (id) DO NOTHING;

-- Comentado temporariamente para evitar erros de FK
-- INSERT INTO public.alunos (id, school_id, turma_id, nome, email, telefone, data_nascimento, responsavel, telefone_responsavel, instrumento) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440020', 'Pedro Oliveira', 'pedro@email.com', '(11) 88888-1111', '2010-05-15', 'Carlos Oliveira', '(11) 77777-1111', 'Piano'),
-- ('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440021', 'Lucia Ferreira', 'lucia@email.com', '(11) 88888-2222', '2008-08-20', 'Roberto Ferreira', '(11) 77777-2222', 'Violão'),
-- ('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440022', 'Gabriel Lima', 'gabriel@email.com', '(11) 88888-3333', '2012-12-10', 'Sandra Lima', '(11) 77777-3333', 'Voz')
-- ON CONFLICT (id) DO NOTHING;

-- Comentado temporariamente para evitar erros de FK
-- INSERT INTO public.turma_professores (turma_id, professor_id) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030'),
-- ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440031'),
-- ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440032')
-- ON CONFLICT (turma_id, professor_id) DO NOTHING;