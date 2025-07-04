// Serviço de segurança avançada
import { authLogger } from './logger'
import { monitoring } from './monitoring'

// Tipos para configuração de segurança
interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number // em minutos
  sessionTimeout: number // em minutos
  passwordMinLength: number
  requireMFA: boolean
  allowedDomains?: string[]
  rateLimiting: {
    requests: number
    windowMs: number
  }
}

interface LoginAttempt {
  email: string
  timestamp: number
  success: boolean
  ip?: string
  userAgent?: string
}

interface SecurityEvent {
  type: 'login_attempt' | 'password_change' | 'suspicious_activity' | 'data_access' | 'permission_change'
  userId?: string
  email?: string
  timestamp: number
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip?: string
  userAgent?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class SecurityService {
  private config: SecurityConfig
  private loginAttempts: Map<string, LoginAttempt[]> = new Map()
  private lockedAccounts: Map<string, number> = new Map()
  private securityEvents: SecurityEvent[] = []
  private rateLimitMap: Map<string, RateLimitEntry> = new Map()
  private suspiciousIPs: Set<string> = new Set()
  private maxEvents = 1000

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15, // 15 minutos
      sessionTimeout: 60, // 1 hora
      passwordMinLength: 8,
      requireMFA: false,
      rateLimiting: {
        requests: 100,
        windowMs: 15 * 60 * 1000 // 15 minutos
      },
      ...config
    }

