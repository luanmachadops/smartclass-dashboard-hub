import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { authLogger } from '../services/logger';
import { monitoring } from '../services/monitoring';

// Configuração global para testes
beforeAll(() => {
  // Configuração do MSW (será implementado quando o servidor de mocks estiver pronto)
  // server.listen({ onUnhandledRequest: 'error' });
  
  // Mock de APIs do navegador
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock do ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock do IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock do localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock do sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Mock do fetch
  global.fetch = vi.fn();

  // Mock do console para testes mais limpos
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Suprimir erros conhecidos do React Testing Library
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  // Mock de APIs de geolocalização
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });

  // Mock de APIs de notificação
  Object.defineProperty(window, 'Notification', {
    value: vi.fn().mockImplementation(() => ({
      close: vi.fn(),
    })),
    writable: true,
  });

  // Mock de APIs de clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
  });

  // Mock de APIs de file
  global.File = vi.fn().mockImplementation((chunks, filename, options) => {
    return {
      name: filename,
      size: chunks.reduce((acc: number, chunk: any) => acc + chunk.length, 0),
      type: options?.type || '',
      lastModified: Date.now(),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      text: vi.fn().mockResolvedValue(''),
      stream: vi.fn(),
      slice: vi.fn(),
    };
  });

  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    abort: vi.fn(),
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
    readyState: 0,
  }));

  // Mock de APIs de URL
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock de APIs de crypto
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: vi.fn().mockReturnValue('mock-uuid'),
      getRandomValues: vi.fn().mockImplementation((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        sign: vi.fn(),
        verify: vi.fn(),
        generateKey: vi.fn(),
        importKey: vi.fn(),
        exportKey: vi.fn(),
      },
    },
    writable: true,
  });

  // Mock de APIs de performance
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn().mockReturnValue(Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([]),
      getEntriesByType: vi.fn().mockReturnValue([]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    },
    writable: true,
  });
});

// Limpeza após cada teste
afterEach(() => {
  // Limpar DOM
  cleanup();
  
  // Resetar todos os mocks
  vi.clearAllMocks();
  
  // Limpar localStorage e sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpar dados de monitoramento
  monitoring.cleanup();
  
  // Resetar handlers do MSW (será implementado quando o servidor de mocks estiver pronto)
  // server.resetHandlers();
});

// Utilitários para testes
export const testUtils = {
  // Simular usuário logado
  mockLoggedUser: (userData = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    tipo: 'professor'
  }) => {
    vi.mocked(localStorage.getItem).mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify(userData)
      }
      return null
    })
  },
  
  // Simular resposta da API
  mockApiResponse: (data: any, status = 200) => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers(),
      redirected: false,
      statusText: 'OK',
      type: 'basic',
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      blob: async () => new Blob(),
      formData: async () => new FormData()
    } as Response)
  },
  
  // Simular erro da API
  mockApiError: (error: string, status = 500) => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error(error))
  },
  
  // Aguardar próximo tick
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Aguardar tempo específico
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Simular evento do DOM
  fireEvent: (element: Element, eventType: string, eventInit?: EventInit) => {
    const event = new Event(eventType, eventInit)
    element.dispatchEvent(event)
  },
  
  // Criar elemento de teste
  createElement: (tag: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    return element
  },
  
  // Verificar se elemento está visível
  isVisible: (element: Element) => {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
  },
  
  // Simular input do usuário
  simulateInput: (element: HTMLInputElement, value: string) => {
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
  },
  
  // Simular clique
  simulateClick: (element: Element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  },
  
  // Dados de teste comuns
  testData: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      tipo: 'professor' as const
    },
    school: {
      id: 'test-school-id',
      nome: 'Escola Teste',
      endereco: 'Rua Teste, 123',
      telefone: '(11) 99999-9999'
    },
    course: {
      id: 'test-course-id',
      nome: 'Curso Teste',
      descricao: 'Descrição do curso teste',
      escola_id: 'test-school-id'
    },
    turma: {
      id: 'test-turma-id',
      nome: 'Turma Teste',
      curso_id: 'test-course-id',
      professor_id: 'test-user-id'
    }
  }
}

// Configurações globais para testes
export const testConfig = {
  timeout: 5000,
  retries: 3,
  apiBaseUrl: 'http://localhost:3000/api',
  testDatabase: 'test_smartclass'
}

// Mock do Supabase para testes
export const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn()
  }))
}

// Limpeza após todos os testes
afterAll(() => {
  // Parar MSW server (será implementado quando o servidor de mocks estiver pronto)
  // server.close();
  
  // Restaurar mocks
  vi.restoreAllMocks();
});

// Configurações globais para testes

// Aumentar timeout para testes assíncronos
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Configurar timezone para testes consistentes
process.env.TZ = 'UTC';

// Configurar locale para testes consistentes
if (typeof Intl !== 'undefined') {
  Intl.DateTimeFormat = vi.fn().mockImplementation(() => ({
    format: vi.fn().mockReturnValue('01/01/2024'),
    formatToParts: vi.fn().mockReturnValue([]),
    resolvedOptions: vi.fn().mockReturnValue({}),
  }));
}

// Funções auxiliares para testes
export const createTestUser = (overrides = {}) => {
  return {
    id: 'test-user-1',
    email: 'teste@exemplo.com',
    full_name: 'Usuário Teste',
    role: 'student',
    ...overrides
  };
};

export const createTestSchool = (overrides = {}) => {
  return {
    id: 'test-school-1',
    name: 'Escola Teste',
    director_id: 'test-director-1',
    ...overrides
  };
};

export const createTestMetrics = (overrides = {}) => {
  return {
    totalUsers: 100,
    totalSchools: 5,
    activeSessions: 25,
    ...overrides
  };
};

export const createTestHealthCheck = (overrides = {}) => {
  return {
    database: { status: 'healthy', responseTime: 50 },
    auth: { status: 'healthy', responseTime: 30 },
    storage: { status: 'healthy', responseTime: 40 },
    realtime: { status: 'healthy', responseTime: 60 },
    ...overrides
  };
};

// Utilitários para testes assíncronos
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock de funções comuns
// Mock de Supabase client será implementado quando necessário

// Configuração de console para desenvolvimento
if (process.env.NODE_ENV === 'test') {
  // Suprimir logs desnecessários durante os testes
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    if (process.env.VITEST_VERBOSE) {
      originalLog(...args);
    }
  };
}

// Configuração de error boundaries para testes
const originalError = console.error;
console.error = (...args: any[]) => {
  // Suprimir erros conhecidos do React durante os testes
  const message = args[0];
  if (
    typeof message === 'string' &&
    (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: React.createFactory() is deprecated') ||
      message.includes('Warning: componentWillReceiveProps has been renamed')
    )
  ) {
    return;
  }
  originalError(...args);
};