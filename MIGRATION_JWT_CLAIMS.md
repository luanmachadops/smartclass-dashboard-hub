# Migração para JWT Claims - Sistema RLS

## Resumo das Mudanças

Este documento descreve a migração completa do sistema de Row Level Security (RLS) do Supabase para usar JWT claims em vez de funções recursivas.

## Problema Anterior

O sistema anterior utilizava as funções `get_my_school_id()` e `get_my_role()` que faziam consultas recursivas na tabela `profiles`, causando:

- **Problemas de performance**: Consultas recursivas em cada operação
- **Loops infinitos**: Recursão entre políticas RLS
- **Complexidade desnecessária**: Múltiplas consultas para dados já disponíveis no JWT

## Solução Implementada

### 1. Nova Função Helper

```sql
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS TEXT AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> claim, '');
$$ LANGUAGE sql STABLE;
```

Esta função extrai claims diretamente do JWT, eliminando consultas ao banco.

### 2. Políticas RLS Atualizadas

Todas as políticas foram atualizadas para usar:
- `get_my_claim('school_id')::uuid` em vez de `get_my_school_id()`
- `get_my_claim('user_role')` em vez de `get_my_role()`

### 3. Trigger Atualizado

O trigger `handle_new_user` foi atualizado para definir `app_metadata` no JWT:

```sql
UPDATE auth.users 
SET app_metadata = COALESCE(app_metadata, '{}'::jsonb) || jsonb_build_object(
  'school_id', new_school_id::text,
  'user_role', user_role
)
WHERE id = NEW.id;
```

### 4. Edge Functions Atualizadas

As Edge Functions `create-access` e `invite-user` foram atualizadas para definir `app_metadata` durante a criação/convite de usuários.

## Arquivos Modificados

### Migrações
- `20250118000002_final_jwt_rls_complete.sql` - Migração completa com todas as correções

### Edge Functions
- `supabase/functions/create-access/index.ts` - Adicionado `app_metadata`
- `supabase/functions/invite-user/index.ts` - Adicionado `app_metadata`

### Frontend
- `src/integrations/supabase/types.ts` - Atualizado tipos para nova função `get_my_claim`

## Tabelas Afetadas

Todas as tabelas com RLS foram atualizadas:

- ✅ `schools`
- ✅ `profiles` 
- ✅ `turmas`
- ✅ `professores`
- ✅ `alunos`
- ✅ `cursos`
- ✅ `aulas`
- ✅ `chamadas`
- ✅ `presencas`
- ✅ `financeiro`
- ✅ `turma_professores`
- ✅ `conversations`
- ✅ `conversation_participants`
- ✅ `messages`
- ✅ `polls` (se existir)
- ✅ `poll_options` (se existir)
- ✅ `poll_votes` (se existir)
- ✅ `chat_attachments` (se existir)

## Compatibilidade com Frontend

**✅ O frontend NÃO precisa de alterações** porque:

1. **Consultas inalteradas**: O frontend continua fazendo as mesmas consultas
2. **RLS transparente**: As políticas funcionam automaticamente no nível do banco
3. **Contextos preservados**: `AuthContext`, `SchoolContext` e `UserProfileContext` continuam funcionando
4. **Hooks inalterados**: Todos os hooks (`useAlunos`, `useProfessores`, etc.) continuam funcionando
5. **Serviços preservados**: `UserService` e outros serviços continuam funcionando

## Benefícios da Migração

### 🚀 Performance
- **Eliminação de consultas recursivas**
- **Dados diretos do JWT** (sem consultas ao banco)
- **Políticas mais eficientes**

### 🔒 Segurança
- **Dados confiáveis do JWT**
- **Eliminação de loops de recursão**
- **Políticas mais robustas**

### 🛠️ Manutenibilidade
- **Código mais simples**
- **Menos dependências entre tabelas**
- **Debugging mais fácil**

## Estrutura do JWT

Após a migração, o JWT contém:

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid",
  "email": "user@example.com",
  "app_metadata": {
    "school_id": "school-uuid",
    "user_role": "admin|diretor|secretario|professor|aluno"
  },
  "user_metadata": {
    "nome_completo": "Nome do Usuário",
    "tipo_usuario": "admin|diretor|secretario|professor|aluno"
  }
}
```

## Verificação Pós-Migração

### 1. Testar Autenticação
```bash
# Verificar se novos usuários recebem app_metadata
curl -X POST 'your-supabase-url/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Verificar JWT
```sql
-- No Supabase SQL Editor
SELECT get_my_claim('school_id'), get_my_claim('user_role');
```

### 3. Testar Políticas
```sql
-- Verificar se as consultas funcionam corretamente
SELECT * FROM profiles;
SELECT * FROM schools;
SELECT * FROM alunos;
```

## Rollback (se necessário)

Em caso de problemas, é possível fazer rollback:

1. **Restaurar funções antigas**:
```sql
CREATE OR REPLACE FUNCTION public.get_my_school_id() 
RETURNS uuid LANGUAGE sql STABLE AS $$ 
  SELECT profiles.school_id FROM public.profiles 
  WHERE profiles.id = auth.uid() LIMIT 1; 
$$;
```

2. **Reverter políticas** usando a migração anterior
3. **Remover app_metadata** se necessário

## Monitoramento

Após a migração, monitore:

- **Performance das consultas**
- **Logs de erro do Supabase**
- **Funcionamento do login/registro**
- **Acesso aos dados por escola**

## Conclusão

A migração para JWT claims resolve definitivamente os problemas de recursão e melhora significativamente a performance do sistema, mantendo total compatibilidade com o frontend existente.