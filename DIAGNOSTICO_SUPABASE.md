# 🔧 Diagnóstico e Solução - Problemas de Conexão Supabase

## 🚨 Problemas Identificados

### 1. ERR_CONNECTION_REFUSED na rota de signup
```
POST http://127.0.0.1:8001/auth/v1/signup net::ERR_CONNECTION_REFUSED
```

### 2. TypeError: Failed to fetch
Erro ao tentar fazer requisições para o Supabase

### 3. ERRO RETORNADO DO SUPABASE: Failed to fetch
Problemas de conexão com o banco de dados

## 🔍 Causa Raiz do Problema

O arquivo `.env` estava configurado para usar o **Supabase local** em vez do **Supabase remoto**:

```env
# ❌ CONFIGURAÇÃO INCORRETA (LOCAL)
VITE_SUPABASE_URL=http://127.0.0.1:9001
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Esta configuração tenta conectar a um servidor Supabase local que não está rodando.

## ✅ Solução Implementada

### 1. Arquivo .env Corrigido

O arquivo `.env` foi atualizado com a estrutura correta para Supabase remoto:

```env
# ✅ CONFIGURAÇÃO CORRETA (REMOTO)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 2. Configurações Adicionais

Foram adicionadas configurações importantes:
- Logging habilitado para debug
- Configurações de monitoramento
- Feature flags
- Configurações de teste

## 🚀 Próximos Passos

### 1. Obter Credenciais do Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para [https://supabase.com](https://supabase.com)
   - Faça login na sua conta

2. **Crie um novo projeto (se necessário):**
   - Clique em "New Project"
   - Escolha sua organização
   - Digite o nome do projeto: `smartclass-dashboard`
   - Escolha uma senha forte para o banco
   - Selecione a região mais próxima

3. **Obtenha as credenciais:**
   - No dashboard do projeto, vá para "Settings" > "API"
   - Copie a **Project URL** (formato: `https://xxxxx.supabase.co`)
   - Copie a **anon public key**

### 2. Atualizar o Arquivo .env

Substitua as credenciais no arquivo `.env`:

```env
# Substitua pelos valores reais do seu projeto
VITE_SUPABASE_URL=https://seu-projeto-real.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_real_aqui
```

### 3. Configurar o Banco de Dados

1. **Execute as migrações:**
   ```bash
   npm run db:migrate
   ```

2. **Se necessário, execute o seed:**
   ```bash
   npm run db:seed
   ```

### 4. Reiniciar o Servidor

```bash
# Pare o servidor atual (Ctrl+C)
# Reinicie o servidor
npm run dev
```

## 🔧 Configuração do Banco de Dados

### Tabelas Necessárias

O projeto requer as seguintes tabelas principais:

1. **profiles** - Perfis de usuário
2. **schools** - Escolas de música
3. **students** - Estudantes
4. **teachers** - Professores
5. **classes** - Aulas
6. **payments** - Pagamentos

### Políticas RLS (Row Level Security)

Certifique-se de que as políticas RLS estão configuradas corretamente:

1. **Acesse o Supabase Studio:**
   - Vá para o dashboard do seu projeto
   - Clique em "Table Editor"

2. **Verifique as políticas:**
   - Para cada tabela, clique no ícone de "RLS"
   - Certifique-se de que as políticas permitem:
     - INSERT para usuários autenticados
     - SELECT para dados próprios
     - UPDATE para dados próprios
     - DELETE para dados próprios

## 🧪 Teste da Configuração

### 1. Teste de Conexão

Após configurar as credenciais, teste a conexão:

1. Abra o console do navegador (F12)
2. Tente fazer o registro de um novo usuário
3. Verifique se não há mais erros de conexão

### 2. Logs de Debug

Com `VITE_ENABLE_LOGGING=true`, você verá logs detalhados no console:

```javascript
// Logs esperados:
✅ AuthContext: Repassando chamada de signUp para o Supabase
✅ Registro no Supabase bem-sucedido
```

### 3. Verificação no Supabase Studio

1. Acesse o Supabase Studio
2. Vá para "Authentication" > "Users"
3. Verifique se o usuário foi criado
4. Vá para "Table Editor" > "profiles"
5. Verifique se o perfil foi criado automaticamente

## 🚨 Troubleshooting

### Se ainda houver problemas:

1. **Verifique as credenciais:**
   ```bash
   # No console do navegador
   console.log(import.meta.env.VITE_SUPABASE_URL)
   console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
   ```

2. **Verifique a conectividade:**
   - Teste se consegue acessar a URL do Supabase no navegador
   - Verifique se não há firewall bloqueando

3. **Verifique as migrações:**
   ```bash
   npx supabase db reset
   ```

4. **Logs detalhados:**
   - Abra o console do navegador
   - Ative "Preserve log"
   - Tente fazer o registro novamente
   - Analise todos os logs

## 📋 Checklist de Verificação

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas corretamente
- [ ] Arquivo `.env` atualizado
- [ ] Servidor reiniciado
- [ ] Migrações executadas
- [ ] Políticas RLS configuradas
- [ ] Teste de registro realizado
- [ ] Usuário criado no Supabase Studio

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Configuração RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Nota:** Após seguir estes passos, os erros de conexão devem ser resolvidos e o sistema de registro deve funcionar corretamente.