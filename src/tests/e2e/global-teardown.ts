import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...');

  // Configurar Supabase para limpeza
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Limpar dados de teste
    await cleanupTestData(supabase);
    console.log('✅ Dados de teste limpos');
  } catch (error) {
    console.warn('⚠️  Erro ao limpar dados de teste:', error);
  }

  try {
    // Limpar arquivos de autenticação
    await cleanupAuthFiles();
    console.log('✅ Arquivos de autenticação limpos');
  } catch (error) {
    console.warn('⚠️  Erro ao limpar arquivos de autenticação:', error);
  }

  try {
    // Limpar arquivos temporários
    await cleanupTempFiles();
    console.log('✅ Arquivos temporários limpos');
  } catch (error) {
    console.warn('⚠️  Erro ao limpar arquivos temporários:', error);
  }

  console.log('🎉 Limpeza global concluída!');
}

async function cleanupTestData(supabase: any) {
  const testIds = [
    'test-director-1',
    'test-teacher-1',
    'test-student-1',
    'test-school-1'
  ];

  try {
    // Remover usuários de teste
    const { error: usersError } = await supabase
      .from('profiles')
      .delete()
      .in('id', testIds.slice(0, 3)); // Primeiros 3 são usuários

    if (usersError && !usersError.message.includes('not found')) {
      console.warn('Erro ao remover usuários de teste:', usersError);
    }

    // Remover escola de teste
    const { error: schoolError } = await supabase
      .from('schools')
      .delete()
      .eq('id', 'test-school-1');

    if (schoolError && !schoolError.message.includes('not found')) {
      console.warn('Erro ao remover escola de teste:', schoolError);
    }

    // Limpar dados de sessão/cache se existirem
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .delete()
      .like('user_id', 'test-%');

    if (sessionError && !sessionError.message.includes('not found')) {
      console.warn('Erro ao limpar sessões de teste:', sessionError);
    }
  } catch (error) {
    // Ignorar erros de dados não encontrados
    if (!error.message?.includes('not found')) {
      throw error;
    }
  }
}

async function cleanupAuthFiles() {
  const authDir = path.join(process.cwd(), 'playwright', '.auth');
  
  try {
    // Verificar se o diretório existe
    await fs.access(authDir);
    
    // Listar arquivos no diretório
    const files = await fs.readdir(authDir);
    
    // Remover todos os arquivos de autenticação
    for (const file of files) {
      const filePath = path.join(authDir, file);
      await fs.unlink(filePath);
    }
    
    // Remover o diretório se estiver vazio
    await fs.rmdir(authDir);
  } catch (error) {
    // Ignorar se o diretório não existir
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function cleanupTempFiles() {
  const tempDirs = [
    path.join(process.cwd(), 'playwright-report'),
    path.join(process.cwd(), 'test-results'),
    path.join(process.cwd(), '.temp'),
    path.join(process.cwd(), 'coverage', 'tmp')
  ];

  for (const dir of tempDirs) {
    try {
      // Verificar se o diretório existe
      await fs.access(dir);
      
      // Remover arquivos temporários (manter estrutura de diretórios)
      const files = await fs.readdir(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isFile()) {
          // Remover apenas arquivos temporários específicos
          if (
            file.name.endsWith('.tmp') ||
            file.name.endsWith('.temp') ||
            file.name.includes('temp-') ||
            file.name.includes('test-')
          ) {
            await fs.unlink(filePath);
          }
        }
      }
    } catch (error) {
      // Ignorar se o diretório não existir
      if (error.code !== 'ENOENT') {
        console.warn(`Erro ao limpar ${dir}:`, error.message);
      }
    }
  }

  // Limpar arquivos específicos na raiz
  const rootFiles = [
    'test-results.xml',
    'junit.xml',
    'coverage-final.json',
    '.nyc_output'
  ];

  for (const file of rootFiles) {
    try {
      const filePath = path.join(process.cwd(), file);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignorar se o arquivo não existir
      if (error.code !== 'ENOENT') {
        console.warn(`Erro ao remover ${file}:`, error.message);
      }
    }
  }
}

export default globalTeardown;