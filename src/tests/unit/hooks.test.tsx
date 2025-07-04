import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useSmartQuery,
  useSmartMutation,
  useSupabaseQuery,
  useSupabaseMutation,
  usePrefetchQuery,
  useInvalidateQueries,
  useCacheMetrics
} from '../../hooks/useSmartQuery';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Mock do config
vi.mock('../../config/environment', () => ({
  config: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-key'
    },
    cache: {
      defaultTTL: 300000,
      maxSize: 100
    }
  }
}));

// Mock do AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true
  })
}));

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useSmartQuery Hook', () => {
  let mockSupabase: any;
  let wrapper: any;

  beforeEach(() => {
    // Setup mock do Supabase
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis()
    };

    (createClient as any).mockReturnValue(mockSupabase);
    wrapper = createWrapper();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve executar query com configuração estática', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

    const queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useSmartQuery({
        queryKey: ['test-static'],
        queryFn,
        cacheType: 'static'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('deve executar query com configuração dinâmica', async () => {
    const mockData = [{ id: 1, name: 'Dynamic Test' }];
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useSmartQuery({
        queryKey: ['test-dynamic'],
        queryFn,
        cacheType: 'dynamic'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('deve executar query com configuração em tempo real', async () => {
    const mockData = [{ id: 1, name: 'Realtime Test' }];
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useSmartQuery({
        queryKey: ['test-realtime'],
        queryFn,
        cacheType: 'realtime'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('deve executar query com configuração crítica', async () => {
    const mockData = [{ id: 1, name: 'Critical Test' }];
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useSmartQuery({
        queryKey: ['test-critical'],
        queryFn,
        cacheType: 'critical'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(queryFn).toHaveBeenCalledOnce();
  });

  it('deve lidar com erros corretamente', async () => {
    const error = new Error('Query failed');
    const queryFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () => useSmartQuery({
        queryKey: ['test-error'],
        queryFn,
        cacheType: 'dynamic'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('deve aplicar configurações customizadas', async () => {
    const mockData = [{ id: 1, name: 'Custom Test' }];
    const queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useSmartQuery({
        queryKey: ['test-custom'],
        queryFn,
        cacheType: 'dynamic',
        enabled: false,
        staleTime: 60000
      }),
      { wrapper }
    );

    // Query não deve executar porque enabled = false
    expect(result.current.isFetching).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });
});

describe('useSmartMutation Hook', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('deve executar mutação com sucesso', async () => {
    const mockData = { id: 1, name: 'Created' };
    const mutationFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useSmartMutation({
        mutationFn,
        invalidateQueries: ['test-data']
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(mutationFn).toHaveBeenCalledWith({ name: 'Test' });
  });

  it('deve lidar com erros de mutação', async () => {
    const error = new Error('Mutation failed');
    const mutationFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(
      () => useSmartMutation({
        mutationFn
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('deve executar callbacks de sucesso e erro', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(
      () => useSmartMutation({
        mutationFn,
        onSuccess,
        onError
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(
      { success: true },
      { name: 'Test' },
      expect.any(Object)
    );
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('useSupabaseQuery Hook', () => {
  let mockSupabase: any;
  let wrapper: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    };

    (createClient as any).mockReturnValue(mockSupabase);
    wrapper = createWrapper();
  });

  it('deve executar query do Supabase corretamente', async () => {
    const mockData = [{ id: 1, name: 'Supabase Test' }];
    mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(
      () => useSupabaseQuery({
        queryKey: ['supabase-test'],
        table: 'test_table',
        select: '*',
        cacheType: 'dynamic'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
  });

  it('deve aplicar filtros corretamente', async () => {
    const mockData = [{ id: 1, name: 'Filtered Test' }];
    mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(
      () => useSupabaseQuery({
        queryKey: ['supabase-filtered'],
        table: 'test_table',
        select: '*',
        filters: [{ column: 'id', operator: 'eq', value: 1 }],
        cacheType: 'dynamic'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
  });

  it('deve lidar com erros do Supabase', async () => {
    const error = { message: 'Supabase error', code: 'PGRST116' };
    mockSupabase.single.mockResolvedValue({ data: null, error });

    const { result } = renderHook(
      () => useSupabaseQuery({
        queryKey: ['supabase-error'],
        table: 'test_table',
        select: '*',
        cacheType: 'dynamic'
      }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(expect.objectContaining({
      message: expect.stringContaining('Supabase error')
    }));
  });
});

describe('useSupabaseMutation Hook', () => {
  let mockSupabase: any;
  let wrapper: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn()
    };

    (createClient as any).mockReturnValue(mockSupabase);
    wrapper = createWrapper();
  });

  it('deve executar insert corretamente', async () => {
    const mockData = { id: 1, name: 'Inserted' };
    mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(
      () => useSupabaseMutation({
        table: 'test_table',
        operation: 'insert'
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate({ name: 'Test Insert' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('test_table');
    expect(mockSupabase.insert).toHaveBeenCalledWith({ name: 'Test Insert' });
    expect(result.current.data).toEqual(mockData);
  });

  it('deve executar update corretamente', async () => {
    const mockData = { id: 1, name: 'Updated' };
    mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(
      () => useSupabaseMutation({
        table: 'test_table',
        operation: 'update'
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate({ 
        data: { name: 'Test Update' },
        filters: [{ column: 'id', operator: 'eq', value: 1 }]
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.update).toHaveBeenCalledWith({ name: 'Test Update' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
  });

  it('deve executar delete corretamente', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(
      () => useSupabaseMutation({
        table: 'test_table',
        operation: 'delete'
      }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate({
        filters: [{ column: 'id', operator: 'eq', value: 1 }]
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
  });
});

describe('usePrefetchQuery Hook', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('deve prefetch query corretamente', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'prefetched' });

    const { result } = renderHook(
      () => usePrefetchQuery(),
      { wrapper }
    );

    await act(async () => {
      result.current.prefetch({
        queryKey: ['prefetch-test'],
        queryFn,
        cacheType: 'dynamic'
      });
    });

    // Verificar se a função foi chamada
    expect(queryFn).toHaveBeenCalled();
  });
});

describe('useInvalidateQueries Hook', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('deve invalidar queries corretamente', () => {
    const { result } = renderHook(
      () => useInvalidateQueries(),
      { wrapper }
    );

    act(() => {
      result.current.invalidate(['test-query']);
    });

    // Não há muito para testar aqui além de verificar que não há erro
    expect(result.current.invalidate).toBeInstanceOf(Function);
  });

  it('deve invalidar todas as queries', () => {
    const { result } = renderHook(
      () => useInvalidateQueries(),
      { wrapper }
    );

    act(() => {
      result.current.invalidateAll();
    });

    expect(result.current.invalidateAll).toBeInstanceOf(Function);
  });
});

describe('useCacheMetrics Hook', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('deve retornar métricas de cache', () => {
    const { result } = renderHook(
      () => useCacheMetrics(),
      { wrapper }
    );

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics).toHaveProperty('hitRate');
    expect(result.current.metrics).toHaveProperty('totalQueries');
    expect(result.current.metrics).toHaveProperty('cacheSize');
    expect(result.current.clearMetrics).toBeInstanceOf(Function);
  });

  it('deve limpar métricas', () => {
    const { result } = renderHook(
      () => useCacheMetrics(),
      { wrapper }
    );

    act(() => {
      result.current.clearMetrics();
    });

    // Verificar se as métricas foram resetadas
    expect(result.current.metrics.totalQueries).toBe(0);
    expect(result.current.metrics.hitRate).toBe(0);
  });
});

// Testes de integração
describe('Hooks Integration', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('deve usar múltiplos hooks juntos', async () => {
    const queryFn = vi.fn().mockResolvedValue({ data: 'test' });
    const mutationFn = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(
      () => {
        const query = useSmartQuery({
          queryKey: ['integration-test'],
          queryFn,
          cacheType: 'dynamic'
        });

        const mutation = useSmartMutation({
          mutationFn,
          invalidateQueries: ['integration-test']
        });

        const prefetch = usePrefetchQuery();
        const invalidate = useInvalidateQueries();
        const metrics = useCacheMetrics();

        return { query, mutation, prefetch, invalidate, metrics };
      },
      { wrapper }
    );

    // Verificar se todos os hooks foram inicializados
    expect(result.current.query).toBeDefined();
    expect(result.current.mutation).toBeDefined();
    expect(result.current.prefetch).toBeDefined();
    expect(result.current.invalidate).toBeDefined();
    expect(result.current.metrics).toBeDefined();

    // Aguardar query carregar
    await waitFor(() => {
      expect(result.current.query.isSuccess).toBe(true);
    });

    // Executar mutação
    await act(async () => {
      result.current.mutation.mutate({ test: 'data' });
    });

    await waitFor(() => {
      expect(result.current.mutation.isSuccess).toBe(true);
    });

    expect(queryFn).toHaveBeenCalled();
    expect(mutationFn).toHaveBeenCalledWith({ test: 'data' });
  });
});