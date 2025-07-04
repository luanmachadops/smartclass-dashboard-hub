import { logger } from './logger';
import { performanceMonitor } from './performanceMonitor';

// Tipos para cache
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CacheConfig {
  maxSize: number; // em bytes
  maxEntries: number;
  defaultTTL: number; // em ms
  cleanupInterval: number; // em ms
  enableCompression: boolean;
  enableEncryption: boolean;
  persistToDisk: boolean;
  enableMetrics: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  compressionRatio: number;
  averageAccessTime: number;
  memoryUsage: number;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  encrypt?: boolean;
  priority?: CachePriority;
  metadata?: Record<string, any>;
}

export enum CachePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum CacheStrategy {
  LRU = 'LRU', // Least Recently Used
  LFU = 'LFU', // Least Frequently Used
  FIFO = 'FIFO', // First In First Out
  TTL = 'TTL' // Time To Live
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  private accessTimes: number[] = [];
  private compressionWorker?: Worker;

  private constructor() {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 10000,
      defaultTTL: 30 * 60 * 1000, // 30 minutos
      cleanupInterval: 5 * 60 * 1000, // 5 minutos
      enableCompression: true,
      enableEncryption: false,
      persistToDisk: true,
      enableMetrics: true
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      compressionRatio: 1,
      averageAccessTime: 0,
      memoryUsage: 0
    };

    this.startCleanupTimer();
    this.loadFromDisk();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Definir valor no cache
  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Calcular TTL
      const ttl = options.ttl || this.config.defaultTTL;
      const expiresAt = Date.now() + ttl;
      
      // Serializar valor
      let serializedValue = JSON.stringify(value);
      let originalSize = new Blob([serializedValue]).size;
      let finalSize = originalSize;
      
      // Comprimir se habilitado
      if (options.compress !== false && this.config.enableCompression) {
        serializedValue = await this.compressData(serializedValue);
        finalSize = new Blob([serializedValue]).size;
      }
      
      // Criptografar se habilitado
      if (options.encrypt && this.config.enableEncryption) {
        serializedValue = await this.encryptData(serializedValue);
      }
      
      // Verificar limites antes de adicionar
      await this.ensureCapacity(finalSize);
      
      // Criar entrada do cache
      const entry: CacheEntry<string> = {
        key,
        value: serializedValue,
        expiresAt,
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size: finalSize,
        tags: options.tags || [],
        metadata: {
          ...options.metadata,
          originalSize,
          compressed: options.compress !== false && this.config.enableCompression,
          encrypted: options.encrypt && this.config.enableEncryption,
          priority: options.priority || CachePriority.NORMAL
        }
      };
      
      // Remover entrada existente se houver
      if (this.cache.has(key)) {
        const oldEntry = this.cache.get(key)!;
        this.stats.totalSize -= oldEntry.size;
      } else {
        this.stats.totalEntries++;
      }
      
      // Adicionar nova entrada
      this.cache.set(key, entry);
      this.stats.totalSize += finalSize;
      
      // Atualizar estatísticas de compressão
      if (originalSize > 0) {
        this.stats.compressionRatio = (this.stats.compressionRatio + (finalSize / originalSize)) / 2;
      }
      
      // Persistir se habilitado
      if (this.config.persistToDisk) {
        await this.persistEntry(key, entry);
      }
      
      const duration = performance.now() - startTime;
      this.updateAccessTime(duration);
      
      if (this.config.enableMetrics) {
        performanceMonitor.recordMetric('cache_set_duration', duration);
        performanceMonitor.recordMetric('cache_size', this.stats.totalSize);
      }
      
