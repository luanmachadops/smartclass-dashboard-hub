/**
 * Serviço de logging estruturado para a aplicação
 * Centraliza todos os logs e permite fácil integração com serviços de monitoramento
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  stack?: string
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Manter apenas os últimos 1000 logs em memória

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      stack: error?.stack
    }
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift() // Remove o log mais antigo
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toLocaleTimeString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level}] ${message}${contextStr}`
  }

  error(message: string, context?: LogContext, error?: Error) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    this.addLog(entry)
    
    if (this.isDevelopment) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context), error)
    }
    
    // Em produção, enviar para serviço de monitoramento (Sentry, etc.)
    this.sendToMonitoring(entry)
  }

  warn(message: string, context?: LogContext) {
    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.addLog(entry)
    
    if (this.isDevelopment) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context))
    }
  }

  info(message: string, context?: LogContext) {
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.addLog(entry)
    
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.INFO, message, context))
    }
  }

  debug(message: string, context?: LogContext) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.addLog(entry)
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  // Método para obter logs recentes (útil para debugging)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  // Método para limpar logs
  clearLogs() {
    this.logs = []
  }

  private sendToMonitoring(entry: LogEntry) {
    // TODO: Implementar integração com Sentry ou outro serviço de monitoramento
    // if (import.meta.env.PROD && entry.level === LogLevel.ERROR) {
    //   Sentry.captureException(new Error(entry.message), {
    //     contexts: { custom: entry.context },
    //     level: 'error'
    //   })
    // }
  }
}

// Instância singleton do logger
export const logger = new Logger()

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