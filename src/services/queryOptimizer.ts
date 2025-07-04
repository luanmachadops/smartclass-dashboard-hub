import { authLogger } from './logger';
import { appCache } from './cache';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Configurações do otimizador de queries
 */
export interface QueryOptimizerConfig {
  enableCaching: boolean;
  enableBatching: boolean;
  enablePagination: boolean;
  defaultPageSize: number;
  maxBatchSize: number;
  cacheTimeout: number;
  enableQueryAnalysis: boolean;
}

const DEFAULT_CONFIG: QueryOptimizerConfig = {
  enableCaching: true,
  enableBatching: true,
  enablePagination: true,
  defaultPageSize: 50,
  maxBatchSize: 100,
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  enableQueryAnalysis: true
};

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filtros de query
 */
export interface QueryFilters {
  [key: string]: any;
}

/**
 * Estatísticas de query
 */
export interface QueryStats {
  executionTime: number;
  cacheHit: boolean;
  rowsReturned: number;
  queryComplexity: 'simple' | 'medium' | 'complex';
  optimizationApplied: string[];
}

/**
 * Batch de operações
 */
interface BatchOperation {
  id: string;
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  data?: any;
  filters?: QueryFilters;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

/**
 * Otimizador de queries para Supabase
 */
export class QueryOptimizer {
  private config: QueryOptimizerConfig;
  private supabase: SupabaseClient;
  private batchQueue: BatchOperation[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private queryStats = new Map<string, QueryStats[]>();
  
  constructor(supabase: SupabaseClient, config: Partial<QueryOptimizerConfig> = {}) {
    this.supabase = supabase;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Executa uma query otimizada
   */
  async executeQuery<T>(
    table: string,
    options: {
      select?: string;
      filters?: QueryFilters;
      pagination?: PaginationParams;
      cacheKey?: string;
      skipCache?: boolean;
    } = {}
  ): Promise<{ data: T[]; stats: QueryStats }> {
    const startTime = Date.now();
    const queryId = this.generateQueryId(table, options);
    
    try {
      // Verificar cache primeiro
      if (this.config.enableCaching && !options.skipCache && options.cacheKey) {
        const cached = appCache.get<T[]>(options.cacheKey);
        if (cached) {
          const stats: QueryStats = {
            executionTime: Date.now() - startTime,
            cacheHit: true,
            rowsReturned: cached.length,
            queryComplexity: 'simple',
            optimizationApplied: ['cache']
          };
          
          this.recordQueryStats(queryId, stats);
          return { data: cached, stats };
        }
      }
      
      // Construir query otimizada
      let query = this.supabase.from(table);
      const optimizations: string[] = [];
      
      // Aplicar seleção de campos
      if (options.select) {
        query = query.select(options.select);
        optimizations.push('field_selection');
      } else {
        query = query.select('*');
      }
      
      // Aplicar filtros
      if (options.filters) {
        query = this.applyFilters(query, options.filters);
        optimizations.push('filtering');
      }
      
      // Aplicar paginação
      if (this.config.enablePagination && options.pagination) {
        query = this.applyPagination(query, options.pagination);
        optimizations.push('pagination');
      }
      
      // Executar query
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }
      
      const executionTime = Date.now() - startTime;
      const complexity = this.analyzeQueryComplexity(options);
      
      const stats: QueryStats = {
        executionTime,
        cacheHit: false,
        rowsReturned: data?.length || 0,
        queryComplexity: complexity,
        optimizationApplied: optimizations
      };
      
      // Salvar no cache se habilitado
      if (this.config.enableCaching && options.cacheKey && data) {
        appCache.set(options.cacheKey, data, this.config.cacheTimeout);
        optimizations.push('caching');
      }
      
      this.recordQueryStats(queryId, stats);
      
      authLogger.debug('Query executada com sucesso', {
        table,
        executionTime,
        rowsReturned: data?.length || 0,
        optimizations
      });
      
      return { data: data || [], stats };
    } catch (error) {
      authLogger.error('Erro na execução da query', {
        table,
        queryId,
        executionTime: Date.now() - startTime
      }, error as Error);
      
      throw error;
    }
  }
  
  /**
   * Executa query paginada
   */
  async executePaginatedQuery<T>(
    table: string,
    options: {
      select?: string;
      filters?: QueryFilters;
      pagination: PaginationParams;
      cacheKey?: string;
    }
  ): Promise<{ result: PaginatedResult<T>; stats: QueryStats }> {
    const startTime = Date.now();
    const page = options.pagination.page || 1;
    const pageSize = options.pagination.pageSize || this.config.defaultPageSize;
    
    try {
      // Contar total de registros
      let countQuery = this.supabase.from(table).select('*', { count: 'exact', head: true });
      
      if (options.filters) {
        countQuery = this.applyFilters(countQuery, options.filters);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        throw new Error(`Count query error: ${countError.message}`);
      }
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      // Executar query principal
      const { data, stats } = await this.executeQuery<T>(table, {
        ...options,
        pagination: {
          ...options.pagination,
          page,
          pageSize
        }
      });
      
      const result: PaginatedResult<T> = {
        data,
        count: totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      };
      
      const finalStats: QueryStats = {
        ...stats,
        executionTime: Date.now() - startTime,
        optimizationApplied: [...stats.optimizationApplied, 'pagination']
      };
      
      return { result, stats: finalStats };
    } catch (error) {
      authLogger.error('Erro na query paginada', { table, page, pageSize }, error as Error);
      throw error;
    }
  }
  
  /**
   * Executa operação em batch
   */
  async executeBatch<T>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    data?: any,
    filters?: QueryFilters
  ): Promise<T> {
    if (!this.config.enableBatching) {
      return this.executeSingleOperation<T>(table, operation, data, filters);
    }
    
    return new Promise<T>((resolve, reject) => {
      const batchOp: BatchOperation = {
        id: this.generateBatchId(),
        table,
        operation,
        data,
        filters,
        resolve,
        reject
      };
      
      this.batchQueue.push(batchOp);
      
      // Processar batch se atingiu o limite ou iniciar timer
      if (this.batchQueue.length >= this.config.maxBatchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, 100); // 100ms de delay
      }
    });
  }
  
