// Serviço de otimização de banco de dados
import { authLogger } from './logger'
import { monitoring } from './monitoring'
import { supabase } from '../lib/supabase'

// Tipos para otimização
interface QueryMetrics {
  query: string
  duration: number
  timestamp: number
  success: boolean
  rowCount?: number
  error?: string
}

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  key: string
}

interface ConnectionPoolStats {
  active: number
  idle: number
  waiting: number
  total: number
}

interface OptimizationConfig {
  enableQueryCache: boolean
  cacheDefaultTTL: number // em segundos
  slowQueryThreshold: number // em ms
  enableQueryLogging: boolean
  maxCacheSize: number
  enableBatching: boolean
  batchSize: number
  batchTimeout: number // em ms
}

class DatabaseOptimizationService {
  private config: OptimizationConfig
  private queryMetrics: QueryMetrics[] = []
  private cache: Map<string, CacheEntry> = new Map()
  private batchQueue: Map<string, any[]> = new Map()
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private maxMetrics = 1000

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableQueryCache: true,
      cacheDefaultTTL: 300, // 5 minutos
      slowQueryThreshold: 1000, // 1 segundo
      enableQueryLogging: true,
      maxCacheSize: 500,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 100, // 100ms
      ...config
    }

    this.initializeOptimization()
  }

  private initializeOptimization(): void {
    authLogger.info('Inicializando otimização de banco de dados', {
      action: 'initDatabaseOptimization',
      config: this.config
    })

    // Limpar cache periodicamente
    setInterval(() => {
      this.cleanupCache()
    }, 60 * 1000) // A cada minuto

    // Analisar métricas periodicamente
    setInterval(() => {
      this.analyzeQueryPerformance()
    }, 5 * 60 * 1000) // A cada 5 minutos
  }

  // Wrapper para queries com métricas e cache
  async executeQuery<T>(
    queryFn: () => Promise<T>,
    options: {
      cacheKey?: string
      cacheTTL?: number
      description?: string
      enableCache?: boolean
    } = {}
  ): Promise<T> {
    const startTime = performance.now()
    const queryDescription = options.description || 'unknown_query'
    
    // Verificar cache primeiro
    if (options.enableCache !== false && this.config.enableQueryCache && options.cacheKey) {
      const cached = this.getFromCache(options.cacheKey)
      if (cached) {
        authLogger.debug('Query servida do cache', {
          action: 'cacheHit',
          cacheKey: options.cacheKey,
          description: queryDescription
        })
        
        monitoring.recordMetric({
          name: 'database.cache_hit',
          value: 1,
          timestamp: Date.now(),
          tags: { query: queryDescription }
        })
        
        return cached
      }
    }

    let result: T
    let success = true
    let error: string | undefined
    let rowCount: number | undefined

    try {
      result = await queryFn()
      
      // Tentar extrair contagem de linhas se for um resultado do Supabase
      if (result && typeof result === 'object' && 'data' in result) {
        const supabaseResult = result as any
        if (Array.isArray(supabaseResult.data)) {
          rowCount = supabaseResult.data.length
        }
      }
      
      // Armazenar no cache se configurado
      if (options.enableCache !== false && this.config.enableQueryCache && options.cacheKey) {
        this.setCache(
          options.cacheKey,
          result,
          options.cacheTTL || this.config.cacheDefaultTTL
        )
      }
      
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      const duration = performance.now() - startTime
      
      // Registrar métricas
      this.recordQueryMetrics({
        query: queryDescription,
        duration,
        timestamp: Date.now(),
        success,
        rowCount,
        error
      })
      
      // Log para queries lentas
      if (duration > this.config.slowQueryThreshold) {
        authLogger.warn('Query lenta detectada', {
          action: 'slowQuery',
          description: queryDescription,
          duration,
          threshold: this.config.slowQueryThreshold,
          rowCount
        })
      }
    }

    return result!
  }

  // Cache management
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache(key: string, data: any, ttl: number): void {
    // Verificar limite de cache
    if (this.cache.size >= this.config.maxCacheSize) {
      // Remover entrada mais antiga
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    })

    authLogger.debug('Dados armazenados no cache', {
      action: 'cacheSet',
      key,
      ttl,
      cacheSize: this.cache.size
    })
  }

  // Invalidar cache
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      authLogger.info('Cache completamente limpo', {
        action: 'cacheClearAll'
      })
      return
    }

    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
    
    authLogger.info('Cache invalidado por padrão', {
      action: 'cacheInvalidate',
      pattern,
      keysRemoved: keysToDelete.length
    })
  }

  // Limpeza automática do cache
  private cleanupCache(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => this.cache.delete(key))

    if (expiredKeys.length > 0) {
      authLogger.debug('Cache expirado limpo', {
        action: 'cacheCleanup',
        expiredKeys: expiredKeys.length,
        remainingKeys: this.cache.size
      })
    }
  }

  // Batching de queries
  async batchQuery<T>(
    batchKey: string,
    queryData: any,
    executeFn: (batch: any[]) => Promise<T[]>
  ): Promise<T> {
    if (!this.config.enableBatching) {
      // Se batching está desabilitado, executar imediatamente
      const results = await executeFn([queryData])
      return results[0]
    }

    return new Promise((resolve, reject) => {
      // Adicionar à fila de batch
      const queue = this.batchQueue.get(batchKey) || []
      queue.push({ data: queryData, resolve, reject })
      this.batchQueue.set(batchKey, queue)

      // Se atingiu o tamanho do batch, executar imediatamente
      if (queue.length >= this.config.batchSize) {
        this.executeBatch(batchKey, executeFn)
        return
      }

      // Configurar timer se não existe
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.executeBatch(batchKey, executeFn)
        }, this.config.batchTimeout)
        
        this.batchTimers.set(batchKey, timer)
      }
    })
  }

  private async executeBatch<T>(
    batchKey: string,
    executeFn: (batch: any[]) => Promise<T[]>
  ): Promise<void> {
    const queue = this.batchQueue.get(batchKey)
    if (!queue || queue.length === 0) return

    // Limpar timer e fila
    const timer = this.batchTimers.get(batchKey)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(batchKey)
    }
    this.batchQueue.delete(batchKey)

    const startTime = performance.now()
    
    try {
      const batchData = queue.map(item => item.data)
      const results = await executeFn(batchData)
      
      // Resolver todas as promises
      queue.forEach((item, index) => {
        item.resolve(results[index])
      })
      
      const duration = performance.now() - startTime
      
      authLogger.debug('Batch executado com sucesso', {
        action: 'batchExecuted',
        batchKey,
        batchSize: queue.length,
        duration
      })
      
      monitoring.recordMetric({
        name: 'database.batch_executed',
        value: queue.length,
        timestamp: Date.now(),
        tags: { batchKey },
        unit: 'queries'
      })
      
    } catch (error) {
      // Rejeitar todas as promises
      queue.forEach(item => {
        item.reject(error)
      })
      
      authLogger.error('Erro na execução do batch', {
        action: 'batchError',
        batchKey,
        batchSize: queue.length,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Registrar métricas de query
  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics)
    
    // Manter apenas métricas recentes
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics)
    }

    // Registrar no sistema de monitoramento
    monitoring.recordMetric({
      name: 'database.query_duration',
      value: metrics.duration,
      timestamp: metrics.timestamp,
      tags: {
        query: metrics.query,
        success: String(metrics.success)
      },
      unit: 'ms'
    })

    if (metrics.rowCount !== undefined) {
      monitoring.recordMetric({
        name: 'database.rows_returned',
        value: metrics.rowCount,
        timestamp: metrics.timestamp,
        tags: { query: metrics.query },
        unit: 'rows'
      })
    }

    if (this.config.enableQueryLogging) {
      authLogger.debug('Query executada', {
        action: 'queryExecuted',
        query: metrics.query,
        duration: metrics.duration,
        success: metrics.success,
        rowCount: metrics.rowCount
      })
    }
  }

  // Analisar performance das queries
  private analyzeQueryPerformance(): void {
    const recentMetrics = this.queryMetrics.filter(
      m => Date.now() - m.timestamp < 60 * 60 * 1000 // 1 hora
    )

    if (recentMetrics.length === 0) return

    // Agrupar por query
    const queryStats = new Map<string, {
      count: number
      totalDuration: number
      avgDuration: number
      maxDuration: number
      errorCount: number
      successRate: number
    }>()

    recentMetrics.forEach(metric => {
      const stats = queryStats.get(metric.query) || {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        errorCount: 0,
        successRate: 0
      }

      stats.count++
      stats.totalDuration += metric.duration
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration)
      if (!metric.success) stats.errorCount++

      queryStats.set(metric.query, stats)
    })

    // Calcular médias e taxas de sucesso
    queryStats.forEach((stats, query) => {
      stats.avgDuration = stats.totalDuration / stats.count
      stats.successRate = ((stats.count - stats.errorCount) / stats.count) * 100

      // Alertar para queries problemáticas
      if (stats.avgDuration > this.config.slowQueryThreshold) {
        authLogger.warn('Query consistentemente lenta detectada', {
          action: 'slowQueryPattern',
          query,
          avgDuration: stats.avgDuration,
          count: stats.count,
          maxDuration: stats.maxDuration
        })
      }

      if (stats.successRate < 95) {
        authLogger.warn('Query com alta taxa de erro detectada', {
          action: 'highErrorRate',
          query,
          successRate: stats.successRate,
          errorCount: stats.errorCount,
          totalCount: stats.count
        })
      }
    })

    authLogger.info('Análise de performance concluída', {
      action: 'performanceAnalysis',
      totalQueries: recentMetrics.length,
      uniqueQueries: queryStats.size,
      timeWindow: '1h'
    })
  }

  // Obter estatísticas
  getStats(): {
    cache: {
      size: number
      hitRate: number
      maxSize: number
    }
    queries: {
      total: number
      avgDuration: number
      slowQueries: number
      errorRate: number
    }
    batching: {
      activeBatches: number
      enabled: boolean
    }
  } {
    const recentMetrics = this.queryMetrics.filter(
      m => Date.now() - m.timestamp < 60 * 60 * 1000
    )

    const totalQueries = recentMetrics.length
    const avgDuration = totalQueries > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0
    const slowQueries = recentMetrics.filter(m => m.duration > this.config.slowQueryThreshold).length
    const errorCount = recentMetrics.filter(m => !m.success).length
    const errorRate = totalQueries > 0 ? (errorCount / totalQueries) * 100 : 0

    // Calcular hit rate do cache (aproximado)
    const cacheHits = monitoring.getRecentMetrics()
      .filter(m => m.name === 'database.cache_hit')
      .reduce((sum, m) => sum + m.value, 0)
    const hitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0

    return {
      cache: {
        size: this.cache.size,
        hitRate,
        maxSize: this.config.maxCacheSize
      },
      queries: {
        total: totalQueries,
        avgDuration,
        slowQueries,
        errorRate
      },
      batching: {
        activeBatches: this.batchQueue.size,
        enabled: this.config.enableBatching
      }
    }
  }

  // Exportar dados de otimização
  exportOptimizationData(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      config: this.config,
      stats: this.getStats(),
      recentMetrics: this.queryMetrics.slice(-100), // Últimas 100 queries
      cacheKeys: Array.from(this.cache.keys())
    }

    return JSON.stringify(data, null, 2)
  }

  // Métodos de conveniência para queries comuns
  async findById<T>(table: string, id: string, cacheKey?: string): Promise<T | null> {
    return this.executeQuery(
      () => supabase.from(table).select('*').eq('id', id).single(),
      {
        cacheKey: cacheKey || `${table}:${id}`,
        description: `find_${table}_by_id`,
        cacheTTL: 300 // 5 minutos
      }
    )
  }

  async findMany<T>(
    table: string, 
    filters: Record<string, any> = {},
    options: { limit?: number; orderBy?: string; cacheKey?: string } = {}
  ): Promise<T[]> {
    return this.executeQuery(
      () => {
        let query = supabase.from(table).select('*')
        
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
        
        if (options.limit) {
          query = query.limit(options.limit)
        }
        
        if (options.orderBy) {
          query = query.order(options.orderBy)
        }
        
        return query
      },
      {
        cacheKey: options.cacheKey || `${table}:${JSON.stringify(filters)}`,
        description: `find_many_${table}`,
        cacheTTL: 180 // 3 minutos
      }
    )
  }
}

// Instância singleton
export const dbOptimization = new DatabaseOptimizationService()

// Hook para React components
export const useDatabase = () => {
  return {
    executeQuery: dbOptimization.executeQuery.bind(dbOptimization),
    batchQuery: dbOptimization.batchQuery.bind(dbOptimization),
    invalidateCache: dbOptimization.invalidateCache.bind(dbOptimization),
    findById: dbOptimization.findById.bind(dbOptimization),
    findMany: dbOptimization.findMany.bind(dbOptimization),
    getStats: dbOptimization.getStats.bind(dbOptimization)
  }
}

export default dbOptimization