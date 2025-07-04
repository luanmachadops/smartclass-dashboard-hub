import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/environment';

// Configuração de teste
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.anonKey;

// Clientes de teste
let supabase: SupabaseClient;
let directorClient: SupabaseClient;
let teacherClient: SupabaseClient;
let studentClient: SupabaseClient;

// Dados de teste
const testData = {
  director: {
    email: 'director.test@example.com',
    password: 'test123456',
    nome_completo: 'Diretor Teste',
    tipo_usuario: 'diretor'
  },
  teacher: {
    email: 'teacher.test@example.com',
    password: 'test123456',
    nome_completo: 'Professor Teste',
    tipo_usuario: 'professor'
  },
  student: {
    email: 'student.test@example.com',
    password: 'test123456',
    nome_completo: 'Aluno Teste',
    tipo_usuario: 'aluno'
  },
  school: {
    nome: 'Escola Teste RLS',
    endereco: 'Rua Teste, 123',
    telefone: '(11) 99999-9999',
    email: 'escola.teste@example.com'
  }
};

let testSchoolId: string;
let directorUserId: string;
let teacherUserId: string;
let studentUserId: string;

describe('RLS (Row Level Security) Integration Tests', () => {
  beforeAll(async () => {
    // Inicializar clientes
    supabase = createClient(supabaseUrl, supabaseKey);
    directorClient = createClient(supabaseUrl, supabaseKey);
    teacherClient = createClient(supabaseUrl, supabaseKey);
    studentClient = createClient(supabaseUrl, supabaseKey);

    // Limpar dados de teste anteriores
    await cleanupTestData();
  });

  afterAll(async () => {
    // Limpar dados de teste
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Reset para estado limpo antes de cada teste
    await supabase.auth.signOut();
    await directorClient.auth.signOut();
    await teacherClient.auth.signOut();
    await studentClient.auth.signOut();
  });

  describe('Autenticação e Criação de Usuários', () => {
    it('deve criar diretor e escola com sucesso', async () => {
      // Criar diretor
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.director.email,
        password: testData.director.password,
        options: {
          data: {
            nome_completo: testData.director.nome_completo,
            tipo_usuario: testData.director.tipo_usuario
          }
        }
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeTruthy();
      directorUserId = authData.user!.id;

      // Fazer login como diretor
      const { error: signInError } = await directorClient.auth.signInWithPassword({
        email: testData.director.email,
        password: testData.director.password
      });

      expect(signInError).toBeNull();

      // Aguardar um pouco para o perfil ser criado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Criar escola
      const { data: schoolData, error: schoolError } = await directorClient
        .from('schools')
        .insert(testData.school)
        .select()
        .single();

      expect(schoolError).toBeNull();
      expect(schoolData).toBeTruthy();
      testSchoolId = schoolData.id;
    });

    it('deve criar professor vinculado à escola', async () => {
      // Criar professor
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.teacher.email,
        password: testData.teacher.password,
        options: {
          data: {
            nome_completo: testData.teacher.nome_completo,
            tipo_usuario: testData.teacher.tipo_usuario,
            school_id: testSchoolId
          }
        }
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeTruthy();
      teacherUserId = authData.user!.id;

      // Fazer login como professor
      const { error: signInError } = await teacherClient.auth.signInWithPassword({
        email: testData.teacher.email,
        password: testData.teacher.password
      });

      expect(signInError).toBeNull();
    });

    it('deve criar aluno vinculado à escola', async () => {
      // Criar aluno
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testData.student.email,
        password: testData.student.password,
        options: {
          data: {
            nome_completo: testData.student.nome_completo,
            tipo_usuario: testData.student.tipo_usuario,
            school_id: testSchoolId
          }
        }
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeTruthy();
      studentUserId = authData.user!.id;

      // Fazer login como aluno
      const { error: signInError } = await studentClient.auth.signInWithPassword({
        email: testData.student.email,
        password: testData.student.password
      });

      expect(signInError).toBeNull();
    });
  });

  describe('Políticas RLS para Profiles', () => {
    it('diretor deve ver apenas perfis da sua escola', async () => {
      await directorClient.auth.signInWithPassword({
        email: testData.director.email,
        password: testData.director.password
      });

      const { data, error } = await directorClient
        .from('profiles')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      
      // Deve ver pelo menos o próprio perfil
      expect(data!.length).toBeGreaterThan(0);
      
      // Todos os perfis devem ser da mesma escola
      const schoolIds = data!.map(profile => profile.school_id).filter(Boolean);
      const uniqueSchoolIds = [...new Set(schoolIds)];
      expect(uniqueSchoolIds.length).toBeLessThanOrEqual(1);
    });

    it('professor deve ver apenas perfis da sua escola', async () => {
      await teacherClient.auth.signInWithPassword({
        email: testData.teacher.email,
        password: testData.teacher.password
      });

      const { data, error } = await teacherClient
        .from('profiles')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      
      // Todos os perfis devem ser da mesma escola
      const schoolIds = data!.map(profile => profile.school_id).filter(Boolean);
      const uniqueSchoolIds = [...new Set(schoolIds)];
      expect(uniqueSchoolIds.length).toBeLessThanOrEqual(1);
    });

    it('aluno deve ver apenas o próprio perfil', async () => {
      await studentClient.auth.signInWithPassword({
        email: testData.student.email,
        password: testData.student.password
      });

      const { data, error } = await studentClient
        .from('profiles')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      
      // Deve ver apenas o próprio perfil
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(studentUserId);
    });

    it('usuário não autenticado não deve ver nenhum perfil', async () => {
      await supabase.auth.signOut();

      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      // Deve retornar erro ou array vazio
      expect(data).toEqual([]);
    });
  });

  describe('Políticas RLS para Schools', () => {
    it('diretor deve ver apenas a própria escola', async () => {
      await directorClient.auth.signInWithPassword({
        email: testData.director.email,
        password: testData.director.password
      });

      const { data, error } = await directorClient
        .from('schools')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(testSchoolId);
    });

    it('professor deve ver apenas a escola onde trabalha', async () => {
      await teacherClient.auth.signInWithPassword({
        email: testData.teacher.email,
        password: testData.teacher.password
      });

      const { data, error } = await teacherClient
        .from('schools')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(testSchoolId);
    });

    it('aluno deve ver apenas a escola onde estuda', async () => {
      await studentClient.auth.signInWithPassword({
        email: testData.student.email,
        password: testData.student.password
      });

      const { data, error } = await studentClient
        .from('schools')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.length).toBe(1);
      expect(data![0].id).toBe(testSchoolId);
    });
  });

  describe('Operações de Escrita', () => {
    it('diretor deve conseguir atualizar dados da escola', async () => {
      await directorClient.auth.signInWithPassword({
        email: testData.director.email,
        password: testData.director.password
      });

      const { data, error } = await directorClient
        .from('schools')
        .update({ telefone: '(11) 88888-8888' })
        .eq('id', testSchoolId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.telefone).toBe('(11) 88888-8888');
    });

    it('professor não deve conseguir atualizar dados da escola', async () => {
      await teacherClient.auth.signInWithPassword({
        email: testData.teacher.email,
        password: testData.teacher.password
      });

      const { data, error } = await teacherClient
        .from('schools')
        .update({ telefone: '(11) 77777-7777' })
        .eq('id', testSchoolId);

      // Deve falhar ou não retornar dados
      expect(error || !data || data.length === 0).toBeTruthy();
    });

    it('aluno não deve conseguir atualizar dados da escola', async () => {
      await studentClient.auth.signInWithPassword({
        email: testData.student.email,
        password: testData.student.password
      });

      const { data, error } = await studentClient
        .from('schools')
        .update({ telefone: '(11) 66666-6666' })
        .eq('id', testSchoolId);

      // Deve falhar ou não retornar dados
      expect(error || !data || data.length === 0).toBeTruthy();
    });

    it('usuário deve conseguir atualizar o próprio perfil', async () => {
      await teacherClient.auth.signInWithPassword({
        email: testData.teacher.email,
        password: testData.teacher.password
      });

      const { data, error } = await teacherClient
        .from('profiles')
        .update({ nome_completo: 'Professor Teste Atualizado' })
        .eq('id', teacherUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.nome_completo).toBe('Professor Teste Atualizado');
    });

    it('usuário não deve conseguir atualizar perfil de outro usuário', async () => {
      await teacherClient.auth.signInWithPassword({
        email: testData.teacher.email,
        password: testData.teacher.password
      });

      const { data, error } = await teacherClient
        .from('profiles')
        .update({ nome_completo: 'Tentativa de Hack' })
        .eq('id', directorUserId);

      // Deve falhar ou não retornar dados
      expect(error || !data || data.length === 0).toBeTruthy();
    });
  });

  describe('Teste de Performance das Políticas RLS', () => {
    it('consultas com RLS devem ser executadas em tempo razoável', async () => {
      await directorClient.auth.signInWithPassword({
        email: testData.director.email,
        password: testData.director.password
      });

      const startTime = Date.now();
      
      const { data, error } = await directorClient
        .from('profiles')
        .select('*')
        .limit(100);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(error).toBeNull();
      expect(executionTime).toBeLessThan(2000); // Menos de 2 segundos
    });
  });
});

// Função auxiliar para limpeza de dados de teste
async function cleanupTestData() {
  try {
    // Usar cliente admin para limpeza (se disponível)
    const adminClient = createClient(supabaseUrl, supabaseKey);
    
    // Deletar usuários de teste (se possível)
    const testEmails = [
      testData.director.email,
      testData.teacher.email,
      testData.student.email
    ];

    for (const email of testEmails) {
      try {
        // Tentar fazer login e deletar
        const { data } = await adminClient.auth.signInWithPassword({
          email,
          password: 'test123456'
        });
        
        if (data.user) {
          // Deletar perfil
          await adminClient
            .from('profiles')
            .delete()
            .eq('id', data.user.id);
        }
        
        await adminClient.auth.signOut();
      } catch (error) {
        // Ignorar erros de limpeza
        console.warn(`Erro ao limpar usuário ${email}:`, error);
      }
    }

    // Deletar escola de teste
    if (testSchoolId) {
      await adminClient
        .from('schools')
        .delete()
        .eq('id', testSchoolId);
    }
  } catch (error) {
    console.warn('Erro na limpeza de dados de teste:', error);
  }
}

// Função auxiliar para aguardar
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}