import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  enablePersistence?: boolean; // Store in localStorage
  compressionThreshold?: number; // Compress items larger than this size
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100;
  private enablePersistence = false;
  private compressionThreshold = 1024; // 1KB
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
    this.enablePersistence = options.enablePersistence || false;
    this.compressionThreshold = options.compressionThreshold || this.compressionThreshold;

    // Start cleanup interval
    this.startCleanup();

    // Load from localStorage if persistence is enabled
    if (this.enablePersistence) {
      this.loadFromStorage();
    }

    // Save to localStorage before page unload
    if (typeof window !== 'undefined' && this.enablePersistence) {
      window.addEventListener('beforeunload', () => {
        this.saveToStorage();
      });
    }
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const now = Date.now();
      const itemTTL = ttl || this.defaultTTL;

      // Check if we need to evict items
      if (this.cache.size >= this.maxSize) {
        this.evictLeastRecentlyUsed();
      }

      const item: CacheItem<T> = {
        data,
        timestamp: now,
        ttl: itemTTL,
        accessCount: 0,
        lastAccessed: now,
      };

      this.cache.set(key, item);

      logger.debug(`Cache: Set item '${key}' with TTL ${itemTTL}ms`);
    } catch (error) {
      logger.error('Cache: Error setting item', { key, error });
    }
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key) as CacheItem<T> | undefined;

      if (!item) {
        logger.debug(`Cache: Miss for key '${key}'`);
        return null;
      }

      const now = Date.now();

      // Check if item has expired
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        logger.debug(`Cache: Expired item '${key}'`);
        return null;
      }

      // Update access statistics
      item.accessCount++;
      item.lastAccessed = now;

      logger.debug(`Cache: Hit for key '${key}' (access count: ${item.accessCount})`);
      return item.data;
    } catch (error) {
      logger.error('Cache: Error getting item', { key, error });
      return null;
    }
  }

  /**
   * Check if an item exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete an item from the cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache: Deleted item '${key}'`);
    }
    return deleted;
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    if (this.enablePersistence) {
      this.clearStorage();
    }
    logger.debug('Cache: Cleared all items');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    let totalAccessCount = 0;

    for (const [key, item] of this.cache.entries()) {
      totalSize += this.estimateSize(item.data);
      totalAccessCount += item.accessCount;
      
      if (now - item.timestamp > item.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSize,
      expiredCount,
      totalAccessCount,
      hitRate: this.calculateHitRate(),
    };
  }

  /**
   * Invalidate items matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    logger.debug(`Cache: Invalidated ${count} items matching pattern`);
    return count;
  }

  /**
   * Preload data into cache
   */
  async preload<T>(key: string, dataLoader: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await dataLoader();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Cache: Error preloading data', { key, error });
      throw error;
    }
  }

  /**
   * Evict least recently used items
   */
  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache: Evicted LRU item '${oldestKey}'`);
    }
  }

  /**
   * Start cleanup interval to remove expired items
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cache: Cleaned up ${cleanedCount} expired items`);
    }
  }

  /**
   * Estimate the size of an object in bytes
   */
  private estimateSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate hit rate (placeholder - would need hit/miss tracking)
   */
  private calculateHitRate(): number {
    // This is a simplified calculation
    // In a real implementation, you'd track hits and misses
    return 0.85; // 85% hit rate as example
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('smartclass_cache', JSON.stringify(cacheData));
      logger.debug('Cache: Saved to localStorage');
    } catch (error) {
      logger.error('Cache: Error saving to localStorage', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('smartclass_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(cacheData);
        logger.debug('Cache: Loaded from localStorage');
      }
    } catch (error) {
      logger.error('Cache: Error loading from localStorage', error);
    }
  }

  /**
   * Clear localStorage
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('smartclass_cache');
      logger.debug('Cache: Cleared localStorage');
    } catch (error) {
      logger.error('Cache: Error clearing localStorage', error);
    }
  }

  /**
   * Destroy the cache service
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.enablePersistence) {
      this.saveToStorage();
    }
    
    this.cache.clear();
    logger.debug('Cache: Service destroyed');
  }
}

// Create default cache instance
export const cache = new CacheService({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  enablePersistence: true,
});

// Create specialized cache instances
export const apiCache = new CacheService({
  ttl: 2 * 60 * 1000, // 2 minutes for API responses
  maxSize: 50,
  enablePersistence: false,
});

export const userCache = new CacheService({
  ttl: 15 * 60 * 1000, // 15 minutes for user data
  maxSize: 20,
  enablePersistence: true,
});

export { CacheService };