# Estratégia de Cadastro em Duas Etapas - SmartClass

## Visão Geral

Implementamos uma estratégia de cadastro em duas etapas para otimizar a experiência do usuário e garantir que todas as informações necessárias sejam coletadas de forma organizada.

## Etapa 1: Cadastro Inicial do Administrador

### Localização
- **Arquivo**: `src/pages/Auth.tsx`
- **Rota**: `/auth`

### Campos Coletados
1. **Nome da Escola** (`schoolName`)
2. **Nome do Diretor** (`directorName`) 
3. **Email** (`email`)
4. **Senha** (`password`)
5. **Confirmar Senha** (`confirmPassword`)
6. **Telefone** (`phone`) - Opcional
7. **Aceitar Termos** (`acceptTerms`)

### Funcionamento
- O formulário coleta os dados básicos do administrador e da escola
- Os dados são validados usando o schema `registerSchema`
- A função `signUp` do `AuthContext` cria o usuário no Supabase Auth
- O trigger `handle_new_user` automaticamente:
  - Cria um perfil na tabela `profiles`
  - Cria uma escola na tabela `schools`
  - Vincula o usuário à escola criada

### Metadados Enviados
```typescript
options: {
  data: {
    nome_completo: directorName,
    nome_escola: schoolName,
    telefone: phone,
    tipo_usuario: 'diretor'
  }
}
```

## Etapa 2: Configurações Completas da Escola

### Localização
- **Arquivo**: `src/pages/SchoolSettings.tsx`
- **Rota**: `/school-settings`

### Campos Adicionais
1. **CNPJ** - Formatado automaticamente
2. **Telefone da Escola** - Formatado automaticamente
3. **CEP** - Com busca automática via ViaCEP
4. **Logradouro** - Preenchido automaticamente pelo CEP
5. **Número** - Manual
6. **Bairro** - Preenchido automaticamente pelo CEP
7. **Cidade** - Preenchida automaticamente pelo CEP
8. **Estado** - Preenchido automaticamente pelo CEP

### Funcionalidades Especiais

#### Busca Automática por CEP
- **Arquivo**: `src/utils/cep.ts`
- **API**: ViaCEP (https://viacep.com.br/)
- **Função**: `fetchAddressFromCEP()`
- Preenche automaticamente logradouro, bairro, cidade e estado

#### Redirecionamento Automático
- **Hook**: `src/hooks/useFirstTimeSetup.ts`
- Verifica se é o primeiro acesso do diretor
- Redireciona automaticamente para `/school-settings` se:
  - Usuário é diretor
  - Dados básicos da escola não estão preenchidos (cnpj, telefone, cep)

## Estrutura do Banco de Dados

### Tabela `schools` - Campos Adicionados
```sql
ALTER TABLE public.schools 
ADD COLUMN cnpj TEXT,
ADD COLUMN telefone TEXT,
ADD COLUMN cep TEXT,
ADD COLUMN logradouro TEXT,
ADD COLUMN numero TEXT,
ADD COLUMN bairro TEXT,
ADD COLUMN cidade TEXT,
ADD COLUMN estado TEXT;
```

### Migração
- **Arquivo**: `supabase/migrations/20250118000002_add_school_fields.sql`

## Contextos Atualizados

### SchoolContext
- **Arquivo**: `src/contexts/SchoolContext.tsx`
- **Nova função**: `updateSchool(schoolId, data)`
- **Interface atualizada**: Inclui novos campos opcionais

### AuthContext
- **Arquivo**: `src/contexts/AuthContext.tsx`
- **Função atualizada**: `signUp()` - Agora inclui telefone nos metadados

## Fluxo de Usuário

### Para Novos Diretores
1. Acessa `/auth`
2. Preenche formulário de cadastro (Etapa 1)
3. Confirma email (se necessário)
4. Faz login
5. É automaticamente redirecionado para `/school-settings`
6. Completa dados da escola (Etapa 2)
7. É redirecionado para `/dashboard`

### Para Diretores Existentes
1. Faz login normalmente
2. Se dados básicos da escola não estão preenchidos:
   - Redirecionamento automático para `/school-settings`
3. Caso contrário:
   - Acesso normal ao dashboard
   - Pode acessar `/school-settings` manualmente para editar

## Validações

### Schemas de Validação
- **registerSchema**: Valida dados da Etapa 1
- **Validação de CEP**: `isValidCep()` e `formatCep()`
- **Formatação automática**: CNPJ e telefone

### Segurança
- Rate limiting no AuthContext
- Validação de dados com Zod
- Sanitização de inputs
- Verificação de permissões no ProtectedRoute

## Próximos Passos

### Cadastro Interno (Etapa 3)
Após a implementação das duas etapas iniciais, o próximo passo será:

1. **Cadastro de Alunos e Professores**
   - Usar componentes `AddAlunoModal` e `AddProfessorModal`
   - Integrar com Edge Function `create-access`
   - Permitir que diretores e professores cadastrem novos usuários

2. **Melhorias na UX**
   - Indicador de progresso nas etapas
   - Validação em tempo real
   - Preview dos dados antes de salvar

3. **Funcionalidades Avançadas**
   - Upload de logo da escola
   - Configurações de horário de funcionamento
   - Integração com sistemas de pagamento

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/pages/SchoolSettings.tsx`
- `src/utils/cep.ts`
- `src/hooks/useFirstTimeSetup.ts`
- `supabase/migrations/20250118000002_add_school_fields.sql`

### Arquivos Modificados
- `src/pages/Auth.tsx` - Adicionado campo telefone
- `src/contexts/SchoolContext.tsx` - Novos campos e função updateSchool
- `src/components/ProtectedRoute.tsx` - Integração com useFirstTimeSetup
- `src/App.tsx` - Nova rota /school-settings

## Testando a Implementação

1. **Teste de Cadastro Novo**
   - Acesse `/auth`
   - Cadastre um novo diretor
   - Verifique redirecionamento automático para configurações

2. **Teste de Busca CEP**
   - Na página de configurações
   - Digite um CEP válido (ex: 01310-100)
   - Verifique preenchimento automático dos campos

3. **Teste de Validação**
   - Teste campos obrigatórios
   - Teste formatação de CNPJ e telefone
   - Teste validação de CEP inválido