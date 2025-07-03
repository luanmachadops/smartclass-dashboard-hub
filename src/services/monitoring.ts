/**
 * Serviço de monitoramento de performance e erros
 * Integra com serviços externos como Sentry e métricas customizadas
 */

import { config } from '@/config/environment'
import { logger } from './logger'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface UserAction {
  action: string
  component: string
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private userActions: UserAction[] = []
  private performanceObserver?: PerformanceObserver
  private isInitialized = false

  init() {
    if (this.isInitialized) return
    
    logger.info('Inicializando serviço de monitoramento')
    
    // Configurar observador de performance
    this.setupPerformanceObserver()
    
    // Configurar captura de erros globais
    this.setupGlobalErrorHandling()
    
    // Configurar métricas de navegação
    this.setupNavigationMetrics()
    
    // Configurar Sentry se disponível
    this.setupSentry()
    
    this.isInitialized = true
    logger.info('Serviço de monitoramento inicializado')
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceObserver não suportado neste navegador')
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
      logger.error('Erro ao configurar PerformanceObserver', {}, error as Error)
    }
  }

  private setupGlobalErrorHandling() {
    // Capturar erros JavaScript
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'javascript'
      })
    })

    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: 'Unhandled Promise Rejection',
        error: event.reason,
        type: 'promise'
      })
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
            timestamp: Date.now()
          })

          this.recordMetric({
            name: 'page.dom_content_loaded',
            value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            timestamp: Date.now()
          })

          this.recordMetric({
            name: 'page.first_byte',
            value: navigation.responseStart - navigation.navigationStart,
            timestamp: Date.now()
          })
        }
      }, 0)
    })
  }

  private setupSentry() {
    if (!config.monitoring.sentryDsn) {
      logger.debug('Sentry DSN não configurado, pulando inicialização')
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
    
    logger.info('Sentry configurado (implementação pendente)')
  }

  // Registrar métrica de performance
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Manter apenas as últimas 1000 métricas
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }

    if (config.isDevelopment) {
      logger.debug('Métrica registrada', metric)
    }
  }

  // Registrar ação do usuário
  recordUserAction(action: UserAction) {
    this.userActions.push(action)
    
    // Manter apenas as últimas 500 ações
    if (this.userActions.length > 500) {
      this.userActions.shift()
    }

    logger.debug('Ação do usuário registrada', action)
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
    
    logger.debug('Evento registrado', eventData)
    
    // Registrar como ação do usuário para manter compatibilidade
    this.recordUserAction({
      action: event.name,
      component: 'system',
      timestamp: eventData.timestamp,
      metadata: event.properties
    })
  }

  // Registrar erro
  recordError(errorInfo: {
    message: string
    filename?: string
    lineno?: number
    colno?: number
    error?: Error
    type: 'javascript' | 'promise' | 'api' | 'custom'
    context?: Record<string, any>
  }) {
    logger.error('Erro capturado pelo monitoramento', {
      type: errorInfo.type,
      message: errorInfo.message,
      filename: errorInfo.filename,
      line: errorInfo.lineno,
      column: errorInfo.colno,
      context: errorInfo.context
    }, errorInfo.error)

    // TODO: Enviar para Sentry
    // if (config.monitoring.sentryDsn) {
    //   Sentry.captureException(errorInfo.error || new Error(errorInfo.message), {
    //     contexts: {
    //       custom: errorInfo.context
    //     },
    //     tags: {
    //       type: errorInfo.type
    //     }
    //   })
    // }
  }

  // Medir tempo de execução de uma função
  async measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, status: 'success' }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, status: 'error' }
      })
      
      this.recordError({
        message: `Erro na função ${name}`,
        error: error as Error,
        type: 'custom',
        context: { functionName: name, tags }
      })
      
      throw error
    }
  }

  // Medir tempo de execução de uma função síncrona
  measure<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const startTime = performance.now()
    
    try {
      const result = fn()
      const duration = performance.now() - startTime
      
      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, status: 'success' }
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.recordMetric({
        name: `function.${name}`,
        value: duration,
        timestamp: Date.now(),
        tags: { ...tags, status: 'error' }
      })
      
      this.recordError({
        message: `Erro na função ${name}`,
        error: error as Error,
        type: 'custom',
        context: { functionName: name, tags }
      })
      
      throw error
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

  // Obter estatísticas de performance
  getPerformanceStats() {
    const recentMetrics = this.getRecentMetrics()
    
    const stats = {
      totalMetrics: this.metrics.length,
      totalUserActions: this.userActions.length,
      averageLoadTime: 0,
      averageApiResponseTime: 0,
      errorRate: 0
    }

    // Calcular tempo médio de carregamento
    const loadTimeMetrics = recentMetrics.filter(m => m.name === 'page.load_time')
    if (loadTimeMetrics.length > 0) {
      stats.averageLoadTime = loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length
    }

    // Calcular tempo médio de resposta da API
    const apiMetrics = recentMetrics.filter(m => m.name.startsWith('api.'))
    if (apiMetrics.length > 0) {
      stats.averageApiResponseTime = apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
    }

    return stats
  }

  // Limpar dados antigos
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
    this.userActions = this.userActions.filter(a => a.timestamp > oneHourAgo)
    
    logger.debug('Limpeza de dados de monitoramento concluída')
  }

  // Destruir o serviço
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
    
    this.metrics = []
    this.userActions = []
    this.isInitialized = false
    
    logger.info('Serviço de monitoramento destruído')
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