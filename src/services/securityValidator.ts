import { logger } from './logger';
import { auditService, AuditAction } from './auditService';
import { rateLimiter, RateLimitType } from './rateLimiter';

// Tipos para validação de segurança
export interface SecurityValidationResult {
  isValid: boolean;
  violations: SecurityViolation[];
  riskScore: number;
  recommendations: string[];
}

export interface SecurityViolation {
  type: SecurityViolationType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details?: Record<string, any>;
}

export enum SecurityViolationType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  MALICIOUS_FILE = 'MALICIOUS_FILE',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  BRUTE_FORCE = 'BRUTE_FORCE',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_USER_AGENT = 'SUSPICIOUS_USER_AGENT',
  RAPID_REQUESTS = 'RAPID_REQUESTS',
  INVALID_SESSION = 'INVALID_SESSION',
  GEOLOCATION_ANOMALY = 'GEOLOCATION_ANOMALY',
  TIME_ANOMALY = 'TIME_ANOMALY'
}

export interface SecurityConfig {
  enableSqlInjectionDetection: boolean;
  enableXssDetection: boolean;
  enableCsrfProtection: boolean;
  enableFileValidation: boolean;
  enablePasswordValidation: boolean;
  enableBruteForceDetection: boolean;
  enableAnomalyDetection: boolean;
  maxRiskScore: number;
  blockOnHighRisk: boolean;
  logAllViolations: boolean;
}

class SecurityValidator {
  private static instance: SecurityValidator;
  private config: SecurityConfig;
  private suspiciousPatterns: Map<string, RegExp[]> = new Map();
  private userBehaviorHistory: Map<string, any[]> = new Map();
  private blockedIPs: Set<string> = new Set();
  private trustedDomains: Set<string> = new Set();

  private constructor() {
    this.config = {
      enableSqlInjectionDetection: true,
      enableXssDetection: true,
      enableCsrfProtection: true,
      enableFileValidation: true,
      enablePasswordValidation: true,
      enableBruteForceDetection: true,
      enableAnomalyDetection: true,
      maxRiskScore: 70,
      blockOnHighRisk: true,
      logAllViolations: true
    };

    this.initializeSuspiciousPatterns();
    this.initializeTrustedDomains();
  }

  static getInstance(): SecurityValidator {
    if (!SecurityValidator.instance) {
      SecurityValidator.instance = new SecurityValidator();
    }
    return SecurityValidator.instance;
  }

  private initializeSuspiciousPatterns(): void {
    // Padrões de SQL Injection
    this.suspiciousPatterns.set('sql_injection', [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
      /(script|javascript|vbscript|onload|onerror|onclick)/i,
      /(\<|\>|"|'|%|\(|\)|\+|\-|=|\[|\]|\{|\}|\||\\|\^|\~|`)/,
      /((\%3C)|(<)).*((\%3E)|(>))/i,
      /((\%27)|(')|(\-\-)|(\%3B)|(;))/i
    ]);

    // Padrões de XSS
    this.suspiciousPatterns.set('xss', [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi,
      /<svg[^>]*>.*?<\/svg>/gi
    ]);

    // Padrões suspeitos gerais
    this.suspiciousPatterns.set('suspicious', [
      /\.\.[\/\\]/g, // Directory traversal
      /\b(cmd|command|exec|system|shell|eval|base64_decode)\b/gi,
      /\b(wget|curl|nc|netcat|telnet|ssh|ftp)\b/gi,
      /\b(passwd|shadow|hosts|config)\b/gi,
      /\b(0x[0-9a-f]+|\\x[0-9a-f]{2})\b/gi, // Hex encoding
      /%[0-9a-f]{2}/gi, // URL encoding
      /\b(union|select|from|where|order|group|having|limit)\b/gi
    ]);

    // User agents suspeitos
    this.suspiciousPatterns.set('user_agent', [
      /bot|crawler|spider|scraper/gi,
      /curl|wget|python|java|perl|ruby/gi,
      /scanner|exploit|hack|attack/gi,
      /sqlmap|nmap|nikto|burp|zap/gi
    ]);
  }

  private initializeTrustedDomains(): void {
    this.trustedDomains.add('localhost');
    this.trustedDomains.add('127.0.0.1');
    this.trustedDomains.add('::1');
    // Adicione outros domínios confiáveis conforme necessário
  }

  // Validação de SQL Injection
  validateSqlInjection(input: string): SecurityViolation[] {
    if (!this.config.enableSqlInjectionDetection) return [];

    const violations: SecurityViolation[] = [];
    const patterns = this.suspiciousPatterns.get('sql_injection') || [];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        violations.push({
          type: SecurityViolationType.SQL_INJECTION,
          severity: 'HIGH',
          message: 'Possível tentativa de SQL Injection detectada',
          details: {
            input: input.substring(0, 100), // Limitar tamanho do log
            pattern: pattern.source
          }
        });
        break; // Uma violação é suficiente
      }
    }

    return violations;
  }

  // Validação de XSS
  validateXss(input: string): SecurityViolation[] {
    if (!this.config.enableXssDetection) return [];

    const violations: SecurityViolation[] = [];
    const patterns = this.suspiciousPatterns.get('xss') || [];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        violations.push({
          type: SecurityViolationType.XSS_ATTEMPT,
          severity: 'HIGH',
          message: 'Possível tentativa de XSS detectada',
          details: {
            input: input.substring(0, 100),
            pattern: pattern.source
          }
        });
        break;
      }
    }

