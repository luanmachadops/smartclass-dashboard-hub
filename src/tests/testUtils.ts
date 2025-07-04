import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { SchoolProvider } from '../contexts/SchoolContext';
import { createClient } from '@supabase/supabase-js';

/**
 * Configuração de mock para Supabase
 */
export const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn()
    }))
  }
};

/**
 * Mock do contexto de autenticação
 */
export const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  resetPassword: vi.fn()
};

/**
 * Mock do contexto da escola
 */
export const mockSchoolContext = {
  school: null,
  loading: false,
  updateSchool: vi.fn(),
  refreshSchool: vi.fn()
};

/**
 * Wrapper para testes com todos os providers necessários
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SchoolProvider>
            {children}
            <Toaster />
          </SchoolProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

/**
 * Wrapper simplificado para testes unitários
 */
export function SimpleTestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}

/**
 * Utilitário para renderizar componentes com wrapper
 */
export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
}

/**
 * Utilitário para renderizar componentes simples
 */
export function renderSimple(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: SimpleTestWrapper,
    ...options
  });
}

/**
 * Dados de teste para usuário
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'director'
  },
  app_metadata: {
    school_id: 'test-school-id',
    user_role: 'director'
  }
};

/**
 * Dados de teste para escola
 */
export const mockSchool = {
  id: 'test-school-id',
  name: 'Escola de Música Teste',
  director_name: 'Diretor Teste',
  email: 'escola@teste.com',
  phone: '(11) 99999-9999',
  cnpj: '12.345.678/0001-90',
  cep: '01234-567',
  logradouro: 'Rua Teste',
  numero: '123',
  bairro: 'Bairro Teste',
  cidade: 'São Paulo',
  estado: 'SP',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Dados de teste para aluno
 */
export const mockStudent = {
  id: 'test-student-id',
  school_id: 'test-school-id',
  name: 'Aluno Teste',
  email: 'aluno@teste.com',
  phone: '(11) 88888-8888',
  birth_date: '2000-01-01',
  enrollment_date: new Date().toISOString(),
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Dados de teste para professor
 */
export const mockTeacher = {
  id: 'test-teacher-id',
  school_id: 'test-school-id',
  name: 'Professor Teste',
  email: 'professor@teste.com',
  phone: '(11) 77777-7777',
  specialization: 'Piano',
  hire_date: new Date().toISOString(),
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Utilitários para simular eventos
 */
export const userEvents = {
  /**
   * Simula digitação em um campo
   */
  type: async (element: HTMLElement, text: string) => {
    fireEvent.change(element, { target: { value: text } });
    await waitFor(() => {
      expect(element).toHaveValue(text);
    });
  },

  /**
   * Simula clique em um elemento
   */
  click: async (element: HTMLElement) => {
    fireEvent.click(element);
    await waitFor(() => {
      // Aguarda o clique ser processado
    });
  },

  /**
   * Simula envio de formulário
   */
  submit: async (form: HTMLElement) => {
    fireEvent.submit(form);
    await waitFor(() => {
      // Aguarda o envio ser processado
    });
  },

  /**
   * Simula foco em um elemento
   */
  focus: async (element: HTMLElement) => {
    fireEvent.focus(element);
    await waitFor(() => {
      expect(element).toHaveFocus();
    });
  },

  /**
   * Simula blur em um elemento
   */
  blur: async (element: HTMLElement) => {
    fireEvent.blur(element);
    await waitFor(() => {
      expect(element).not.toHaveFocus();
    });
  }
};

/**
 * Utilitários para aguardar elementos
 */
export const waitForElements = {
  /**
   * Aguarda elemento aparecer
   */
  toAppear: async (text: string | RegExp) => {
    return await waitFor(() => {
      expect(screen.getByText(text)).toBeInTheDocument();
    });
  },

  /**
   * Aguarda elemento desaparecer
   */
  toDisappear: async (text: string | RegExp) => {
    return await waitFor(() => {
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });
  },

  /**
   * Aguarda loading desaparecer
   */
  loadingToFinish: async () => {
    return await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
    });
  },

  /**
   * Aguarda toast aparecer
   */
  toastToAppear: async (message: string | RegExp) => {
    return await waitFor(() => {
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  }
};

/**
 * Utilitários para mocks de API
 */
export const apiMocks = {
  /**
   * Mock de sucesso para login
   */
  mockSuccessfulLogin: () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: mockUser,
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser
        }
      },
      error: null
    });
  },

  /**
   * Mock de erro para login
   */
  mockFailedLogin: (message = 'Invalid credentials') => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message }
    });
  },

  /**
   * Mock de sucesso para cadastro
   */
  mockSuccessfulSignup: () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: mockUser,
        session: null
      },
      error: null
    });
  },

  /**
   * Mock de erro para cadastro
   */
  mockFailedSignup: (message = 'Email already exists') => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message }
    });
  },

  /**
   * Mock de sucesso para busca de dados
   */
  mockSuccessfulQuery: (data: any) => {
    const mockQuery = {
      data,
      error: null
    };
    
    mockSupabase.from().single.mockResolvedValue(mockQuery);
    return mockQuery;
  },

  /**
   * Mock de erro para busca de dados
   */
  mockFailedQuery: (message = 'Query failed') => {
    const mockQuery = {
      data: null,
      error: { message }
    };
    
    mockSupabase.from().single.mockResolvedValue(mockQuery);
    return mockQuery;
  }
};