  /**
   * Invalida cache por padrão
   */
  invalidateCache(pattern: string | RegExp): number {
    return appCache.invalidatePattern(pattern);
  }
  
  /**
   * Obtém estatísticas de queries
   */
  getQueryStats(queryId?: string): QueryStats[] | QueryStats | null {
    if (queryId) {
      const stats = this.queryStats.get(queryId);
      return stats ? stats[stats.length - 1] : null;
    }
    
    const allStats: QueryStats[] = [];
    for (const stats of this.queryStats.values()) {
      allStats.push(...stats);
    }
    
    return allStats;
  }
  
  /**
   * Obtém métricas de performance
   */
  getPerformanceMetrics() {
    const allStats = this.getQueryStats() as QueryStats[];
    
    if (allStats.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        cacheHitRate: 0,
        slowQueries: 0,
        optimizationUsage: {}
      };
    }
    
    const totalQueries = allStats.length;
    const totalExecutionTime = allStats.reduce((sum, stat) => sum + stat.executionTime, 0);
    const cacheHits = allStats.filter(stat => stat.cacheHit).length;
    const slowQueries = allStats.filter(stat => stat.executionTime > 1000).length;
    
    const optimizationUsage: { [key: string]: number } = {};
    allStats.forEach(stat => {
      stat.optimizationApplied.forEach(opt => {
        optimizationUsage[opt] = (optimizationUsage[opt] || 0) + 1;
      });
    });
    
