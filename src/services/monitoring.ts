/**
 * Serviço de monitoramento de performance e erros
 * Integra com serviços externos como Sentry e métricas customizadas
 */

import { config } from '@/config/environment'
import { authLogger } from './logger'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  unit?: 'ms' | 'bytes' | 'count' | 'percent'
}

interface ErrorMetric {
  error: Error
  context: string
  timestamp: number
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
}

interface UserAction {
  action: string
  component: string
  timestamp: number
  userId?: string
  sessionId?: string
  duration?: number
  success: boolean
  metadata?: Record<string, any>
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorMetric[] = []
  private userActions: UserAction[] = []
  private performanceObserver?: PerformanceObserver
  private isInitialized = false
  private sessionId: string
  private maxMetrics = 1000
  private retryAttempts = new Map<string, number>()
  
  constructor() {
    this.sessionId = this.generateSessionId()
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  init() {
    if (this.isInitialized) return
    
    authLogger.info('Inicializando serviço de monitoramento', {
      action: 'monitoring_init',
      sessionId: this.sessionId
    })
    
    // Configurar observador de performance
    this.setupPerformanceObserver()
    
    // Configurar captura de erros globais
    this.setupGlobalErrorHandling()
    
    // Configurar métricas de navegação
    this.setupNavigationMetrics()
    
    // Configurar Sentry se disponível
    this.setupSentry()
    
    this.isInitialized = true
    this.setupAlerts()
    authLogger.info('Serviço de monitoramento inicializado', {
      action: 'monitoring_init',
      sessionId: this.sessionId
    })
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) {
      authLogger.warn('PerformanceObserver não suportado neste navegador', {
        action: 'setupPerformanceObserver'
      })
      return
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: `performance.${entry.entryType}`,
            value: entry.duration || entry.startTime,
            timestamp: Date.now(),
            tags: {
              entryType: entry.entryType,
              name: entry.name
            }
          })
        }
      })

      // Observar diferentes tipos de métricas
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] })
    } catch (error) {
      authLogger.error('Erro ao configurar PerformanceObserver', {
        action: 'setupPerformanceObserver'
      }, error as Error)
    }
  }

  private setupGlobalErrorHandling() {
    // Capturar erros JavaScript
    window.addEventListener('error', (event) => {
      this.recordErrorMetric(
        event.error || new Error(event.message),
        'global_error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      )
    })

    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.recordErrorMetric(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'unhandled_promise_rejection'
      )
    })
  }

  private setupNavigationMetrics() {
    // Métricas de carregamento da página
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          this.recordMetric({
            name: 'page.load_time',
            value: navigation.loadEventEnd - navigation.navigationStart,
            timestamp: Date.now(),
            unit: 'ms'
          })

          this.recordMetric({
            name: 'page.dom_content_loaded',
            value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            timestamp: Date.now(),
            unit: 'ms'
          })

          this.recordMetric({
            name: 'page.first_byte',
            value: navigation.responseStart - navigation.navigationStart,
            timestamp: Date.now(),
            unit: 'ms'
          })
        }
      }, 0)
    })
  }

  private setupSentry() {
    if (!config.monitoring.sentryDsn) {
      authLogger.debug('Sentry DSN não configurado, pulando inicialização')
      return
    }

    // TODO: Implementar integração com Sentry
    // import * as Sentry from '@sentry/react'
    // 
    // Sentry.init({
    //   dsn: config.monitoring.sentryDsn,
    //   environment: config.mode,
    //   sampleRate: config.monitoring.sampleRate,
    //   tracesSampleRate: config.monitoring.enablePerformanceMonitoring ? 0.1 : 0,
    // })
    
    authLogger.info('Sentry configurado (implementação pendente)', {
      action: 'setupSentry'
    })
  }

  // Registrar métrica de performance
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    this.trimMetrics()

    if (config.isDevelopment) {
      authLogger.trace('Métrica registrada', {
        action: 'recordMetric',
        metric: metric.name,
        value: metric.value,
        unit: metric.unit
      })
    }
  }
  
  // Registrar erro
  recordErrorMetric(
    error: Error,
    context: string,
    metadata: Record<string, any> = {}
  ): void {
    const errorMetric: ErrorMetric = {
      error,
      context,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...metadata
    }
    
    this.errors.push(errorMetric)
    this.trimErrors()
    
    authLogger.error('Erro registrado no monitoramento', {
      action: 'recordError',
      context,
      sessionId: this.sessionId
    }, error)
  }

  // Registrar ação do usuário
  recordUserAction(
    action: string,
    component: string,
    options: {
      duration?: number
      success?: boolean
      metadata?: Record<string, any>
    } = {}
  ): void {
    const userAction: UserAction = {
      action,
      component,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      duration: options.duration,
      success: options.success ?? true,
      metadata: options.metadata
    }
    
    this.userActions.push(userAction)
    this.trimUserActions()

    authLogger.trace('Ação do usuário registrada', {
      action: 'recordUserAction',
      userAction: action,
      component,
      success: userAction.success
    })
  }

  // Registrar evento customizado
  recordEvent(event: {
    name: string
    properties?: Record<string, any>
    timestamp?: number
  }) {
    const eventData = {
      ...event,
      timestamp: event.timestamp || Date.now()
    }
    
    authLogger.debug('Evento registrado', eventData)
    
    // Registrar como ação do usuário para manter compatibilidade
    this.recordUserAction({
      action: event.name,
      component: 'system',
      timestamp: eventData.timestamp,
      metadata: event.properties
    })
  }

  // Métodos auxiliares para controle de memória
  private trimMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }
  
  private trimErrors(): void {
    if (this.errors.length > this.maxMetrics) {
      this.errors = this.errors.slice(-this.maxMetrics)
    }
  }
  
  private trimUserActions(): void {
    if (this.userActions.length > this.maxMetrics) {
      this.userActions = this.userActions.slice(-this.maxMetrics)
    }
  }
  
  private getCurrentUserId(): string | undefined {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        return user.id
      }
    } catch {
      // Ignorar erros
    }
    return undefined
  }
  
  // Configurar alertas para métricas críticas
  private setupAlerts(): void {
    // Alertar se muitos erros em pouco tempo
    setInterval(() => {
      const recentErrors = this.errors.filter(e => Date.now() - e.timestamp < 5 * 60 * 1000) // 5 minutos
      if (recentErrors.length > 10) {
        authLogger.warn('Muitos erros detectados recentemente', {
          action: 'errorAlert',
          errorCount: recentErrors.length,
          timeWindow: '5min'
        })
      }
    }, 60 * 1000) // Verificar a cada minuto
    
    // Alertar se performance está degradada
    setInterval(() => {
      const recentMetrics = this.metrics.filter(m => 
        m.name.includes('duration') && 
        Date.now() - m.timestamp < 10 * 60 * 1000 // 10 minutos
      )
      
      if (recentMetrics.length > 0) {
        const avgDuration = recentMetrics.reduce((a, b) => a + b.value, 0) / recentMetrics.length
        if (avgDuration > 5000) { // 5 segundos
          authLogger.warn('Performance degradada detectada', {
            action: 'performanceAlert',
            avgDuration,
            metricCount: recentMetrics.length
          })
        }
      }
    }, 2 * 60 * 1000) // Verificar a cada 2 minutos
  }
  
  // Registrar erro (método legado para compatibilidade)
  recordError(errorInfo: {
    message: string
    filename?: string
    lineno?: number
    colno?: number
    error?: Error
    type: 'javascript' | 'promise' | 'api' | 'custom'
    context?: Record<string, any>
  }) {
    const error = errorInfo.error || new Error(errorInfo.message)
    this.recordErrorMetric(error, errorInfo.type, errorInfo.context)
  }

  // Medir tempo de execução de uma função assíncrona
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now()
    let success = true
    let error: Error | undefined
    
    try {
      const result = await fn()
      return result
    } catch (err) {
      success = false
      error = err as Error
      throw err
    } finally {
      const duration = performance.now() - startTime
      this.recordMetric({
        name: `${name}_duration`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, success: String(success) },
        unit: 'ms'
      })
      
      if (error) {
        this.recordErrorMetric(error, `measure_${name}`)
      }
    }
  }

  // Medir tempo de execução síncrono
  measure<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const startTime = performance.now()
    let success = true
    let error: Error | undefined
    
    try {
      const result = fn()
      return result
    } catch (err) {
      success = false
      error = err as Error
      throw err
    } finally {
      const duration = performance.now() - startTime
      this.recordMetric({
        name: `${name}_duration`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, success: String(success) },
        unit: 'ms'
      })
      
      if (error) {
        this.recordErrorMetric(error, `measure_${name}`)
      }
    }
  }

  // Obter métricas recentes
  getRecentMetrics(count: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-count)
  }

  // Obter ações recentes do usuário
  getRecentUserActions(count: number = 50): UserAction[] {
    return this.userActions.slice(-count)
  }

  // Obter estatísticas completas
  getStats(): {
    metrics: PerformanceMetric[]
    errors: ErrorMetric[]
    userActions: UserAction[]
    summary: {
      totalMetrics: number
      totalErrors: number
      totalUserActions: number
      sessionId: string
      sessionDuration: number
    }
  } {
    const now = Date.now()
    const sessionStart = Math.min(
      ...this.metrics.map(m => m.timestamp),
      ...this.errors.map(e => e.timestamp),
      ...this.userActions.map(a => a.timestamp)
    )
    
    return {
      metrics: [...this.metrics],
      errors: [...this.errors],
      userActions: [...this.userActions],
      summary: {
        totalMetrics: this.metrics.length,
        totalErrors: this.errors.length,
        totalUserActions: this.userActions.length,
        sessionId: this.sessionId,
        sessionDuration: sessionStart ? now - sessionStart : 0
      }
    }
  }
  
  // Obter estatísticas de performance
  getPerformanceStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { values: number[]; unit?: string }> = {}
    
    // Agrupar métricas por nome
    this.metrics.forEach(metric => {
      if (!stats[metric.name]) {
        stats[metric.name] = { values: [], unit: metric.unit }
      }
      stats[metric.name].values.push(metric.value)
    })
    
    // Calcular estatísticas
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    Object.entries(stats).forEach(([name, data]) => {
      const values = data.values
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    })
    
    return result
  }

  // Exportar dados para análise
  exportData(): string {
    const data = {
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      performanceStats: this.getPerformanceStats()
    }
    
    return JSON.stringify(data, null, 2)
  }
  
  // Limpar dados antigos
  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 horas
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.errors = this.errors.filter(e => e.timestamp > cutoff)
    this.userActions = this.userActions.filter(a => a.timestamp > cutoff)
    
    authLogger.trace('Limpeza de dados de monitoramento concluída', {
      action: 'cleanup',
      cutoffTime: new Date(cutoff).toISOString()
    })
  }

  // Destruir o serviço
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    
    this.metrics = []
    this.errors = []
    this.userActions = []
    this.isInitialized = false
    
    authLogger.info('Serviço de monitoramento destruído', {
      action: 'destroy',
      sessionId: this.sessionId
    })
  }
}

// Instância singleton
export const monitoring = new MonitoringService()

// Hook para React components
export const useMonitoring = () => {
  return {
    recordUserAction: (action: string, component: string, metadata?: Record<string, any>) => {
      monitoring.recordUserAction({
        action,
        component,
        timestamp: Date.now(),
        metadata
      })
    },
    recordError: (error: Error, context?: Record<string, any>) => {
      monitoring.recordError({
        message: error.message,
        error,
        type: 'custom',
        context
      })
    },
    measureAsync: monitoring.measureAsync.bind(monitoring),
    measure: monitoring.measure.bind(monitoring)
  }
}