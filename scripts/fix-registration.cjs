/**
 * Script para corrigir problemas de cadastro
 * Execute com: node scripts/fix-registration.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function resetarBanco() {
  console.log('🚀 SmartClass - Corretor de Problemas de Cadastro');
  console.log('================================================\n');
  
  try {
    console.log('📦 Resetando banco de dados...');
    await execAsync('npx supabase db reset', { cwd: process.cwd() });
    console.log('✅ Banco de dados resetado com sucesso!');
    
    console.log('\n🎉 Correção aplicada com sucesso!');
    console.log('\n📝 Próximos passos para testar:');
    console.log('1. Acesse http://localhost:8082/');
    console.log('2. Vá para a aba "Cadastrar"');
    console.log('3. Teste com os dados:');
    console.log('   - Nome da Escola: Escola Teste');
    console.log('   - Nome do Diretor: João Silva');
    console.log('   - Email: joao@teste.com');
    console.log('   - Senha: 123456');
    console.log('\n⚠️  IMPORTANTE: Use um email diferente a cada teste!');
    
  } catch (error) {
    console.error('❌ Erro ao resetar banco:', error.message);
    console.log('\n🔧 Tente executar manualmente:');
    console.log('npx supabase db reset');
  }
}

if (require.main === module) {
  resetarBanco().catch(console.error);
}

module.exports = { resetarBanco };