    return {
      totalQueries,
      averageExecutionTime: totalExecutionTime / totalQueries,
      cacheHitRate: (cacheHits / totalQueries) * 100,
      slowQueries,
      optimizationUsage
    };
  }
  
  /**
   * Aplica filtros à query
   */
  private applyFilters(query: any, filters: QueryFilters): any {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null) {
        query = query.is(key, null);
      } else if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value.operator) {
        // Filtros avançados: { operator: 'gte', value: 18 }
        switch (value.operator) {
          case 'gte':
            query = query.gte(key, value.value);
            break;
          case 'lte':
            query = query.lte(key, value.value);
            break;
          case 'gt':
            query = query.gt(key, value.value);
            break;
          case 'lt':
            query = query.lt(key, value.value);
            break;
          case 'like':
            query = query.like(key, value.value);
            break;
          case 'ilike':
            query = query.ilike(key, value.value);
            break;
          default:
            query = query.eq(key, value.value);
        }
      } else {
        query = query.eq(key, value);
      }
    }
    
    return query;
  }
  
  /**
   * Aplica paginação à query
   */
  private applyPagination(query: any, pagination: PaginationParams): any {
    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || this.config.defaultPageSize;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
    
    // Aplicar ordenação
    if (pagination.sortBy) {
      const ascending = pagination.sortOrder !== 'desc';
      query = query.order(pagination.sortBy, { ascending });
    }
    
    return query;
  }
  
  /**
   * Analisa complexidade da query
   */
  private analyzeQueryComplexity(options: any): 'simple' | 'medium' | 'complex' {
    let complexity = 0;
    
    // Filtros aumentam complexidade
    if (options.filters) {
      complexity += Object.keys(options.filters).length;
    }
    
    // Paginação adiciona complexidade
    if (options.pagination) {
      complexity += 1;
    }
    
    // Seleção de campos específicos
    if (options.select && options.select !== '*') {
      complexity += 1;
    }
    
    if (complexity <= 2) return 'simple';
    if (complexity <= 5) return 'medium';
    return 'complex';
  }
  
  /**
   * Executa operação única
   */
  private async executeSingleOperation<T>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    data?: any,
    filters?: QueryFilters
  ): Promise<T> {
    let query = this.supabase.from(table);
    
    switch (operation) {
      case 'select':
        query = query.select('*');
        if (filters) {
          query = this.applyFilters(query, filters);
        }
        break;
      case 'insert':
        query = query.insert(data);
        break;
      case 'update':
        query = query.update(data);
        if (filters) {
          query = this.applyFilters(query, filters);
        }
        break;
      case 'delete':
        if (filters) {
          query = this.applyFilters(query, filters);
        }
        query = query.delete();
        break;
    }
    
    const { data: result, error } = await query;
    
    if (error) {
      throw new Error(`${operation} error: ${error.message}`);
    }
    
    return result as T;
  }
  
  /**
   * Processa batch de operações
   */
  private async processBatch(): void {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Agrupar operações por tabela e tipo
    const groupedOps = new Map<string, BatchOperation[]>();
    
    batch.forEach(op => {
      const key = `${op.table}_${op.operation}`;
      if (!groupedOps.has(key)) {
        groupedOps.set(key, []);
      }
      groupedOps.get(key)!.push(op);
    });
    
    // Executar cada grupo
    for (const [key, ops] of groupedOps.entries()) {
      try {
        await this.executeBatchGroup(ops);
      } catch (error) {
        authLogger.error('Erro no processamento de batch', { key }, error as Error);
        ops.forEach(op => op.reject(error as Error));
      }
    }
  }
  
  /**
   * Executa grupo de operações em batch
   */
  private async executeBatchGroup(ops: BatchOperation[]): Promise<void> {
    const firstOp = ops[0];
    
    if (firstOp.operation === 'insert' && ops.length > 1) {
      // Batch insert
      const data = ops.map(op => op.data);
      const { data: result, error } = await this.supabase
        .from(firstOp.table)
        .insert(data);
      
      if (error) {
        throw new Error(`Batch insert error: ${error.message}`);
      }
      
      ops.forEach((op, index) => {
        op.resolve(result?.[index]);
      });
    } else {
      // Executar operações individuais
      for (const op of ops) {
        try {
          const result = await this.executeSingleOperation(
            op.table,
            op.operation,
            op.data,
            op.filters
          );
          op.resolve(result);
        } catch (error) {
          op.reject(error as Error);
        }
      }
    }
  }
  
  /**
   * Gera ID único para query
   */
  private generateQueryId(table: string, options: any): string {
    const hash = JSON.stringify({ table, ...options });
    return `query_${table}_${Date.now()}_${hash.length}`;
  }
  
  /**
   * Gera ID único para batch
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Registra estatísticas da query
   */
  private recordQueryStats(queryId: string, stats: QueryStats): void {
    if (!this.config.enableQueryAnalysis) return;
    
    if (!this.queryStats.has(queryId)) {
      this.queryStats.set(queryId, []);
    }
    
    const queryStatsList = this.queryStats.get(queryId)!;
    queryStatsList.push(stats);
    
    // Manter apenas as últimas 10 execuções por query
    if (queryStatsList.length > 10) {
      queryStatsList.shift();
    }
  }
}

/**
 * Hook para usar o otimizador de queries
 */
export function useQueryOptimizer(supabase: SupabaseClient, config?: Partial<QueryOptimizerConfig>) {
  const optimizer = new QueryOptimizer(supabase, config);
  
  return {
    executeQuery: <T>(table: string, options?: any) => optimizer.executeQuery<T>(table, options),
    executePaginatedQuery: <T>(table: string, options: any) => optimizer.executePaginatedQuery<T>(table, options),
    executeBatch: <T>(table: string, operation: any, data?: any, filters?: any) => 
      optimizer.executeBatch<T>(table, operation, data, filters),
    invalidateCache: (pattern: string | RegExp) => optimizer.invalidateCache(pattern),
    getStats: (queryId?: string) => optimizer.getQueryStats(queryId),
    getMetrics: () => optimizer.getPerformanceMetrics()
  };
}