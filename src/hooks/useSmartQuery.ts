import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { logger } from '../services/logger';
import { toast } from './use-toast';

// Tipos para configuração de cache inteligente
interface SmartCacheConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
  background?: boolean;
}

// Configurações padrão para diferentes tipos de dados
const CACHE_CONFIGS = {
  // Dados que mudam raramente (escolas, cursos)
  static: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    retry: 3
  },
  // Dados que mudam moderadamente (perfis, alunos)
  dynamic: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true,
    retry: 2
  },
  // Dados em tempo real (mensagens, presença)
  realtime: {
    staleTime: 0, // Sempre considerar stale
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    retry: 1
  },
  // Dados críticos (autenticação, permissões)
  critical: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    retry: 5,
    retryDelay: 1000
  }
} as const;

// Hook para queries inteligentes
export function useSmartQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  cacheType: keyof typeof CACHE_CONFIGS = 'dynamic',
  options?: Partial<UseQueryOptions<T>>
) {
  const config = CACHE_CONFIGS[cacheType];
  
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        logger.debug(`Executando query: ${key.join('.')}`);
        const result = await queryFn();
        logger.debug(`Query concluída: ${key.join('.')}`);
        return result;
      } catch (error) {
        logger.error(`Erro na query ${key.join('.')}:`, error);
        throw error;
      }
    },
    ...config,
    ...options,
    meta: {
      cacheType,
      ...options?.meta
    }
  });
}

// Hook para mutações inteligentes
export function useSmartMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    invalidateQueries?: string[][];
    optimisticUpdate?: {
      queryKey: string[];
      updateFn: (oldData: any, variables: TVariables) => any;
    };
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
  } & Partial<UseMutationOptions<TData, Error, TVariables>>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        logger.debug('Executando mutação:', variables);
        const result = await mutationFn(variables);
        logger.debug('Mutação concluída com sucesso');
        return result;
      } catch (error) {
        logger.error('Erro na mutação:', error);
        throw error;
      }
    },
    onMutate: async (variables) => {
      // Implementar optimistic update se configurado
      if (options?.optimisticUpdate) {
        const { queryKey, updateFn } = options.optimisticUpdate;
        
        // Cancelar queries em andamento
        await queryClient.cancelQueries({ queryKey });
        
        // Snapshot do valor anterior
        const previousData = queryClient.getQueryData(queryKey);
        
        // Aplicar update otimista
        queryClient.setQueryData(queryKey, (oldData: any) => {
          return updateFn(oldData, variables);
        });
        
        return { previousData, queryKey };
      }
    },
    onError: (error, variables, context) => {
      // Reverter optimistic update em caso de erro
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      
      // Mostrar toast de erro se configurado
      if (options?.showErrorToast !== false) {
        toast({
          title: "Erro",
          description: options?.errorMessage || "Ocorreu um erro. Tente novamente.",
          variant: "destructive"
        });
      }
      
      // Callback customizado
      options?.onError?.(error, variables);
    },
    onSuccess: (data, variables, context) => {
      // Invalidar queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Mostrar toast de sucesso se configurado
      if (options?.showSuccessToast) {
        toast({
          title: "Sucesso",
          description: options?.successMessage || "Operação realizada com sucesso!"
        });
      }
      
      // Callback customizado
      options?.onSuccess?.(data, variables);
    },
    ...options
  });
}

// Hook para queries de Supabase com cache inteligente
export function useSupabaseQuery<T>(
  table: string,
  query: (builder: any) => any,
  dependencies: any[] = [],
  cacheType: keyof typeof CACHE_CONFIGS = 'dynamic'
) {
  const queryKey = [table, ...dependencies];
  
  return useSmartQuery(
    queryKey,
    async () => {
      const { data, error } = await query(supabase.from(table));
      if (error) throw error;
      return data as T;
    },
    cacheType
  );
}

// Hook para mutações de Supabase
export function useSupabaseMutation<T, TVariables>(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  options?: {
    invalidateQueries?: string[];
    showSuccessToast?: boolean;
    successMessage?: string;
  }
) {
  return useSmartMutation<T, TVariables>(
    async (variables) => {
      let query;
      
      switch (operation) {
        case 'insert':
          query = supabase.from(table).insert(variables);
          break;
        case 'update':
          query = supabase.from(table).update(variables);
          break;
        case 'delete':
          query = supabase.from(table).delete().match(variables);
          break;
        default:
          throw new Error(`Operação não suportada: ${operation}`);
      }
      
      const { data, error } = await query.select();
      if (error) throw error;
      return data as T;
    },
    {
      invalidateQueries: options?.invalidateQueries?.map(key => [key]) || [[table]],
      showSuccessToast: options?.showSuccessToast,
      successMessage: options?.successMessage
    }
  );
}

// Hook para prefetch inteligente
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  const prefetchQuery = async <T>(
    key: string[],
    queryFn: () => Promise<T>,
    cacheType: keyof typeof CACHE_CONFIGS = 'dynamic'
  ) => {
    const config = CACHE_CONFIGS[cacheType];
    
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      staleTime: config.staleTime
    });
  };
  
  const prefetchSupabaseQuery = async <T>(
    table: string,
    query: (builder: any) => any,
    dependencies: any[] = [],
    cacheType: keyof typeof CACHE_CONFIGS = 'dynamic'
  ) => {
    const queryKey = [table, ...dependencies];
    
    await prefetchQuery(
      queryKey,
      async () => {
        const { data, error } = await query(supabase.from(table));
        if (error) throw error;
        return data as T;
      },
      cacheType
    );
  };
  
  return {
    prefetchQuery,
    prefetchSupabaseQuery
  };
}

// Hook para invalidação inteligente de cache
export function useCacheInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidateByPattern = (pattern: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        );
      }
    });
  };
  
  const invalidateByTable = (table: string) => {
    queryClient.invalidateQueries({ queryKey: [table] });
  };
  
  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };
  
  const clearCache = () => {
    queryClient.clear();
  };
  
  return {
    invalidateByPattern,
    invalidateByTable,
    invalidateAll,
    clearCache
  };
}

// Hook para métricas de cache
export function useCacheMetrics() {
  const queryClient = useQueryClient();
  
  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      cacheSize: JSON.stringify(cache).length,
      byType: {} as Record<string, number>
    };
    
    // Agrupar por tipo de cache
    queries.forEach(query => {
      const cacheType = query.meta?.cacheType as string || 'unknown';
      stats.byType[cacheType] = (stats.byType[cacheType] || 0) + 1;
    });
    
    return stats;
  };
  
  return { getCacheStats };
}