      logger.debug('Cache entry set', 'CacheService', {
        key,
        size: finalSize,
        ttl,
        compressed: entry.metadata.compressed,
        duration
      });
      
    } catch (error) {
      logger.error('Failed to set cache entry', 'CacheService', { key, error });
      throw error;
    }
  }

  // Obter valor do cache
  async get<T>(key: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.missCount++;
        this.updateHitRate();
        return null;
      }
      
      // Verificar expiração
      if (entry.expiresAt < Date.now()) {
        this.cache.delete(key);
        this.stats.totalEntries--;
        this.stats.totalSize -= entry.size;
        this.stats.missCount++;
        this.updateHitRate();
        return null;
      }
      
      // Atualizar estatísticas de acesso
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.stats.hitCount++;
      this.updateHitRate();
      
      // Deserializar valor
      let value = entry.value;
      
      // Descriptografar se necessário
      if (entry.metadata.encrypted) {
        value = await this.decryptData(value);
      }
      
      // Descomprimir se necessário
      if (entry.metadata.compressed) {
        value = await this.decompressData(value);
      }
      
      const deserializedValue = JSON.parse(value);
      
      const duration = performance.now() - startTime;
      this.updateAccessTime(duration);
      
      if (this.config.enableMetrics) {
        performanceMonitor.recordMetric('cache_get_duration', duration);
        performanceMonitor.recordMetric('cache_hit_rate', this.stats.hitRate);
      }
      
      logger.debug('Cache entry retrieved', 'CacheService', {
        key,
        hit: true,
        accessCount: entry.accessCount,
        duration
      });
      
      return deserializedValue;
      
    } catch (error) {
      logger.error('Failed to get cache entry', 'CacheService', { key, error });
      this.stats.missCount++;
      this.updateHitRate();
      return null;
    }
  }

  // Verificar se chave existe no cache
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Verificar expiração
    if (entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  // Deletar entrada do cache
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    this.cache.delete(key);
    this.stats.totalEntries--;
    this.stats.totalSize -= entry.size;
    
    // Remover do disco se persistido
    if (this.config.persistToDisk) {
      this.removePersistentEntry(key);
    }
    
    logger.debug('Cache entry deleted', 'CacheService', { key });
    return true;
  }

  // Limpar cache por tags
  clearByTags(tags: string[]): number {
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.delete(key);
        deletedCount++;
      }
    }
    
    logger.info('Cache cleared by tags', 'CacheService', { tags, deletedCount });
    return deletedCount;
  }

  // Limpar cache por padrão de chave
  clearByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        deletedCount++;
      }
    }
    
    logger.info('Cache cleared by pattern', 'CacheService', { pattern: pattern.source, deletedCount });
    return deletedCount;
  }

  // Limpar todo o cache
  clear(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    
    this.stats.totalEntries = 0;
    this.stats.totalSize = 0;
    this.stats.evictionCount += entriesCount;
    
    // Limpar persistência
    if (this.config.persistToDisk) {
      this.clearPersistentCache();
    }
    
    logger.info('Cache cleared completely', 'CacheService', { entriesCount });
  }

  // Garantir capacidade do cache
  private async ensureCapacity(newEntrySize: number): Promise<void> {
    // Verificar limite de tamanho
    while (this.stats.totalSize + newEntrySize > this.config.maxSize) {
      await this.evictEntry(CacheStrategy.LRU);
    }
    
    // Verificar limite de entradas
    while (this.cache.size >= this.config.maxEntries) {
      await this.evictEntry(CacheStrategy.LRU);
    }
  }

  // Remover entrada do cache (estratégias de eviction)
  private async evictEntry(strategy: CacheStrategy): Promise<void> {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string | null = null;
    
    switch (strategy) {
      case CacheStrategy.LRU:
        keyToEvict = this.findLRUKey();
        break;
      case CacheStrategy.LFU:
        keyToEvict = this.findLFUKey();
        break;
      case CacheStrategy.FIFO:
        keyToEvict = this.findFIFOKey();
        break;
      case CacheStrategy.TTL:
        keyToEvict = this.findExpiredKey();
        break;
    }
    
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictionCount++;
      
      logger.debug('Cache entry evicted', 'CacheService', {
        key: keyToEvict,
        strategy
      });
    }
  }

  // Encontrar chave menos recentemente usada
  private findLRUKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  // Encontrar chave menos frequentemente usada
  private findLFUKey(): string | null {
    let leastUsedKey: string | null = null;
    let leastCount = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  // Encontrar primeira chave inserida
  private findFIFOKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  // Encontrar chave expirada
  private findExpiredKey(): string | null {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        return key;
      }
    }
    
    return null;
  }

  // Comprimir dados
  private async compressData(data: string): Promise<string> {
    try {
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
    } catch (error) {
      logger.warn('Compression failed, using uncompressed data', 'CacheService', { error });
    }
    
    return data;
  }

  // Descomprimir dados
  private async decompressData(data: string): Promise<string> {
    try {
      if (typeof DecompressionStream !== 'undefined') {
        const compressed = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
      }
    } catch (error) {
      logger.warn('Decompression failed, returning original data', 'CacheService', { error });
    }
    
    return data;
  }

  // Criptografar dados
  private async encryptData(data: string): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);
        
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          encodedData
        );
        
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        return btoa(String.fromCharCode(...combined));
      }
    } catch (error) {
      logger.warn('Encryption failed, using unencrypted data', 'CacheService', { error });
    }
    
    return data;
  }

  // Descriptografar dados
  private async decryptData(data: string): Promise<string> {
    // Implementação simplificada
    logger.warn('Decryption not fully implemented', 'CacheService');
    return data;
  }

  // Persistir entrada no disco
  private async persistEntry(key: string, entry: CacheEntry): Promise<void> {
    try {
      const persistentData = {
        key: entry.key,
        value: entry.value,
        expiresAt: entry.expiresAt,
        createdAt: entry.createdAt,
        metadata: entry.metadata
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(persistentData));
    } catch (error) {
      logger.warn('Failed to persist cache entry', 'CacheService', { key, error });
    }
  }

  // Remover entrada persistente
  private removePersistentEntry(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      logger.warn('Failed to remove persistent cache entry', 'CacheService', { key, error });
    }
  }

  // Limpar cache persistente
  private clearPersistentCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.warn('Failed to clear persistent cache', 'CacheService', { error });
    }
  }

  // Carregar cache do disco
  private async loadFromDisk(): Promise<void> {
    if (!this.config.persistToDisk) return;
    
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      let loadedCount = 0;
      
      for (const storageKey of keys) {
        try {
          const data = localStorage.getItem(storageKey);
          if (!data) continue;
          
          const persistentData = JSON.parse(data);
          const key = storageKey.replace('cache_', '');
          
          // Verificar se não expirou
          if (persistentData.expiresAt < Date.now()) {
            localStorage.removeItem(storageKey);
            continue;
          }
          
          // Recriar entrada do cache
          const entry: CacheEntry = {
            key: persistentData.key,
            value: persistentData.value,
            expiresAt: persistentData.expiresAt,
            createdAt: persistentData.createdAt,
            accessCount: 0,
            lastAccessed: Date.now(),
            size: new Blob([persistentData.value]).size,
            tags: persistentData.metadata?.tags || [],
            metadata: persistentData.metadata || {}
          };
          
          this.cache.set(key, entry);
          this.stats.totalEntries++;
          this.stats.totalSize += entry.size;
          loadedCount++;
          
        } catch (error) {
          logger.warn('Failed to load cache entry from disk', 'CacheService', { storageKey, error });
          localStorage.removeItem(storageKey);
        }
      }
      
      if (loadedCount > 0) {
        logger.info('Cache loaded from disk', 'CacheService', { loadedCount });
      }
      
    } catch (error) {
      logger.error('Failed to load cache from disk', 'CacheService', { error });
    }
  }

  // Limpeza automática
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Executar limpeza
  private cleanup(): void {
    const startTime = performance.now();
    let cleanedCount = 0;
    const now = Date.now();
    
    // Remover entradas expiradas
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.delete(key);
        cleanedCount++;
      }
    }
    
    // Verificar limites e fazer eviction se necessário
    while (this.stats.totalSize > this.config.maxSize * 0.9) {
      this.evictEntry(CacheStrategy.LRU);
      cleanedCount++;
    }
    
    const duration = performance.now() - startTime;
    
    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', 'CacheService', {
        cleanedCount,
        duration,
        remainingEntries: this.cache.size
      });
    }
  }

  // Atualizar taxa de acerto
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? (this.stats.hitCount / total) * 100 : 0;
  }

  // Atualizar tempo médio de acesso
  private updateAccessTime(duration: number): void {
    this.accessTimes.push(duration);
    
    // Manter apenas os últimos 1000 tempos
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-1000);
    }
    
    this.stats.averageAccessTime = this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length;
  }

  // Obter estatísticas
  getStats(): CacheStats {
    // Atualizar uso de memória
    if (typeof performance !== 'undefined' && performance.memory) {
      this.stats.memoryUsage = performance.memory.usedJSHeapSize;
    }
    
    return { ...this.stats };
  }

  // Obter informações detalhadas
  getInfo(): {
    config: CacheConfig;
    stats: CacheStats;
    entries: Array<{
      key: string;
      size: number;
      accessCount: number;
      lastAccessed: string;
      expiresAt: string;
      tags: string[];
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: entry.size,
      accessCount: entry.accessCount,
      lastAccessed: new Date(entry.lastAccessed).toISOString(),
      expiresAt: new Date(entry.expiresAt).toISOString(),
      tags: entry.tags
    }));
    
    return {
      config: { ...this.config },
      stats: this.getStats(),
      entries
    };
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar timer de limpeza se necessário
    if (newConfig.cleanupInterval !== undefined) {
      this.startCleanupTimer();
    }
    
    logger.info('Cache config updated', 'CacheService', { newConfig });
  }

  // Pré-aquecer cache
  async warmup(entries: Array<{ key: string; value: any; options?: CacheOptions }>): Promise<void> {
    logger.info('Starting cache warmup', 'CacheService', { entriesCount: entries.length });
    
    const promises = entries.map(({ key, value, options }) => 
      this.set(key, value, options).catch(error => 
        logger.warn('Failed to warmup cache entry', 'CacheService', { key, error })
      )
    );
    
    await Promise.allSettled(promises);
    
    logger.info('Cache warmup completed', 'CacheService', {
      totalEntries: this.cache.size,
      totalSize: this.stats.totalSize
    });
  }

  // Exportar cache
  export(): Record<string, any> {
    const exported: Record<string, any> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      exported[key] = {
        value: entry.value,
        expiresAt: entry.expiresAt,
        metadata: entry.metadata
      };
    }
    
    return exported;
  }

  // Importar cache
  async import(data: Record<string, any>): Promise<void> {
    logger.info('Starting cache import', 'CacheService', { entriesCount: Object.keys(data).length });
    
    for (const [key, entryData] of Object.entries(data)) {
      try {
        if (entryData.expiresAt > Date.now()) {
          await this.set(key, JSON.parse(entryData.value), {
            ttl: entryData.expiresAt - Date.now(),
            ...entryData.metadata
          });
        }
      } catch (error) {
        logger.warn('Failed to import cache entry', 'CacheService', { key, error });
      }
    }
    
    logger.info('Cache import completed', 'CacheService');
  }

  // Destruir serviço
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.clear();
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = undefined;
    }
    
    logger.info('Cache service destroyed', 'CacheService');
  }
}

// Instância singleton
export const cacheService = CacheService.getInstance();

// Hook para usar o serviço de cache em componentes React
export function useCacheService() {
  return cacheService;
}

// Decorator para cache automático de métodos
export function withCache(
  key: string | ((args: any[]) => string),
  options: CacheOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(args) : `${key}_${JSON.stringify(args)}`;
      
      // Tentar obter do cache
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Executar método e cachear resultado
      const result = await method.apply(this, args);
      await cacheService.set(cacheKey, result, options);
      
      return result;
    };
    
    return descriptor;
  };
}

export default cacheService;