/**
 * Hook customizado para gerenciar estado assíncrono com cache, retry e validação
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/services/logger'
import { monitoring } from '@/services/monitoring'
import { config } from '@/config/environment'

interface AsyncStateOptions<T> {
  // Função para buscar os dados
  fetcher: () => Promise<T>
  
  // Chave única para cache
  cacheKey?: string
  
  // TTL do cache em milissegundos
  cacheTTL?: number
  
  // Função de validação dos dados
  validator?: (data: T) => boolean
  
  // Número de tentativas em caso de erro
  retryAttempts?: number
  
  // Delay entre tentativas (em ms)
  retryDelay?: number
  
  // Se deve buscar automaticamente na montagem
  fetchOnMount?: boolean
  
  // Dependências para refetch automático
  dependencies?: any[]
  
  // Callback de sucesso
  onSuccess?: (data: T) => void
  
  // Callback de erro
  onError?: (error: Error) => void
  
  // Transformação dos dados antes de armazenar
  transform?: (data: T) => T
}

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  lastFetch: number | null
  refetch: () => Promise<void>
  reset: () => void
  setData: (data: T | null) => void
}

// Cache global simples
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Função para limpar cache expirado
const cleanExpiredCache = () => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key)
    }
  }
}

// Limpar cache a cada 5 minutos
setInterval(cleanExpiredCache, 5 * 60 * 1000)

export function useAsyncState<T>(options: AsyncStateOptions<T>): AsyncState<T> {
  const {
    fetcher,
    cacheKey,
    cacheTTL = config.cache.defaultTTL,
    validator,
    retryAttempts = config.api.retryAttempts,
    retryDelay = config.api.retryDelay,
    fetchOnMount = true,
    dependencies = [],
    onSuccess,
    onError,
    transform
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetch, setLastFetch] = useState<number | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para obter dados do cache
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null
    
    const cached = cache.get(cacheKey)
    if (!cached) return null
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl
    if (isExpired) {
      cache.delete(cacheKey)
      return null
    }
    
    return cached.data
  }, [cacheKey])

  // Função para armazenar dados no cache
  const setCachedData = useCallback((newData: T) => {
    if (!cacheKey) return
    
    cache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      ttl: cacheTTL
    })
    
    // Limitar tamanho do cache
    if (cache.size > config.cache.maxSize) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
  }, [cacheKey, cacheTTL])

  // Função para fazer sleep
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Função principal de fetch com retry
  const fetchData = useCallback(async (attempt: number = 1): Promise<void> => {
    try {
      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // Criar novo AbortController
      abortControllerRef.current = new AbortController()
      
      setLoading(true)
      setError(null)
      
      logger.debug('Iniciando fetch de dados', {
        cacheKey,
        attempt,
        maxAttempts: retryAttempts
      })
      
      // Verificar cache primeiro
      const cachedData = getCachedData()
      if (cachedData && attempt === 1) {
        logger.debug('Dados encontrados no cache', { cacheKey })
        
        const finalData = transform ? transform(cachedData) : cachedData
        
        if (!validator || validator(finalData)) {
          setData(finalData)
          setLastFetch(Date.now())
          setLoading(false)
          onSuccess?.(finalData)
          return
        } else {
          logger.warn('Dados do cache falharam na validação', { cacheKey })
          cache.delete(cacheKey!)
        }
      }
      
      // Buscar dados
      const result = await monitoring.measureAsync(
        `fetch_${cacheKey || 'unknown'}`,
        () => fetcher(),
        { attempt: attempt.toString() }
      )
      
      // Transformar dados se necessário
      const transformedData = transform ? transform(result) : result
      
      // Validar dados
      if (validator && !validator(transformedData)) {
        throw new Error('Dados recebidos falharam na validação')
      }
      
      // Armazenar no cache
      setCachedData(transformedData)
      
      // Atualizar estado
      setData(transformedData)
      setLastFetch(Date.now())
      setError(null)
      
      logger.info('Dados buscados com sucesso', {
        cacheKey,
        attempt,
        dataSize: JSON.stringify(transformedData).length
      })
      
      onSuccess?.(transformedData)
      
    } catch (err) {
      const error = err as Error
      
      // Ignorar erros de abort
      if (error.name === 'AbortError') {
        logger.debug('Fetch cancelado', { cacheKey })
        return
      }
      
      logger.warn('Erro no fetch de dados', {
        cacheKey,
        attempt,
        maxAttempts: retryAttempts,
        error: error.message
      })
      
      // Tentar novamente se ainda há tentativas
      if (attempt < retryAttempts) {
        const delay = retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
        
        logger.info('Tentando novamente após delay', {
          cacheKey,
          nextAttempt: attempt + 1,
          delay
        })
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(attempt + 1)
        }, delay)
        
        return
      }
      
      // Todas as tentativas falharam
      logger.error('Todas as tentativas de fetch falharam', {
        cacheKey,
        totalAttempts: retryAttempts,
        finalError: error.message
      }, error)
      
      setError(error)
      onError?.(error)
      
    } finally {
      setLoading(false)
    }
  }, [fetcher, cacheKey, retryAttempts, retryDelay, validator, transform, onSuccess, onError, getCachedData, setCachedData])

  // Função para refetch manual
  const refetch = useCallback(async () => {
    await fetchData(1)
  }, [fetchData])

  // Função para resetar estado
  const reset = useCallback(() => {
    // Cancelar requisições pendentes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Cancelar retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    
    // Resetar estado
    setData(null)
    setLoading(false)
    setError(null)
    setLastFetch(null)
    
    // Limpar cache se existir
    if (cacheKey) {
      cache.delete(cacheKey)
    }
    
    logger.debug('Estado resetado', { cacheKey })
  }, [cacheKey])

  // Função para definir dados manualmente
  const setDataManually = useCallback((newData: T | null) => {
    setData(newData)
    
    if (newData && cacheKey) {
      setCachedData(newData)
    }
    
    setLastFetch(Date.now())
    setError(null)
  }, [cacheKey, setCachedData])

  // Effect para fetch inicial e dependências
  useEffect(() => {
    if (fetchOnMount) {
      fetchData(1)
    }
    
    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [fetchOnMount, ...dependencies])

  return {
    data,
    loading,
    error,
    lastFetch,
    refetch,
    reset,
    setData: setDataManually
  }
}

// Hook especializado para dados do Supabase
export function useSupabaseQuery<T>({
  queryFn,
  queryKey,
  ...options
}: {
  queryFn: () => Promise<{ data: T | null; error: any }>
  queryKey: string
} & Omit<AsyncStateOptions<T>, 'fetcher' | 'cacheKey'>) {
  return useAsyncState<T>({
    ...options,
    cacheKey: `supabase_${queryKey}`,
    fetcher: async () => {
      const result = await queryFn()
      
      if (result.error) {
        throw new Error(result.error.message || 'Erro na consulta Supabase')
      }
      
      if (result.data === null) {
        throw new Error('Nenhum dado retornado')
      }
      
      return result.data
    }
  })
}