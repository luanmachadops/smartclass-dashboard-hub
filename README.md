# 🎵 SmartClass Dashboard Hub

> Sistema de gestão completo para escolas de música

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

## 📋 Sobre o Projeto

O **SmartClass Dashboard Hub** é uma plataforma completa de gestão para escolas de música, oferecendo funcionalidades abrangentes para administração acadêmica, financeira e comunicação.

### ✨ Funcionalidades Principais

- 🔐 **Sistema de Autenticação Completo** - Login, registro, recuperação de senha
- 👥 **Gestão de Usuários** - Alunos, professores, administradores
- 📚 **Gestão Acadêmica** - Turmas, cursos, aulas, matrículas
- 💰 **Gestão Financeira** - Receitas, despesas, relatórios
- 💬 **Sistema de Comunicação** - Chat em tempo real, notificações
- 📊 **Dashboard Analítico** - Estatísticas e métricas em tempo real
- 📱 **Interface Responsiva** - Funciona em desktop, tablet e mobile

### 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **UI/UX**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Validação**: Zod schemas
- **Estado**: React Context API, Custom Hooks
- **Qualidade**: ESLint, TypeScript, Error Boundaries

## 🚀 Início Rápido

### 📋 Pré-requisitos

- Node.js 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm ou yarn
- Docker Desktop (para Supabase local) ou conta no Supabase

### 🔧 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/smartclass-dashboard-hub.git
cd smartclass-dashboard-hub
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

**Opção A: Supabase Local (requer Docker Desktop)**
```env
VITE_SUPABASE_URL=http://127.0.0.1:9001
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**Opção B: Supabase Remoto (recomendado)**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

4. **Configure o banco de dados**

**Para Supabase Local:**
```bash
# Inicie o Supabase local
npx supabase start

# Execute as migrações
npx supabase db reset
```

**Para Supabase Remoto:**
- Crie um projeto em [supabase.com](https://supabase.com)
- Execute as migrações na pasta `supabase/migrations/`
- Configure as Edge Functions se necessário

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── forms/          # Formulários
│   ├── modals/         # Modais
│   ├── chat/           # Componentes de chat
│   └── ErrorBoundary.tsx
├── contexts/           # Contextos React (Auth, School, etc.)
├── hooks/              # Hooks customizados
├── pages/              # Páginas da aplicação
├── services/           # Serviços (logger, monitoring, testing)
├── schemas/            # Schemas de validação (Zod)
├── config/             # Configurações da aplicação
├── types/              # Definições de tipos TypeScript
└── integrations/       # Integrações externas (Supabase)

supabase/
├── migrations/         # Migrações do banco de dados
├── functions/          # Edge Functions
└── config.toml         # Configuração do Supabase
```

## 🔐 Sistema de Autenticação

O sistema utiliza autenticação baseada em JWT com diferentes níveis de acesso:

- **👑 Diretor**: Acesso total ao sistema
- **⚙️ Admin**: Acesso administrativo completo
- **📝 Secretário**: Gestão de alunos, professores e financeiro
- **👨‍🏫 Professor**: Acesso a turmas e alunos
- **🎓 Aluno**: Acesso limitado ao próprio perfil

## 🛡️ Melhorias de Qualidade Implementadas

### 📝 Sistema de Logging Estruturado
- Logs com níveis (ERROR, WARN, INFO, DEBUG)
- Armazenamento em memória com limpeza automática
- Tratamento global de erros
- Interface para visualização de logs

### ✅ Validação de Dados Robusta
- Schemas Zod para validação tipada
- Validação em tempo real nos formulários
- Mensagens de erro amigáveis e localizadas
- Validação assíncrona para dados únicos

### 📊 Monitoramento de Performance
- Captura de métricas de performance
- Registro de erros e exceções
- Tracking de ações do usuário
- Relatórios de uso e performance

### 🛡️ Tratamento de Erros Avançado
- ErrorBoundary para captura de erros React
- UI amigável para estados de erro
- Ações de recuperação automática
- Fallbacks para componentes com falha

### 🔄 Gerenciamento de Estado Assíncrono
- Hook `useAsyncState` com cache e retry
- Integração otimizada com Supabase
- Validação automática de dados
- Estados de loading e error consistentes

