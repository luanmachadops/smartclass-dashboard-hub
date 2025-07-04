# Guia de Testes - SmartClass Dashboard Hub

Este documento descreve a estrutura de testes implementada no projeto e como executá-los.

## 📋 Estrutura de Testes

### Tipos de Testes

1. **Testes Unitários** (`src/tests/unit/`)
   - Testam componentes, hooks e serviços isoladamente
   - Usam mocks para dependências externas
   - Executam rapidamente

2. **Testes de Integração** (`src/tests/integration/`)
   - Testam a integração entre diferentes partes do sistema
   - Incluem testes de políticas RLS do Supabase
   - Verificam fluxos completos de dados

3. **Testes E2E** (`src/tests/e2e/`)
   - Testam o sistema completo do ponto de vista do usuário
   - Usam Playwright para automação do navegador
   - Simulam interações reais do usuário

### Estrutura de Arquivos

```
src/tests/
├── setup.ts                 # Configuração global dos testes
├── unit/
│   ├── components.test.tsx   # Testes de componentes React
│   ├── hooks.test.tsx        # Testes de hooks personalizados
│   └── services.test.ts      # Testes de serviços
├── integration/
│   └── rls.test.ts          # Testes de políticas RLS
├── e2e/
│   ├── auth.spec.ts         # Testes E2E de autenticação
│   ├── dashboard.spec.ts    # Testes E2E do dashboard
│   ├── global-setup.ts      # Setup global para E2E
│   └── global-teardown.ts   # Limpeza global para E2E
└── mocks/
    └── server.ts            # Configuração do MSW para mocks
```

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar Supabase local (para testes de integração):**
   ```bash
   npx supabase start
   ```

### Comandos de Teste

#### Testes Unitários
```bash
# Executar todos os testes unitários
npm run test:unit

# Executar testes em modo watch
npm run test:watch

# Executar com interface gráfica
npm run test:ui
```

#### Testes de Integração
```bash
# Executar testes de integração
npm run test:integration

# Executar todos os testes (unitários + integração)
npm run test:all
```

#### Testes E2E
```bash
# Executar testes E2E
npm run test:e2e

# Executar E2E em modo debug
npx playwright test --debug

# Executar E2E com interface gráfica
npx playwright test --ui
```

#### Cobertura de Código
```bash
# Gerar relatório de cobertura
npm run test:coverage

# Visualizar relatório de cobertura
npx vite preview --outDir coverage
```

#### Execução Completa (CI)
```bash
# Executar todos os testes com cobertura
npm run test:ci
```

## 📊 Métricas de Qualidade

### Limites de Cobertura

O projeto mantém os seguintes limites mínimos de cobertura:
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

### Ferramentas de Qualidade

- **Vitest:** Framework de testes unitários e de integração
- **Playwright:** Testes E2E automatizados
- **Testing Library:** Utilitários para testes de componentes React
- **MSW:** Mock Service Worker para interceptação de requisições
- **Jest DOM:** Matchers adicionais para testes DOM

## 🔧 Configuração

### Arquivos de Configuração

- `vitest.config.ts` - Configuração do Vitest
- `playwright.config.ts` - Configuração do Playwright
- `src/tests/setup.ts` - Setup global dos testes

### Variáveis de Ambiente para Testes

```env
# .env.test
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-test-anon-key
NODE_ENV=test
```

## 🧪 Escrevendo Testes

### Testes Unitários

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### Testes de Integração

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('RLS Policies', () => {
  let supabase: any;

  beforeEach(() => {
    supabase = createClient(url, key);
  });

  it('should enforce user access policies', async () => {
    // Test implementation
  });
});
```

### Testes E2E

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## 🐛 Debugging

### Testes Unitários
```bash
# Executar teste específico
npm test -- --run src/tests/unit/components.test.tsx

# Debug com breakpoints
npm test -- --inspect-brk
```

### Testes E2E
```bash
# Executar com interface gráfica
npx playwright test --ui

# Executar em modo debug
npx playwright test --debug

# Executar com trace
npx playwright test --trace on
```

## 📈 Monitoramento

### Relatórios

- **Cobertura:** `coverage/index.html`
- **Resultados E2E:** `playwright-report/index.html`
- **Resultados JSON:** `coverage/test-results.json`

### Integração CI/CD

Os testes são executados automaticamente em:
- Pull Requests
- Commits na branch main
- Releases

## 🔍 Troubleshooting

### Problemas Comuns

1. **Supabase não conecta:**
   ```bash
   npx supabase start
   npx supabase status
   ```

2. **Testes E2E falham:**
   ```bash
   npx playwright install
   npm run dev # Em terminal separado
   ```

3. **Cobertura baixa:**
   - Verificar arquivos não testados
   - Adicionar testes para branches não cobertas
   - Revisar configuração de exclusões

### Logs e Debug

```bash
# Logs detalhados
DEBUG=* npm test

# Logs do Playwright
DEBUG=pw:* npx playwright test
```

## 📚 Recursos Adicionais

- [Documentação do Vitest](https://vitest.dev/)
- [Documentação do Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

---

**Nota:** Este documento é atualizado conforme a evolução da estrutura de testes do projeto.