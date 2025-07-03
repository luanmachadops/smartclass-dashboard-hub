-- Teste para verificar se a função handle_new_user está funcionando
-- Execute este script no Supabase Studio para testar

-- 1. Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- 2. Verificar se o trigger está ativo
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 3. Verificar estrutura das tabelas principais
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('schools', 'profiles', 'alunos', 'professores');

-- 4. Verificar se há dados de teste
SELECT 'schools' as tabela, count(*) as registros FROM schools
UNION ALL
SELECT 'profiles' as tabela, count(*) as registros FROM profiles
UNION ALL
SELECT 'alunos' as tabela, count(*) as registros FROM alunos
UNION ALL
SELECT 'professores' as tabela, count(*) as registros FROM professores;

-- 5. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('schools', 'profiles')
ORDER BY tablename, policyname;