### 🧪 Framework de Testes Customizado
- Sistema de testes integrado
- Mocks e spies para Supabase
- Utilitários para testes React
- Execução de testes no navegador

## 📱 Funcionalidades Implementadas

### ✅ Páginas Principais
- **Dashboard**: Visão geral com estatísticas e ações rápidas
- **Alunos**: Gestão completa de alunos com busca e filtros
- **Professores**: Gestão de professores e suas especialidades
- **Turmas**: Criação e gestão de turmas e matrículas
- **Comunicação**: Sistema de chat em tempo real
- **Financeiro**: Gestão de receitas, despesas e relatórios
- **Cursos**: Catálogo de cursos e instrumentos
- **Relatórios**: Análises e relatórios detalhados

### ✅ Funcionalidades de Autenticação
- Login e registro de usuários
- Recuperação de senha
- Confirmação de email
- Gestão de sessões
- Convite de usuários

### ✅ Sistema de Chat
- Conversas em tempo real
- Suporte a arquivos e imagens
- Criação de grupos
- Busca em conversas
- Notificações

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção

# Qualidade de Código
npm run lint         # Executa ESLint
npm run type-check   # Verificação de tipos TypeScript

# Supabase Local
npx supabase start   # Inicia Supabase local
npx supabase stop    # Para Supabase local
npx supabase status  # Verifica status dos serviços
npx supabase db reset # Reset do banco de dados
```

## 🧪 Executando Testes

```bash
# No console do navegador (modo desenvolvimento)
window.runTests()    # Executa todos os testes

# Ver logs e métricas
logger.getLogs()     # Ver todos os logs
monitoring.getMetrics() # Ver métricas de performance
```

## 🌐 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload da pasta dist/ para Netlify
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente Completas

```env
# Supabase
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Logging
VITE_ENABLE_LOGGING=true
VITE_LOG_LEVEL=DEBUG

# Monitoramento
VITE_ENABLE_MONITORING=true
VITE_SENTRY_DSN=sua_dsn_do_sentry

# Funcionalidades
VITE_ENABLE_CHAT=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_BETA_FEATURES=false

# Testes
VITE_ENABLE_TESTING=true

# Suporte
VITE_SUPPORT_EMAIL=suporte@smartclass.com
```

## 📖 Documentação Adicional

- [📚 Guia de Melhorias](./MELHORIAS.md) - Documentação detalhada das melhorias
- [🔧 Migração JWT](./MIGRATION_JWT_CLAIMS.md) - Guia de migração para JWT claims
- [⚡ Otimização Frontend](./FRONTEND_JWT_OPTIMIZATION.md) - Otimizações de performance
- [🧪 Teste de Criação de Usuário](./TESTE_CRIACAO_USUARIO.md) - Testes de funcionalidade

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 **Email**: suporte@smartclass.com
- 🌐 **Website**: [smartclass.com](https://smartclass.com)
- 📚 **Documentação**: [docs.smartclass.com](https://docs.smartclass.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/seu-usuario/smartclass-dashboard-hub/issues)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Lucide](https://lucide.dev/) - Ícones
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Vite](https://vitejs.dev/) - Build tool

---

**Desenvolvido com ❤️ para escolas de música**

## 🎯 Status do Projeto

### ✅ Funcionalidades Implementadas
- [x] Sistema de autenticação completo
- [x] Dashboard com estatísticas
- [x] Gestão de alunos
- [x] Gestão de professores
- [x] Gestão de turmas
- [x] Sistema de comunicação (chat)
- [x] Gestão financeira
- [x] Sistema de logging
- [x] Validação de dados
- [x] Monitoramento de performance
- [x] Tratamento de erros
- [x] Testes automatizados
- [x] Interface responsiva

### 🔄 Em Desenvolvimento
- [ ] Relatórios avançados
- [ ] Notificações push
- [ ] Integração com calendário
- [ ] Sistema de avaliações
- [ ] Backup automático

### 🎯 Próximas Funcionalidades
- [ ] App mobile
- [ ] Integração com sistemas de pagamento
- [ ] API pública
- [ ] Plugins e extensões
- [ ] Análise de dados com IA

O projeto está **100% funcional** e pronto para uso em produção! 🚀