    this.initializeSecurity()
  }

  private initializeSecurity(): void {
    authLogger.info('Inicializando serviço de segurança', {
      action: 'initSecurity',
      config: {
        maxLoginAttempts: this.config.maxLoginAttempts,
        lockoutDuration: this.config.lockoutDuration,
        sessionTimeout: this.config.sessionTimeout,
        requireMFA: this.config.requireMFA
      }
    })

    // Limpar dados antigos periodicamente
    setInterval(() => {
      this.cleanupOldData()
    }, 60 * 60 * 1000) // A cada hora

    // Monitorar atividades suspeitas
    setInterval(() => {
      this.detectSuspiciousActivity()
    }, 5 * 60 * 1000) // A cada 5 minutos
  }

  // Validação de senha forte
  validatePassword(password: string): {
    isValid: boolean
    errors: string[]
    strength: 'weak' | 'medium' | 'strong'
  } {
    const errors: string[] = []
    let score = 0

    // Verificações básicas
    if (password.length < this.config.passwordMinLength) {
      errors.push(`Senha deve ter pelo menos ${this.config.passwordMinLength} caracteres`)
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula')
    } else {
      score += 1
    }

    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número')
    } else {
      score += 1
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)')
    } else {
      score += 1
    }

    // Verificar padrões comuns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /(.)\1{3,}/ // caracteres repetidos
    ]

    commonPatterns.forEach(pattern => {
      if (pattern.test(password)) {
        errors.push('Senha contém padrões comuns ou inseguros')
        score -= 1
      }
    })

    // Determinar força
    let strength: 'weak' | 'medium' | 'strong'
    if (score >= 4) {
      strength = 'strong'
    } else if (score >= 2) {
      strength = 'medium'
    } else {
      strength = 'weak'
    }

    const isValid = errors.length === 0 && strength !== 'weak'

    authLogger.debug('Validação de senha realizada', {
      action: 'validatePassword',
      strength,
      score,
      isValid,
      errorCount: errors.length
    })

    return { isValid, errors, strength }
  }

  // Registrar tentativa de login
  recordLoginAttempt(email: string, success: boolean, ip?: string, userAgent?: string): boolean {
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      success,
      ip,
      userAgent
    }

    // Verificar se a conta está bloqueada
    if (this.isAccountLocked(email)) {
      this.logSecurityEvent({
        type: 'login_attempt',
        email,
        timestamp: Date.now(),
        details: { reason: 'account_locked', ip, userAgent },
        severity: 'medium',
        ip,
        userAgent
      })
      return false
    }

    // Adicionar tentativa ao histórico
    const attempts = this.loginAttempts.get(email) || []
    attempts.push(attempt)
    this.loginAttempts.set(email, attempts)

    // Se falhou, verificar se deve bloquear
    if (!success) {
      const recentFailures = this.getRecentFailedAttempts(email)
      
      if (recentFailures >= this.config.maxLoginAttempts) {
        this.lockAccount(email)
        
        this.logSecurityEvent({
          type: 'login_attempt',
          email,
          timestamp: Date.now(),
          details: { 
            reason: 'max_attempts_exceeded', 
            attempts: recentFailures,
            ip, 
            userAgent 
          },
          severity: 'high',
          ip,
          userAgent
        })
        
        return false
      }
    } else {
      // Login bem-sucedido, limpar tentativas
      this.clearLoginAttempts(email)
    }

    authLogger.info('Tentativa de login registrada', {
      action: 'recordLoginAttempt',
      email,
      success,
      ip,
      recentFailures: this.getRecentFailedAttempts(email)
    })

    return true
  }

  // Verificar se conta está bloqueada
  isAccountLocked(email: string): boolean {
    const lockTime = this.lockedAccounts.get(email.toLowerCase())
    if (!lockTime) return false

    const now = Date.now()
    const lockDuration = this.config.lockoutDuration * 60 * 1000

    if (now - lockTime > lockDuration) {
      // Desbloqueio automático
      this.lockedAccounts.delete(email.toLowerCase())
      
      authLogger.info('Conta desbloqueada automaticamente', {
        action: 'autoUnlock',
        email
      })
      
      return false
    }

    return true
  }

  // Bloquear conta
  private lockAccount(email: string): void {
    this.lockedAccounts.set(email.toLowerCase(), Date.now())
    
    authLogger.warn('Conta bloqueada por excesso de tentativas', {
      action: 'lockAccount',
      email,
      duration: this.config.lockoutDuration
    })

    monitoring.recordUserAction('account_locked', 'security', {
      success: true,
      metadata: { email, reason: 'max_login_attempts' }
    })
  }

  // Limpar tentativas de login
  private clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email.toLowerCase())
  }

  // Obter tentativas recentes falhadas
  private getRecentFailedAttempts(email: string): number {
    const attempts = this.loginAttempts.get(email.toLowerCase()) || []
    const cutoff = Date.now() - (this.config.lockoutDuration * 60 * 1000)
    
    return attempts.filter(attempt => 
      !attempt.success && attempt.timestamp > cutoff
    ).length
  }

  // Rate limiting
  checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const entry = this.rateLimitMap.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Nova janela de tempo
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimiting.windowMs
      })
      return true
    }

    if (entry.count >= this.config.rateLimiting.requests) {
      authLogger.warn('Rate limit excedido', {
        action: 'rateLimitExceeded',
        identifier,
        count: entry.count,
        limit: this.config.rateLimiting.requests
      })
      
      this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: Date.now(),
        details: { 
          reason: 'rate_limit_exceeded',
          identifier,
          count: entry.count
        },
        severity: 'medium'
      })
      
      return false
    }

    entry.count++
    return true
  }

  // Validar domínio de email
  validateEmailDomain(email: string): boolean {
    if (!this.config.allowedDomains || this.config.allowedDomains.length === 0) {
      return true // Sem restrições
    }

    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false

    return this.config.allowedDomains.includes(domain)
  }

  // Sanitizar entrada
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>"'&]/g, '') // Remover caracteres perigosos
      .substring(0, 1000) // Limitar tamanho
  }

  // Validar sessão
  validateSession(sessionData: any): boolean {
    if (!sessionData || !sessionData.timestamp) {
      return false
    }

    const now = Date.now()
    const sessionAge = now - sessionData.timestamp
    const maxAge = this.config.sessionTimeout * 60 * 1000

    return sessionAge < maxAge
  }

  // Logar evento de segurança
  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event)
    
    // Manter apenas os eventos mais recentes
    if (this.securityEvents.length > this.maxEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxEvents)
    }

    authLogger.warn('Evento de segurança registrado', {
      action: 'securityEvent',
      type: event.type,
      severity: event.severity,
      details: event.details
    })

    monitoring.recordUserAction('security_event', 'security', {
      success: true,
      metadata: {
        type: event.type,
        severity: event.severity
      }
    })

    // Alertar para eventos críticos
    if (event.severity === 'critical') {
      this.handleCriticalEvent(event)
    }
  }

  // Tratar evento crítico
  private handleCriticalEvent(event: SecurityEvent): void {
    authLogger.error('Evento de segurança crítico detectado', {
      action: 'criticalSecurityEvent',
      event
    })

    // TODO: Implementar notificações (email, SMS, etc.)
    // TODO: Implementar bloqueio automático se necessário
  }

  // Detectar atividade suspeita
  private detectSuspiciousActivity(): void {
    const now = Date.now()
    const window = 10 * 60 * 1000 // 10 minutos
    
    // Verificar múltiplas tentativas de login de IPs diferentes
    const recentAttempts = Array.from(this.loginAttempts.values())
      .flat()
      .filter(attempt => now - attempt.timestamp < window)
    
    const ipCounts = new Map<string, number>()
    recentAttempts.forEach(attempt => {
      if (attempt.ip) {
        ipCounts.set(attempt.ip, (ipCounts.get(attempt.ip) || 0) + 1)
      }
    })
    
    // Marcar IPs suspeitos
    ipCounts.forEach((count, ip) => {
      if (count > 20) { // Mais de 20 tentativas em 10 minutos
        if (!this.suspiciousIPs.has(ip)) {
          this.suspiciousIPs.add(ip)
          
          this.logSecurityEvent({
            type: 'suspicious_activity',
            timestamp: now,
            details: {
              reason: 'excessive_login_attempts',
              ip,
              count,
              window: '10min'
            },
            severity: 'high',
            ip
          })
        }
      }
    })
  }

  // Limpar dados antigos
  private cleanupOldData(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 horas
    
    // Limpar tentativas de login antigas
    this.loginAttempts.forEach((attempts, email) => {
      const filtered = attempts.filter(attempt => attempt.timestamp > cutoff)
      if (filtered.length === 0) {
        this.loginAttempts.delete(email)
      } else {
        this.loginAttempts.set(email, filtered)
      }
    })
    
    // Limpar eventos de segurança antigos
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoff)
    
    // Limpar rate limits expirados
    const now = Date.now()
    this.rateLimitMap.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key)
      }
    })
    
    authLogger.debug('Limpeza de dados de segurança concluída', {
      action: 'securityCleanup',
      cutoffTime: new Date(cutoff).toISOString()
    })
  }

  // Obter estatísticas de segurança
  getSecurityStats(): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    lockedAccounts: number
    suspiciousIPs: number
    recentAttempts: number
  } {
    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    
    this.securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
    })
    
    const recentAttempts = Array.from(this.loginAttempts.values())
      .flat()
      .filter(attempt => Date.now() - attempt.timestamp < 60 * 60 * 1000) // 1 hora
      .length
    
    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      lockedAccounts: this.lockedAccounts.size,
      suspiciousIPs: this.suspiciousIPs.size,
      recentAttempts
    }
  }

  // Exportar dados de segurança
  exportSecurityData(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      stats: this.getSecurityStats(),
      events: this.securityEvents,
      config: this.config
    }
    
    return JSON.stringify(data, null, 2)
  }
}

// Instância singleton
export const security = new SecurityService()

// Hook para React components
export const useSecurity = () => {
  return {
    validatePassword: security.validatePassword.bind(security),
    recordLoginAttempt: security.recordLoginAttempt.bind(security),
    isAccountLocked: security.isAccountLocked.bind(security),
    checkRateLimit: security.checkRateLimit.bind(security),
    validateEmailDomain: security.validateEmailDomain.bind(security),
    sanitizeInput: security.sanitizeInput.bind(security),
    validateSession: security.validateSession.bind(security),
    getSecurityStats: security.getSecurityStats.bind(security)
  }
}

export default security