    return violations;
  }

  // Validação de padrões suspeitos
  validateSuspiciousPatterns(input: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const patterns = this.suspiciousPatterns.get('suspicious') || [];

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        violations.push({
          type: SecurityViolationType.SUSPICIOUS_PATTERN,
          severity: 'MEDIUM',
          message: 'Padrão suspeito detectado na entrada',
          details: {
            input: input.substring(0, 100),
            pattern: pattern.source
          }
        });
      }
    }

    return violations;
  }

  // Validação de senha
  validatePassword(password: string): SecurityViolation[] {
    if (!this.config.enablePasswordValidation) return [];

    const violations: SecurityViolation[] = [];
    const commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      'qwerty', 'abc123', 'password123', 'admin', 'letmein'
    ];

    // Verificar comprimento mínimo
    if (password.length < 8) {
      violations.push({
        type: SecurityViolationType.WEAK_PASSWORD,
        severity: 'MEDIUM',
        message: 'Senha muito curta (mínimo 8 caracteres)'
      });
    }

    // Verificar complexidade
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const complexityScore = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (complexityScore < 3) {
      violations.push({
        type: SecurityViolationType.WEAK_PASSWORD,
        severity: 'MEDIUM',
        message: 'Senha deve conter pelo menos 3 dos seguintes: minúscula, maiúscula, número, caractere especial'
      });
    }

    // Verificar senhas comuns
    if (commonPasswords.includes(password.toLowerCase())) {
      violations.push({
        type: SecurityViolationType.WEAK_PASSWORD,
        severity: 'HIGH',
        message: 'Senha muito comum e facilmente adivinhável'
      });
    }

    return violations;
  }

  // Validação de arquivo
  validateFile(file: File): SecurityViolation[] {
    if (!this.config.enableFileValidation) return [];

    const violations: SecurityViolation[] = [];
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const dangerousExtensions = [
      '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs',
      '.js', '.jar', '.php', '.asp', '.aspx', '.jsp'
    ];

    // Verificar tipo MIME
    if (!allowedTypes.includes(file.type)) {
      violations.push({
        type: SecurityViolationType.MALICIOUS_FILE,
        severity: 'HIGH',
        message: `Tipo de arquivo não permitido: ${file.type}`,
        details: { fileName: file.name, fileType: file.type }
      });
    }

    // Verificar extensão
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      violations.push({
        type: SecurityViolationType.MALICIOUS_FILE,
        severity: 'CRITICAL',
        message: `Extensão de arquivo perigosa: ${extension}`,
        details: { fileName: file.name, extension }
      });
    }

    // Verificar tamanho
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      violations.push({
        type: SecurityViolationType.MALICIOUS_FILE,
        severity: 'MEDIUM',
        message: 'Arquivo muito grande',
        details: { fileName: file.name, size: file.size, maxSize }
      });
    }

    return violations;
  }

  // Validação de User Agent
  validateUserAgent(userAgent: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const patterns = this.suspiciousPatterns.get('user_agent') || [];

    for (const pattern of patterns) {
      if (pattern.test(userAgent)) {
        violations.push({
          type: SecurityViolationType.SUSPICIOUS_USER_AGENT,
          severity: 'MEDIUM',
          message: 'User Agent suspeito detectado',
          details: { userAgent: userAgent.substring(0, 100) }
        });
        break;
      }
    }

    return violations;
  }

  // Detecção de força bruta
  validateBruteForce(identifier: string, action: string): SecurityViolation[] {
    if (!this.config.enableBruteForceDetection) return [];

    const violations: SecurityViolation[] = [];
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxAttempts = 10;

    const history = this.userBehaviorHistory.get(key) || [];
    const recentAttempts = history.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      violations.push({
        type: SecurityViolationType.BRUTE_FORCE,
        severity: 'CRITICAL',
        message: 'Possível ataque de força bruta detectado',
        details: {
          identifier,
          action,
          attempts: recentAttempts.length,
          timeWindow: windowMs / 1000 / 60 // em minutos
        }
      });
    }

    // Atualizar histórico
    recentAttempts.push(now);
    this.userBehaviorHistory.set(key, recentAttempts);

    return violations;
  }

  // Validação de sessão
  validateSession(sessionToken: string, userId: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Verificar formato do token
    if (!sessionToken || sessionToken.length < 32) {
      violations.push({
        type: SecurityViolationType.INVALID_SESSION,
        severity: 'HIGH',
        message: 'Token de sessão inválido ou muito curto',
        details: { tokenLength: sessionToken?.length || 0 }
      });
    }

    // Verificar se o token contém apenas caracteres válidos
    if (!/^[a-zA-Z0-9\-_\.]+$/.test(sessionToken)) {
      violations.push({
        type: SecurityViolationType.INVALID_SESSION,
        severity: 'HIGH',
        message: 'Token de sessão contém caracteres inválidos'
      });
    }

    return violations;
  }

  // Validação completa de entrada
  validateInput(input: string, context?: string): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    // Executar todas as validações
    violations.push(...this.validateSqlInjection(input));
    violations.push(...this.validateXss(input));
    violations.push(...this.validateSuspiciousPatterns(input));

    // Calcular score de risco
    for (const violation of violations) {
      switch (violation.severity) {
        case 'LOW':
          riskScore += 10;
          break;
        case 'MEDIUM':
          riskScore += 25;
          break;
        case 'HIGH':
          riskScore += 50;
          break;
        case 'CRITICAL':
          riskScore += 100;
          break;
      }
    }

    // Gerar recomendações
    if (violations.length > 0) {
      recommendations.push('Sanitizar entrada do usuário');
      recommendations.push('Implementar validação no lado do servidor');
      recommendations.push('Usar prepared statements para queries SQL');
      recommendations.push('Escapar caracteres especiais em saídas HTML');
    }

    const isValid = riskScore <= this.config.maxRiskScore;

    // Log de violações
    if (this.config.logAllViolations && violations.length > 0) {
      logger.warn('Violações de segurança detectadas', 'SecurityValidator', {
        context,
        violations,
        riskScore,
        input: input.substring(0, 100)
      });

      // Auditoria para violações críticas
      const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
      if (criticalViolations.length > 0) {
        auditService.logSecurityViolation(
          `Violações críticas de segurança: ${criticalViolations.map(v => v.type).join(', ')}`,
          { violations: criticalViolations, context, riskScore }
        );
      }
    }

    return {
      isValid,
      violations,
      riskScore,
      recommendations
    };
  }

  // Validação de requisição completa
  validateRequest(data: {
    input?: string;
    userAgent?: string;
    userId?: string;
    sessionToken?: string;
    action?: string;
    files?: File[];
  }): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    // Validar entrada de texto
    if (data.input) {
      const inputResult = this.validateInput(data.input);
      violations.push(...inputResult.violations);
      riskScore += inputResult.riskScore;
    }

    // Validar User Agent
    if (data.userAgent) {
      violations.push(...this.validateUserAgent(data.userAgent));
    }

    // Validar sessão
    if (data.sessionToken && data.userId) {
      violations.push(...this.validateSession(data.sessionToken, data.userId));
    }

    // Validar força bruta
    if (data.userId && data.action) {
      violations.push(...this.validateBruteForce(data.userId, data.action));
    }

    // Validar arquivos
    if (data.files) {
      for (const file of data.files) {
        violations.push(...this.validateFile(file));
      }
    }

    // Recalcular score de risco
    riskScore = 0;
    for (const violation of violations) {
      switch (violation.severity) {
        case 'LOW':
          riskScore += 10;
          break;
        case 'MEDIUM':
          riskScore += 25;
          break;
        case 'HIGH':
          riskScore += 50;
          break;
        case 'CRITICAL':
          riskScore += 100;
          break;
      }
    }

    const isValid = riskScore <= this.config.maxRiskScore;

    // Bloquear se necessário
    if (!isValid && this.config.blockOnHighRisk) {
      const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
      if (criticalViolations.length > 0 && data.userId) {
        // Implementar bloqueio temporário
        rateLimiter.resetLimit(RateLimitType.API_GENERAL, data.userId);
      }
    }

    return {
      isValid,
      violations,
      riskScore,
      recommendations
    };
  }

  // Métodos de configuração
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Security validator config updated', 'SecurityValidator', { config });
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Métodos de gerenciamento
  addTrustedDomain(domain: string): void {
    this.trustedDomains.add(domain);
    logger.info(`Trusted domain added: ${domain}`, 'SecurityValidator');
  }

  removeTrustedDomain(domain: string): void {
    this.trustedDomains.delete(domain);
    logger.info(`Trusted domain removed: ${domain}`, 'SecurityValidator');
  }

  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    logger.warn(`IP blocked: ${ip}`, 'SecurityValidator');
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    logger.info(`IP unblocked: ${ip}`, 'SecurityValidator');
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Sanitização de dados
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>"'&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match] || match;
      })
      .trim();
  }

  // Estatísticas de segurança
  getSecurityStats(): {
    totalViolations: number;
    violationsByType: Record<SecurityViolationType, number>;
    blockedIPs: number;
    trustedDomains: number;
    averageRiskScore: number;
  } {
    // Esta implementação seria expandida com dados reais
    return {
      totalViolations: 0,
      violationsByType: {} as any,
      blockedIPs: this.blockedIPs.size,
      trustedDomains: this.trustedDomains.size,
      averageRiskScore: 0
    };
  }

  // Cleanup
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    for (const [key, history] of this.userBehaviorHistory.entries()) {
      const recentHistory = history.filter(time => now - time < maxAge);
      if (recentHistory.length === 0) {
        this.userBehaviorHistory.delete(key);
      } else {
        this.userBehaviorHistory.set(key, recentHistory);
      }
    }
  }
}

// Instância singleton
export const securityValidator = SecurityValidator.getInstance();

// Hook para usar o validador de segurança em componentes React
export function useSecurityValidator() {
  return securityValidator;
}

// Decorator para validação automática de segurança
export function withSecurityValidation(options: { validateInput?: boolean; validateFiles?: boolean } = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Validar argumentos se necessário
      if (options.validateInput) {
        for (const arg of args) {
          if (typeof arg === 'string') {
            const result = securityValidator.validateInput(arg, propertyName);
            if (!result.isValid) {
              throw new Error(`Security validation failed: ${result.violations.map(v => v.message).join(', ')}`);
            }
          }
        }
      }

      return method.apply(this, args);
    };
  };
}

export default securityValidator;