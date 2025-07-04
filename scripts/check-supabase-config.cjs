#!/usr/bin/env node

/**
 * Script de Verificação da Configuração do Supabase
 * 
 * Este script verifica se a configuração do Supabase está correta
 * e diagnostica problemas comuns de conectividade.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🔍 ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Função para ler arquivo .env
function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('Arquivo .env não encontrado!');
    logInfo('Crie um arquivo .env na raiz do projeto com as configurações do Supabase.');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// Função para validar URL do Supabase
function validateSupabaseUrl(url) {
  if (!url) {
    logError('VITE_SUPABASE_URL não está definida!');
    return false;
  }
  
  // Verificar se é URL local (desenvolvimento)
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    logWarning('Detectada configuração LOCAL do Supabase!');
    logInfo('URL: ' + url);
    logInfo('Para usar Supabase local, certifique-se de que o Docker está rodando.');
    logInfo('Para usar Supabase remoto, atualize a URL para: https://seu-projeto.supabase.co');
    return 'local';
  }
  
  // Verificar se é URL de exemplo
  if (url.includes('seu-projeto.supabase.co')) {
    logError('URL do Supabase ainda é um exemplo!');
    logInfo('Substitua "seu-projeto" pelo ID real do seu projeto Supabase.');
    return false;
  }
  
  // Validar formato da URL
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.endsWith('.supabase.co')) {
      logWarning('URL não parece ser do Supabase oficial.');
      logInfo('URLs do Supabase geralmente terminam com ".supabase.co"');
    }
    logSuccess('URL do Supabase válida: ' + url);
    return true;
  } catch (error) {
    logError('URL do Supabase inválida: ' + url);
    return false;
  }
}

// Função para validar chave anônima
function validateAnonKey(key) {
  if (!key) {
    logError('VITE_SUPABASE_ANON_KEY não está definida!');
    return false;
  }
  
  // Verificar se é chave de exemplo
  if (key === 'sua_chave_anonima_aqui') {
    logError('Chave anônima ainda é um exemplo!');
    logInfo('Substitua pela chave anônima real do seu projeto Supabase.');
    return false;
  }
  
  // Verificar se é chave local do Supabase
  if (key.includes('supabase-demo')) {
    logWarning('Detectada chave LOCAL do Supabase!');
    logInfo('Esta é uma chave para desenvolvimento local.');
    return 'local';
  }
  
  // Validar formato JWT básico
  const parts = key.split('.');
  if (parts.length !== 3) {
    logError('Chave anônima não parece ser um JWT válido!');
    return false;
  }
  
  if (key.length < 100) {
    logWarning('Chave anônima parece muito curta.');
  }
  
  logSuccess('Chave anônima parece válida (comprimento: ' + key.length + ' caracteres)');
  return true;
}

// Função para testar conectividade
function testConnectivity(url) {
  return new Promise((resolve) => {
    if (!url || url.includes('seu-projeto.supabase.co')) {
      resolve(false);
      return;
    }
    
    try {
      const parsedUrl = new URL(url);
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: '/rest/v1/',
        method: 'GET',
        timeout: 5000
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 401) {
          logSuccess('Conectividade com Supabase OK!');
          resolve(true);
        } else {
          logWarning(`Resposta inesperada do Supabase: ${res.statusCode}`);
          resolve(false);
        }
      });
      
      req.on('error', (error) => {
        logError('Erro de conectividade: ' + error.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        logError('Timeout na conexão com Supabase');
        resolve(false);
      });
      
      req.setTimeout(5000);
      req.end();
    } catch (error) {
      logError('Erro ao testar conectividade: ' + error.message);
      resolve(false);
    }
  });
}

// Função para verificar arquivos de configuração
function checkConfigFiles() {
  logHeader('Verificando Arquivos de Configuração');
  
  const files = [
    { path: '.env', required: true, description: 'Variáveis de ambiente' },
    { path: '.env.example', required: false, description: 'Exemplo de configuração' },
    { path: 'src/integrations/supabase/client.ts', required: true, description: 'Cliente Supabase' },
    { path: 'src/config/environment.ts', required: true, description: 'Configuração de ambiente' }
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      logSuccess(`${file.description}: ${file.path}`);
    } else if (file.required) {
      logError(`${file.description} não encontrado: ${file.path}`);
    } else {
      logWarning(`${file.description} não encontrado: ${file.path}`);
    }
  });
}

// Função para verificar dependências
function checkDependencies() {
  logHeader('Verificando Dependências');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json não encontrado!');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'react',
    'vite'
  ];
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      logSuccess(`${dep}: ${dependencies[dep]}`);
    } else {
      logError(`Dependência obrigatória não encontrada: ${dep}`);
    }
  });
}

// Função para gerar relatório de recomendações
function generateRecommendations(envVars, urlValid, keyValid, connectivity) {
  logHeader('Recomendações');
  
  if (!envVars) {
    logError('1. Crie um arquivo .env na raiz do projeto');
    logInfo('   Copie o .env.example e preencha com suas credenciais.');
    return;
  }
  
  if (!urlValid || urlValid === 'local') {
    logError('2. Configure a URL do Supabase corretamente');
    logInfo('   - Para desenvolvimento remoto: https://seu-projeto.supabase.co');
    logInfo('   - Para desenvolvimento local: http://127.0.0.1:54321');
  }
  
  if (!keyValid || keyValid === 'local') {
    logError('3. Configure a chave anônima do Supabase');
    logInfo('   Obtenha a chave no dashboard do Supabase > Settings > API');
  }
  
  if (!connectivity && urlValid === true) {
    logError('4. Problemas de conectividade detectados');
    logInfo('   - Verifique sua conexão com a internet');
    logInfo('   - Verifique se o projeto Supabase está ativo');
    logInfo('   - Verifique configurações de firewall/proxy');
  }
  
  if (urlValid === true && keyValid === true && connectivity) {
    logSuccess('✨ Configuração parece estar correta!');
    logInfo('Se ainda houver problemas, verifique:');
    logInfo('- Políticas RLS no Supabase Studio');
    logInfo('- Migrações do banco de dados');
    logInfo('- Logs do console do navegador');
  }
}

// Função principal
async function main() {
  log('\n🚀 Verificador de Configuração do Supabase', 'cyan');
  log('SmartClass Dashboard Hub', 'cyan');
  
  // Verificar arquivos de configuração
  checkConfigFiles();
  
  // Verificar dependências
  checkDependencies();
  
  // Verificar variáveis de ambiente
  logHeader('Verificando Variáveis de Ambiente');
  const envVars = readEnvFile();
  
  if (!envVars) {
    generateRecommendations(null);
    return;
  }
  
  // Validar configurações do Supabase
  logHeader('Validando Configuração do Supabase');
  const urlValid = validateSupabaseUrl(envVars.VITE_SUPABASE_URL);
  const keyValid = validateAnonKey(envVars.VITE_SUPABASE_ANON_KEY);
  
  // Testar conectividade
  logHeader('Testando Conectividade');
  let connectivity = false;
  if (urlValid === true) {
    logInfo('Testando conexão com Supabase...');
    connectivity = await testConnectivity(envVars.VITE_SUPABASE_URL);
  } else {
    logWarning('Pulando teste de conectividade devido a problemas de configuração.');
  }
  
  // Gerar recomendações
  generateRecommendations(envVars, urlValid, keyValid, connectivity);
  
  log('\n🏁 Verificação concluída!', 'cyan');
}

// Executar script
if (require.main === module) {
  main().catch(error => {
    logError('Erro inesperado: ' + error.message);
    process.exit(1);
  });
}

module.exports = { main };