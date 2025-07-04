/**
 * Serviço de logging estruturado para a aplicação
 * Centraliza todos os logs e permite fácil integração com serviços de monitoramento
 */

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug' | 'trace'
  message: string
  timestamp: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  correlationId?: string
  component?: string
  action?: string
  duration?: number
  stack?: string
}

export interface LogContext {
  component?: string
  action?: string
  userId?: string
  correlationId?: string
  [key: string]: any
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 2000
  private sessionId: string
  private isProduction = import.meta.env.PROD

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createEntry(
    level: LogEntry['level'], 
    message: string, 
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context || {},
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      correlationId: context?.correlationId || this.generateCorrelationId(),
      component: context?.component,
      action: context?.action
    }

    if (error) {
      entry.stack = error.stack
      entry.context = {
        ...entry.context,
        errorName: error.name,
        errorMessage: error.message
      }
    }

    return entry
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Tentar obter do localStorage ou contexto de autenticação
      const authData = localStorage.getItem('supabase.auth.token')
      if (authData) {
        const parsed = JSON.parse(authData)
        return parsed?.user?.id
      }
    } catch {
      // Ignorar erros de parsing
    }
    return undefined
  }

  private formatMessage(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      entry.timestamp,
      entry.component ? `[${entry.component}]` : '',
      entry.action ? `(${entry.action})` : '',
      entry.correlationId ? `{${entry.correlationId}}` : '',
      entry.message
    ].filter(Boolean)
    
    return parts.join(' ')
  }

  private shouldLog(level: LogEntry['level']): boolean {
    if (this.isProduction) {
      return ['error', 'warn', 'info'].includes(level)
    }
    return true // Log tudo em desenvolvimento
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove o log mais antigo
    }
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return
    
    const entry = this.createEntry('info', message, this.mergeContext(context))
    this.addLog(entry)
    console.log(this.formatMessage(entry), entry.context)
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return
    
    const entry = this.createEntry('warn', message, this.mergeContext(context))
    this.addLog(entry)
    console.warn(this.formatMessage(entry), entry.context)
  }

  error(message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog('error')) return
    
    const entry = this.createEntry('error', message, this.mergeContext(context), error)
    this.addLog(entry)
    console.error(this.formatMessage(entry), entry.context, error)
    
    // Em produção, enviar para serviço de monitoramento
    if (this.isProduction) {
      this.sendToMonitoring(entry)
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return
    
    const entry = this.createEntry('debug', message, this.mergeContext(context))
    this.addLog(entry)
    console.debug(this.formatMessage(entry), entry.context)
  }

  trace(message: string, context?: LogContext) {
    if (!this.shouldLog('trace')) return
    
    const entry = this.createEntry('trace', message, this.mergeContext(context))
    this.addLog(entry)
    console.trace(this.formatMessage(entry), entry.context)
  }

  // Método para timing de operações
  time(label: string, context?: LogContext): () => void {
    const startTime = performance.now()
    const correlationId = context?.correlationId || this.generateCorrelationId()
    
    this.debug(`Timer started: ${label}`, { ...context, correlationId })
    
    return () => {
      const duration = performance.now() - startTime
      this.info(`Timer finished: ${label} (${duration.toFixed(2)}ms)`, {
        ...context,
        correlationId,
        duration
      })
    }
  }

  // Método para criar logger com contexto específico
  withContext(context: LogContext): Logger {
    const contextLogger = Object.create(this)
    contextLogger.defaultContext = context
    return contextLogger
  }

  private mergeContext(context?: LogContext): LogContext {
    return {
      ...((this as any).defaultContext || {}),
      ...context
    }
  }

  private async sendToMonitoring(entry: LogEntry) {
    try {
      // Implementar envio para serviço de monitoramento (Sentry, LogRocket, etc.)
      // Por enquanto, apenas armazenar localmente
      const errorLogs = JSON.parse(localStorage.getItem('error_logs') || '[]')
      errorLogs.push(entry)
      localStorage.setItem('error_logs', JSON.stringify(errorLogs.slice(-100)))
    } catch {
      // Ignorar erros de envio de logs
    }
  }

  // Método para obter logs recentes (útil para debugging)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  getLogs(level?: LogEntry['level'], component?: string): LogEntry[] {
    let filteredLogs = [...this.logs]
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    
    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component)
    }
    
    return filteredLogs
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogs('error')
  }

  // Método para limpar logs
  clearLogs() {
    this.logs = []
  }

  // Método para exportar logs para análise
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Método para estatísticas de logs
  getStats() {
    const stats = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: this.logs.length,
      byLevel: stats,
      sessionId: this.sessionId,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    }
  }
}

// Instância singleton do logger
export const logger = new Logger()

// Criar loggers específicos para componentes
export const authLogger = logger.withContext({ component: 'Auth' })
export const dbLogger = logger.withContext({ component: 'Database' })
export const apiLogger = logger.withContext({ component: 'API' })
export const uiLogger = logger.withContext({ component: 'UI' })

// Função helper para capturar erros não tratados
export const setupGlobalErrorHandling = () => {
  window.addEventListener('error', (event) => {
    logger.error('Erro JavaScript não tratado', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Promise rejeitada não tratada', {
      reason: event.reason
    })
  })
}