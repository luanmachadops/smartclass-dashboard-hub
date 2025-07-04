import { logger } from './logger';
import { auditService, AuditAction } from './auditService';

// Tipos para o sistema de rate limiting
export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em millisegundos
  maxRequests: number; // Máximo de requests por janela
  keyGenerator?: (identifier: string) => string; // Função para gerar chave única
  skipSuccessfulRequests?: boolean; // Pular requests bem-sucedidos
  skipFailedRequests?: boolean; // Pular requests que falharam
  onLimitReached?: (key: string, info: RateLimitInfo) => void; // Callback quando limite é atingido
  message?: string; // Mensagem de erro personalizada
  standardHeaders?: boolean; // Incluir headers padrão de rate limit
  legacyHeaders?: boolean; // Incluir headers legados
}

export interface RateLimitInfo {
  totalHits: number; // Total de hits na janela atual
  totalHitsInWindow: number; // Total de hits considerando a janela
  remainingPoints: number; // Pontos restantes
  msBeforeNext: number; // Millisegundos até o próximo reset
  resetTime: Date; // Quando o limite será resetado
}

export interface RateLimitResult {
  allowed: boolean; // Se a requisição é permitida
  info: RateLimitInfo; // Informações do rate limit
  headers: Record<string, string>; // Headers para incluir na resposta
}

export interface RateLimitEntry {
  count: number; // Número de requests
  resetTime: number; // Timestamp do reset
  firstRequest: number; // Timestamp da primeira request
}

export enum RateLimitType {
  LOGIN = 'login',
  SIGNUP = 'signup',
  PASSWORD_RESET = 'password_reset',
  API_GENERAL = 'api_general',
  FILE_UPLOAD = 'file_upload',
  SEARCH = 'search',
  EXPORT = 'export',
  ADMIN_ACTIONS = 'admin_actions',
  PAYMENT = 'payment',
  EMAIL = 'email'
}

