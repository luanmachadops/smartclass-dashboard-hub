import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  // Configurar Supabase para testes
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Verificar se o Supabase está rodando
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error && error.message.includes('connection')) {
      console.warn('⚠️  Supabase local não está rodando. Alguns testes podem falhar.');
      console.warn('   Execute: npx supabase start');
    } else {
      console.log('✅ Supabase conectado com sucesso');
    }
  } catch (error) {
    console.warn('⚠️  Erro ao conectar com Supabase:', error);
  }

  // Criar dados de teste se necessário
  try {
    await setupTestData(supabase);
    console.log('✅ Dados de teste configurados');
  } catch (error) {
    console.warn('⚠️  Erro ao configurar dados de teste:', error);
  }

  // Configurar autenticação de teste
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navegar para a página de login e fazer login com usuário de teste
    await page.goto(config.projects[0].use?.baseURL || 'http://localhost:5173');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Salvar estado de autenticação se necessário
    await context.storageState({ path: 'playwright/.auth/user.json' });
    
    console.log('✅ Estado de autenticação salvo');
  } catch (error) {
    console.warn('⚠️  Erro ao configurar autenticação:', error);
  } finally {
    await context.close();
    await browser.close();
  }

  console.log('🎉 Setup global concluído!');
}

async function setupTestData(supabase: any) {
  // Criar usuários de teste
  const testUsers = [
    {
      id: 'test-director-1',
      email: 'diretor.teste@escola.com',
      full_name: 'Diretor Teste',
      role: 'director',
      school_id: 'test-school-1'
    },
    {
      id: 'test-teacher-1',
      email: 'professor.teste@escola.com',
      full_name: 'Professor Teste',
      role: 'teacher',
      school_id: 'test-school-1'
    },
    {
      id: 'test-student-1',
      email: 'aluno.teste@escola.com',
      full_name: 'Aluno Teste',
      role: 'student',
      school_id: 'test-school-1'
    }
  ];

  // Criar escola de teste
  const testSchool = {
    id: 'test-school-1',
    name: 'Escola de Música Teste',
    address: 'Rua Teste, 123',
    phone: '(11) 99999-9999',
    email: 'contato@escolateste.com',
    director_id: 'test-director-1',
    settings: {
      theme: 'light',
      notifications: true,
      auto_backup: true
    }
  };

  try {
    // Inserir escola de teste (se não existir)
    const { error: schoolError } = await supabase
      .from('schools')
      .upsert([testSchool], { onConflict: 'id' });

    if (schoolError && !schoolError.message.includes('already exists')) {
      console.warn('Erro ao criar escola de teste:', schoolError);
    }

    // Inserir usuários de teste (se não existirem)
    const { error: usersError } = await supabase
      .from('profiles')
      .upsert(testUsers, { onConflict: 'id' });

    if (usersError && !usersError.message.includes('already exists')) {
      console.warn('Erro ao criar usuários de teste:', usersError);
    }
  } catch (error) {
    // Ignorar erros de dados já existentes
    if (!error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export default globalSetup;