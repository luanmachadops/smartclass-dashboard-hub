# Guia de Teste - Criação de Usuário

## Problema Identificado e Corrigido

O erro ao adicionar novo usuário estava relacionado à função `handle_new_user` que não estava configurando corretamente o `app_metadata` no JWT do usuário. As políticas RLS (Row Level Security) dependem desses metadados para funcionar.

## Correções Aplicadas

1. **Atualização da função `handle_new_user`**:
   - Agora define automaticamente o `app_metadata` com `school_id` e `user_role`
   - Elimina a necessidade de configuração manual via dashboard

2. **Reset do banco de dados**:
   - Aplicadas as migrações atualizadas
   - Dados de seed recarregados

## Como Testar

### 1. Acesse a aplicação
- URL: http://localhost:5173/
- Vá para a aba "Cadastrar"

### 2. Preencha os dados de teste
```
Nome da Escola: Escola de Música Teste
Nome do Diretor: João Silva
Email: joao@teste.com
Senha: 123456
Confirmar Senha: 123456
```

### 3. Clique em "Criar Conta"

### 4. Verificações esperadas
- ✅ Usuário deve ser criado sem erro 500
- ✅ Login automático deve funcionar
- ✅ Redirecionamento para o dashboard
- ✅ Dados da escola devem aparecer no sistema

## Verificação no Supabase Studio

1. Acesse: http://127.0.0.1:9005
2. Execute o arquivo `test_user_creation.sql` para verificar:
   - Função `handle_new_user` existe
   - Trigger está ativo
   - Tabelas foram criadas
   - Dados foram inseridos corretamente

## Logs para Monitorar

No console do navegador, você deve ver:
```
👤 Iniciando processo de registro...
✅ Usuário criado: joao@teste.com
🔄 Trigger handle_new_user processará a criação da escola e perfil automaticamente
🔐 Fazendo login automático...
🎉 Registro e login completados com sucesso!
```

## Se Ainda Houver Problemas

1. Verifique se o Supabase está rodando: `npx supabase status`
2. Verifique os logs do navegador (F12 > Console)
3. Verifique se as tabelas foram criadas no Supabase Studio
4. Teste com um email diferente (emails já usados podem causar conflito)

## Próximos Passos

Após confirmar que a criação de usuário funciona:
1. Teste o convite de novos usuários (professores/alunos)
2. Verifique se as permissões RLS estão funcionando corretamente
3. Teste o fluxo completo do sistema