class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private configs: Map<RateLimitType, RateLimitConfig> = new Map();

  private constructor() {
    this.initializeConfigs();
    this.startCleanupInterval();
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private initializeConfigs(): void {
    // Configurações padrão para diferentes tipos de rate limiting
    this.configs.set(RateLimitType.LOGIN, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5, // 5 tentativas de login por 15 minutos
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for login', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('login', { key, info });
      }
    });

    this.configs.set(RateLimitType.SIGNUP, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3, // 3 cadastros por hora
      message: 'Muitas tentativas de cadastro. Tente novamente em 1 hora.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for signup', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('signup', { key, info });
      }
    });

    this.configs.set(RateLimitType.PASSWORD_RESET, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 3, // 3 resets de senha por hora
      message: 'Muitas tentativas de reset de senha. Tente novamente em 1 hora.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for password reset', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('password_reset', { key, info });
      }
    });

    this.configs.set(RateLimitType.API_GENERAL, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 1000, // 1000 requests por 15 minutos
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
      skipSuccessfulRequests: false,
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for API', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('api', { key, info });
      }
    });

    this.configs.set(RateLimitType.FILE_UPLOAD, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 50, // 50 uploads por hora
      message: 'Muitos uploads. Tente novamente em 1 hora.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for file upload', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('file_upload', { key, info });
      }
    });

    this.configs.set(RateLimitType.SEARCH, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 60, // 60 buscas por minuto
      message: 'Muitas buscas. Aguarde um momento.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for search', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('search', { key, info });
      }
    });

    this.configs.set(RateLimitType.EXPORT, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 10, // 10 exports por hora
      message: 'Muitos exports. Tente novamente em 1 hora.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for export', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('export', { key, info });
      }
    });

    this.configs.set(RateLimitType.ADMIN_ACTIONS, {
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 30, // 30 ações administrativas por minuto
      message: 'Muitas ações administrativas. Aguarde um momento.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for admin actions', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('admin_actions', { key, info });
      }
    });

    this.configs.set(RateLimitType.PAYMENT, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 10, // 10 tentativas de pagamento por hora
      message: 'Muitas tentativas de pagamento. Tente novamente em 1 hora.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for payment', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('payment', { key, info });
      }
    });

    this.configs.set(RateLimitType.EMAIL, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 20, // 20 emails por hora
      message: 'Muitos emails enviados. Tente novamente em 1 hora.',
      onLimitReached: (key, info) => {
        logger.warn('Rate limit exceeded for email', 'RateLimiter', { key, info });
        auditService.logRateLimitExceeded('email', { key, info });
      }
    });
  }

  private startCleanupInterval(): void {
    // Limpar entradas expiradas a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`, 'RateLimiter');
    }
  }

  private generateKey(type: RateLimitType, identifier: string): string {
    const config = this.configs.get(type);
    if (config?.keyGenerator) {
      return config.keyGenerator(identifier);
    }
    return `${type}:${identifier}`;
  }

  private getClientIdentifier(): string {
    // Em um ambiente real, você obteria o IP do cliente
    // Por enquanto, usamos uma combinação de user agent e timestamp
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      const sessionId = sessionStorage.getItem('session_id') || 'anonymous';
      return `${userAgent.slice(0, 50)}:${sessionId}`;
    }
    return 'server';
  }

  private calculateRateLimitInfo(
    entry: RateLimitEntry | undefined,
    config: RateLimitConfig,
    now: number
  ): RateLimitInfo {
    if (!entry || entry.resetTime <= now) {
      // Nova janela ou entrada expirada
      return {
        totalHits: 0,
        totalHitsInWindow: 0,
        remainingPoints: config.maxRequests,
        msBeforeNext: config.windowMs,
        resetTime: new Date(now + config.windowMs)
      };
    }

    const remainingPoints = Math.max(0, config.maxRequests - entry.count);
    const msBeforeNext = Math.max(0, entry.resetTime - now);

    return {
      totalHits: entry.count,
      totalHitsInWindow: entry.count,
      remainingPoints,
      msBeforeNext,
      resetTime: new Date(entry.resetTime)
    };
  }

  private generateHeaders(info: RateLimitInfo, config: RateLimitConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    if (config.standardHeaders !== false) {
      headers['X-RateLimit-Limit'] = config.maxRequests.toString();
      headers['X-RateLimit-Remaining'] = info.remainingPoints.toString();
      headers['X-RateLimit-Reset'] = Math.ceil(info.resetTime.getTime() / 1000).toString();
    }

    if (config.legacyHeaders) {
      headers['X-Rate-Limit-Limit'] = config.maxRequests.toString();
      headers['X-Rate-Limit-Remaining'] = info.remainingPoints.toString();
      headers['X-Rate-Limit-Reset'] = Math.ceil(info.resetTime.getTime() / 1000).toString();
    }

    if (info.remainingPoints === 0) {
      headers['Retry-After'] = Math.ceil(info.msBeforeNext / 1000).toString();
    }

    return headers;
  }

  // Método principal para verificar rate limit
  checkRateLimit(
    type: RateLimitType,
    identifier?: string,
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const config = { ...this.configs.get(type)!, ...customConfig };
    const finalIdentifier = identifier || this.getClientIdentifier();
    const key = this.generateKey(type, finalIdentifier);
    const now = Date.now();

    const entry = this.store.get(key);
    const info = this.calculateRateLimitInfo(entry, config, now);
    const headers = this.generateHeaders(info, config);

    // Verificar se o limite foi atingido
    if (entry && entry.resetTime > now && entry.count >= config.maxRequests) {
      // Limite atingido
      if (config.onLimitReached) {
        config.onLimitReached(key, info);
      }

      return {
        allowed: false,
        info,
        headers
      };
    }

    // Atualizar ou criar entrada
    if (!entry || entry.resetTime <= now) {
      // Nova janela
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      });
    } else {
      // Incrementar contador
      entry.count++;
      this.store.set(key, entry);
    }

    // Recalcular info após atualização
    const updatedEntry = this.store.get(key)!;
    const updatedInfo = this.calculateRateLimitInfo(updatedEntry, config, now);
    const updatedHeaders = this.generateHeaders(updatedInfo, config);

    return {
      allowed: true,
      info: updatedInfo,
      headers: updatedHeaders
    };
  }

  // Métodos de conveniência para tipos específicos
  checkLogin(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.LOGIN, identifier);
  }

  checkSignup(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.SIGNUP, identifier);
  }

  checkPasswordReset(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.PASSWORD_RESET, identifier);
  }

  checkAPI(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.API_GENERAL, identifier);
  }

  checkFileUpload(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.FILE_UPLOAD, identifier);
  }

  checkSearch(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.SEARCH, identifier);
  }

  checkExport(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.EXPORT, identifier);
  }

  checkAdminActions(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.ADMIN_ACTIONS, identifier);
  }

  checkPayment(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.PAYMENT, identifier);
  }

  checkEmail(identifier?: string): RateLimitResult {
    return this.checkRateLimit(RateLimitType.EMAIL, identifier);
  }

  // Métodos de configuração
  updateConfig(type: RateLimitType, config: Partial<RateLimitConfig>): void {
    const currentConfig = this.configs.get(type) || {};
    this.configs.set(type, { ...currentConfig, ...config });
    logger.info(`Rate limit config updated for ${type}`, 'RateLimiter', { config });
  }

  getConfig(type: RateLimitType): RateLimitConfig | undefined {
    return this.configs.get(type);
  }

  // Métodos de gerenciamento
  resetLimit(type: RateLimitType, identifier?: string): void {
    const finalIdentifier = identifier || this.getClientIdentifier();
    const key = this.generateKey(type, finalIdentifier);
    this.store.delete(key);
    logger.info(`Rate limit reset for ${type}`, 'RateLimiter', { key });
  }

  resetAllLimits(): void {
    const count = this.store.size;
    this.store.clear();
    logger.info(`All rate limits reset`, 'RateLimiter', { count });
  }

  // Métodos de consulta
  getCurrentLimits(): Array<{ key: string; entry: RateLimitEntry; type: string }> {
    const now = Date.now();
    const results: Array<{ key: string; entry: RateLimitEntry; type: string }> = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime > now) {
        const type = key.split(':')[0];
        results.push({ key, entry, type });
      }
    }

    return results.sort((a, b) => b.entry.count - a.entry.count);
  }

  getStats(): {
    totalActiveKeys: number;
    totalRequests: number;
    topLimitedTypes: Array<{ type: string; count: number }>;
    topLimitedIdentifiers: Array<{ identifier: string; count: number }>;
  } {
    const now = Date.now();
    const typeStats: Record<string, number> = {};
    const identifierStats: Record<string, number> = {};
    let totalRequests = 0;
    let activeKeys = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime > now) {
        activeKeys++;
        totalRequests += entry.count;
        
        const [type, identifier] = key.split(':', 2);
        typeStats[type] = (typeStats[type] || 0) + entry.count;
        identifierStats[identifier] = (identifierStats[identifier] || 0) + entry.count;
      }
    }

    const topLimitedTypes = Object.entries(typeStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topLimitedIdentifiers = Object.entries(identifierStats)
      .map(([identifier, count]) => ({ identifier, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActiveKeys: activeKeys,
      totalRequests,
      topLimitedTypes,
      topLimitedIdentifiers
    };
  }

  // Método para exportar dados (para debugging)
  exportData(): string {
    const data = {
      store: Array.from(this.store.entries()),
      configs: Array.from(this.configs.entries()),
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  // Cleanup ao destruir a instância
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
    logger.info('RateLimiter destroyed', 'RateLimiter');
  }
}

// Instância singleton
export const rateLimiter = RateLimiter.getInstance();

// Hook para usar rate limiter em componentes React
export function useRateLimiter() {
  return rateLimiter;
}

// Decorator para aplicar rate limiting automaticamente
export function withRateLimit(type: RateLimitType, identifier?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = rateLimiter.checkRateLimit(type, identifier);
      
      if (!result.allowed) {
        const config = rateLimiter.getConfig(type);
        const message = config?.message || 'Rate limit exceeded';
        throw new Error(message);
      }

      return method.apply(this, args);
    };
  };
}

// Função utilitária para verificar múltiplos rate limits
export function checkMultipleRateLimits(
  checks: Array<{ type: RateLimitType; identifier?: string }>
): { allowed: boolean; failedCheck?: RateLimitType; result?: RateLimitResult } {
  for (const check of checks) {
    const result = rateLimiter.checkRateLimit(check.type, check.identifier);
    if (!result.allowed) {
      return {
        allowed: false,
        failedCheck: check.type,
        result
      };
    }
  }
  
  return { allowed: true };
}

// Middleware para Express.js (se necessário no futuro)
export function createRateLimitMiddleware(type: RateLimitType) {
  return (req: any, res: any, next: any) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const result = rateLimiter.checkRateLimit(type, identifier);
    
    // Adicionar headers de rate limit
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    if (!result.allowed) {
      const config = rateLimiter.getConfig(type);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: config?.message || 'Too many requests',
        retryAfter: Math.ceil(result.info.msBeforeNext / 1000)
      });
    }
    
    next();
  };
}

export default rateLimiter;