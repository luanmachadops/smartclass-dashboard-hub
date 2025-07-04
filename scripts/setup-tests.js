#!/usr/bin/env node

/**
 * Script de configuração inicial para testes
 * Configura o ambiente de desenvolvimento e testes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} concluído!`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro ao ${description.toLowerCase()}: ${error.message}`, 'red');
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} encontrado`, 'green');
    return true;
  } else {
    log(`❌ ${description} não encontrado: ${filePath}`, 'red');
    return false;
  }
}

function createEnvFile() {
  const envTestPath = path.join(process.cwd(), '.env.test');
  
  if (!fs.existsSync(envTestPath)) {
    const envTestContent = `# Configurações para testes
NODE_ENV=test
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Configurações de teste
TEST_TIMEOUT=30000
TEST_RETRIES=2
TEST_PARALLEL=true

# Configurações do Playwright
PLAYWRIGHT_BROWSERS_PATH=0
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
`;
    
    fs.writeFileSync(envTestPath, envTestContent);
    log('✅ Arquivo .env.test criado', 'green');
  } else {
    log('✅ Arquivo .env.test já existe', 'green');
  }
}

function createGitHubWorkflow() {
  const workflowDir = path.join(process.cwd(), '.github', 'workflows');
  const workflowPath = path.join(workflowDir, 'tests.yml');
  
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }
  
  if (!fs.existsSync(workflowPath)) {
    const workflowContent = `name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup Supabase CLI
      uses: supabase/setup-cli@v1
      with:
        version: latest
    
    - name: Start Supabase local development setup
      run: supabase start
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          coverage/
          playwright-report/
          test-results/
`;
    
    fs.writeFileSync(workflowPath, workflowContent);
    log('✅ Workflow do GitHub Actions criado', 'green');
  } else {
    log('✅ Workflow do GitHub Actions já existe', 'green');
  }
}

function main() {
  log('🚀 Configurando ambiente de testes...', 'cyan');
  log('=====================================', 'cyan');
  
  // Verificar se estamos no diretório correto
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!checkFile(packageJsonPath, 'package.json')) {
    log('❌ Execute este script na raiz do projeto!', 'red');
    process.exit(1);
  }
  
  // Verificar dependências principais
  log('\n📦 Verificando dependências...', 'yellow');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['vitest', '@playwright/test', '@testing-library/react'];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]
  );
  
  if (missingDeps.length > 0) {
    log(`❌ Dependências faltando: ${missingDeps.join(', ')}`, 'red');
    log('Execute: npm install', 'yellow');
    process.exit(1);
  }
  
  log('✅ Todas as dependências estão instaladas', 'green');
  
  // Criar arquivos de configuração
  log('\n⚙️  Criando arquivos de configuração...', 'yellow');
  createEnvFile();
  createGitHubWorkflow();
  
  // Verificar Supabase CLI
  log('\n🔧 Verificando Supabase CLI...', 'yellow');
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    log('✅ Supabase CLI encontrado', 'green');
  } catch (error) {
    log('❌ Supabase CLI não encontrado', 'red');
    log('Instale com: npm install -g supabase', 'yellow');
  }
  
  // Instalar browsers do Playwright
  log('\n🌐 Configurando Playwright...', 'yellow');
  if (!execCommand('npx playwright install', 'Instalando browsers do Playwright')) {
    log('⚠️  Falha ao instalar browsers. Execute manualmente: npx playwright install', 'yellow');
  }
  
  // Verificar estrutura de testes
  log('\n🧪 Verificando estrutura de testes...', 'yellow');
  const testFiles = [
    'src/tests/setup.ts',
    'vitest.config.ts',
    'playwright.config.ts'
  ];
  
  testFiles.forEach(file => {
    checkFile(path.join(process.cwd(), file), file);
  });
  
  // Executar teste básico
  log('\n🎯 Executando teste básico...', 'yellow');
  if (execCommand('npm run test:run -- --reporter=basic', 'Executando testes')) {
    log('\n🎉 Configuração concluída com sucesso!', 'green');
  } else {
    log('\n⚠️  Configuração concluída, mas alguns testes falharam', 'yellow');
  }
  
  // Instruções finais
  log('\n📋 Próximos passos:', 'cyan');
  log('1. Execute: npx supabase start (para testes de integração)', 'blue');
  log('2. Execute: npm run test:watch (para desenvolvimento)', 'blue');
  log('3. Execute: npm run test:e2e (para testes E2E)', 'blue');
  log('4. Consulte TESTING.md para mais informações', 'blue');
  
  log('\n✨ Ambiente de testes configurado!', 'green');
}

if (require.main === module) {
  main();
}

module.exports = { main };