/**
 * Utilitários para testes de formulários
 */
export const formUtils = {
  /**
   * Preenche um formulário com dados
   */
  fillForm: async (formData: Record<string, string>) => {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i')) ||
                   screen.getByPlaceholderText(new RegExp(fieldName, 'i')) ||
                   screen.getByDisplayValue('');
      
      if (field) {
        await userEvents.type(field, value);
      }
    }
  },

  /**
   * Verifica se um formulário tem erros
   */
  expectFormErrors: (errors: string[]) => {
    errors.forEach(error => {
      expect(screen.getByText(new RegExp(error, 'i'))).toBeInTheDocument();
    });
  },

  /**
   * Verifica se um formulário não tem erros
   */
  expectNoFormErrors: () => {
    const errorElements = screen.queryAllByText(/erro|inválido|obrigatório/i);
    expect(errorElements).toHaveLength(0);
  }
};

/**
 * Utilitários para testes de navegação
 */
export const navigationUtils = {
  /**
   * Verifica se está na rota correta
   */
  expectToBeAt: (path: string) => {
    expect(window.location.pathname).toBe(path);
  },

  /**
   * Simula navegação para uma rota
   */
  navigateTo: (path: string) => {
    window.history.pushState({}, '', path);
  }
};

/**
 * Utilitários para cleanup de testes
 */
export const testCleanup = {
  /**
   * Limpa todos os mocks
   */
  clearAllMocks: () => {
    vi.clearAllMocks();
  },

  /**
   * Reseta o estado dos mocks
   */
  resetMocks: () => {
    vi.resetAllMocks();
  },

  /**
   * Limpa localStorage
   */
  clearStorage: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

/**
 * Setup padrão para testes
 */
export function setupTest() {
  beforeEach(() => {
    testCleanup.clearAllMocks();
    testCleanup.clearStorage();
  });

  afterEach(() => {
    testCleanup.clearAllMocks();
  });
}

/**
 * Matchers customizados para testes
 */
export const customMatchers = {
  /**
   * Verifica se um elemento tem uma classe CSS
   */
  toHaveClass: (element: HTMLElement, className: string) => {
    return element.classList.contains(className);
  },

  /**
   * Verifica se um elemento está visível
   */
  toBeVisible: (element: HTMLElement) => {
    return element.style.display !== 'none' && element.style.visibility !== 'hidden';
  },

  /**
   * Verifica se um elemento está desabilitado
   */
  toBeDisabled: (element: HTMLElement) => {
    return (element as HTMLInputElement).disabled;
  }
};

// Exportar tudo que é necessário para os testes
export {
  render,
  screen,
  fireEvent,
  waitFor,
  vi,
  expect,
  describe,
  it,
  beforeEach,
  afterEach
};