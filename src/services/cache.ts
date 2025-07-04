import { authLogger } from './logger';

/**
 * Configurações de cache
 */
export interface CacheConfig {
  defaultTTL: number; // Time to live em ms
  maxSize: number; // Número máximo de entradas
  cleanupInterval: number; // Intervalo de limpeza em ms
  enablePersistence: boolean; // Salvar no localStorage
  compressionThreshold: number; // Tamanho mínimo para compressão
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 minuto
  enablePersistence: true,
  compressionThreshold: 1024 // 1KB
};

/**
 * Item do cache
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  size: number;
  compressed: boolean;
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalItems: number;
  totalSize: number;
  oldestItem: number;
  newestItem: number;
}

/**
 * Estratégias de eviction
 */
export type EvictionStrategy = 'lru' | 'lfu' | 'ttl' | 'size';

/**
 * Cache inteligente com múltiplas estratégias
 */
export class SmartCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private evictionStrategy: EvictionStrategy = 'lru';
  
  constructor(config: Partial<CacheConfig> = {}, strategy: EvictionStrategy = 'lru') {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.evictionStrategy = strategy;
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalItems: 0,
      totalSize: 0,
      oldestItem: 0,
      newestItem: 0
    };
    
    this.startCleanup();
    this.loadFromPersistence();
  }
  
  /**
   * Armazena um item no cache
   */
  set(key: string, data: T, ttl?: number): void {
    try {
      const now = Date.now();
      const itemTTL = ttl || this.config.defaultTTL;
      const serialized = JSON.stringify(data);
      const size = new Blob([serialized]).size;
      
      // Comprimir se necessário
      const compressed = size > this.config.compressionThreshold;
      const finalData = compressed ? this.compress(data) : data;
      
      const item: CacheItem<T> = {
        data: finalData,
        timestamp: now,
        ttl: itemTTL,
        accessCount: 0,
        lastAccess: now,
        size,
        compressed
      };
      
      // Verificar se precisa fazer eviction
      if (this.cache.size >= this.config.maxSize) {
        this.evict();
      }
      
      this.cache.set(key, item);
      this.updateStats();
      
      if (this.config.enablePersistence) {
        this.saveToPersistence(key, item);
      }
      
      authLogger.debug('Item adicionado ao cache', {
        key,
        size,
        ttl: itemTTL,
        compressed,
        totalItems: this.cache.size
      });
    } catch (error) {
      authLogger.error('Erro ao adicionar item ao cache', { key }, error as Error);
    }
  }
  
  /**
   * Recupera um item do cache
   */
  get(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
      
      // Verificar se expirou
      if (this.isExpired(item)) {
        this.cache.delete(key);
        this.removeFromPersistence(key);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
      
      // Atualizar estatísticas de acesso
      item.accessCount++;
      item.lastAccess = Date.now();
      this.stats.hits++;
      this.updateHitRate();
      
      // Descomprimir se necessário
      const data = item.compressed ? this.decompress(item.data) : item.data;
      
      authLogger.debug('Item recuperado do cache', {
        key,
        accessCount: item.accessCount,
        age: Date.now() - item.timestamp
      });
      
      return data;
    } catch (error) {
      authLogger.error('Erro ao recuperar item do cache', { key }, error as Error);
      return null;
    }
  }
  
  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromPersistence(key);
      this.updateStats();
    }
    return deleted;
  }
  
  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.clearPersistence();
    this.updateStats();
    authLogger.info('Cache limpo completamente');
  }
  
  /**
   * Verifica se uma chave existe no cache
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.removeFromPersistence(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Obtém todas as chaves do cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Obtém o tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Invalida itens baseado em padrão
   */
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }
    
    authLogger.info('Itens invalidados por padrão', { pattern: pattern.toString(), count });
    return count;
  }
  
  /**
   * Pré-aquece o cache com dados
   */
  async warmup(loader: (key: string) => Promise<T>, keys: string[]): Promise<void> {
    authLogger.info('Iniciando pré-aquecimento do cache', { keys: keys.length });
    
    const promises = keys.map(async (key) => {
      try {
        if (!this.has(key)) {
          const data = await loader(key);
          this.set(key, data);
        }
      } catch (error) {
        authLogger.warn('Erro no pré-aquecimento', { key }, error as Error);
      }
    });
    
    await Promise.allSettled(promises);
    authLogger.info('Pré-aquecimento concluído');
  }
  
  /**
   * Verifica se um item expirou
   */
  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }
  
  /**
   * Executa eviction baseado na estratégia
   */
  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string | null = null;
    
    switch (this.evictionStrategy) {
      case 'lru':
        keyToEvict = this.findLRU();
        break;
      case 'lfu':
        keyToEvict = this.findLFU();
        break;
      case 'ttl':
        keyToEvict = this.findExpiredOrOldest();
        break;
      case 'size':
        keyToEvict = this.findLargest();
        break;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      authLogger.debug('Item removido por eviction', {
        key: keyToEvict,
        strategy: this.evictionStrategy
      });
    }
  }
  
  /**
   * Encontra o item menos recentemente usado
   */
  private findLRU(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccess < oldestTime) {
        oldestTime = item.lastAccess;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  /**
   * Encontra o item menos frequentemente usado
   */
  private findLFU(): string | null {
    let leastUsedKey: string | null = null;
    let leastCount = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastCount) {
        leastCount = item.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }
  
  /**
   * Encontra item expirado ou mais antigo
   */
  private findExpiredOrOldest(): string | null {
    // Primeiro, procurar itens expirados
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        return key;
      }
    }
    
    // Se não há expirados, pegar o mais antigo
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  /**
   * Encontra o maior item
   */
  private findLargest(): string | null {
    let largestKey: string | null = null;
    let largestSize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.size > largestSize) {
        largestSize = item.size;
        largestKey = key;
      }
    }
    
    return largestKey;
  }
  
  /**
   * Comprime dados (simulação - em produção usar biblioteca real)
   */
  private compress(data: T): T {
    // Em produção, usar biblioteca como pako ou lz-string
    return data;
  }
  
  /**
   * Descomprime dados
   */
  private decompress(data: T): T {
    // Em produção, usar biblioteca como pako ou lz-string
    return data;
  }
  
  /**
   * Inicia limpeza automática
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
  
  /**
   * Para limpeza automática
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  /**
   * Limpa itens expirados
   */
  private cleanup(): void {
    let removedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        this.removeFromPersistence(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.updateStats();
      authLogger.debug('Limpeza automática executada', { removedCount });
    }
  }
  
  /**
   * Atualiza estatísticas
   */
  private updateStats(): void {
    this.stats.totalItems = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
    
    const timestamps = Array.from(this.cache.values()).map(item => item.timestamp);
    this.stats.oldestItem = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    this.stats.newestItem = timestamps.length > 0 ? Math.max(...timestamps) : 0;
  }
  
  /**
   * Atualiza taxa de acerto
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
  
  /**
   * Salva no localStorage
   */
  private saveToPersistence(key: string, item: CacheItem<T>): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const cacheKey = `cache_${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      authLogger.warn('Erro ao salvar no localStorage', { key }, error as Error);
    }
  }
  
  /**
   * Remove do localStorage
   */
  private removeFromPersistence(key: string): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const cacheKey = `cache_${key}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      authLogger.warn('Erro ao remover do localStorage', { key }, error as Error);
    }
  }
  
  /**
   * Carrega do localStorage
   */
  private loadFromPersistence(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          const cacheKey = key.substring(6);
          const itemData = localStorage.getItem(key);
          
          if (itemData) {
            const item: CacheItem<T> = JSON.parse(itemData);
            
            // Verificar se não expirou
            if (!this.isExpired(item)) {
              this.cache.set(cacheKey, item);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      this.updateStats();
      authLogger.info('Cache carregado do localStorage', {
        items: this.cache.size
      });
    } catch (error) {
      authLogger.error('Erro ao carregar cache do localStorage', {}, error as Error);
    }
  }
  
  /**
   * Limpa localStorage
   */
  private clearPersistence(): void {
    if (!this.config.enablePersistence) return;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      authLogger.error('Erro ao limpar cache do localStorage', {}, error as Error);
    }
  }
}

/**
 * Cache global da aplicação
 */
export const appCache = new SmartCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutos
  maxSize: 500,
  enablePersistence: true
}, 'lru');

/**
 * Cache para dados de usuário
 */
export const userCache = new SmartCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 100,
  enablePersistence: false
}, 'lfu');

/**
 * Cache para dados estáticos
 */
export const staticCache = new SmartCache({
  defaultTTL: 60 * 60 * 1000, // 1 hora
  maxSize: 200,
  enablePersistence: true
}, 'ttl');

/**
 * Hook para usar cache
 */
export function useCache<T>(cacheInstance: SmartCache<T> = appCache) {
  return {
    get: (key: string) => cacheInstance.get(key),
    set: (key: string, data: T, ttl?: number) => cacheInstance.set(key, data, ttl),
    delete: (key: string) => cacheInstance.delete(key),
    clear: () => cacheInstance.clear(),
    has: (key: string) => cacheInstance.has(key),
    invalidatePattern: (pattern: string | RegExp) => cacheInstance.invalidatePattern(pattern),
    getStats: () => cacheInstance.getStats(),
    warmup: (loader: (key: string) => Promise<T>, keys: string[]) => cacheInstance.warmup(loader, keys)
  };
}