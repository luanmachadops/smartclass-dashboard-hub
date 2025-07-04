import { logger } from './logger';
import { auditService, AuditAction } from './auditService';

// Tipos para monitoramento de performance
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: PerformanceCategory;
  tags?: Record<string, string>;
}

export interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
}

export interface PerformanceReport {
  period: {
    start: number;
    end: number;
  };
  metrics: PerformanceMetric[];
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
}

export interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: number;
}

export enum PerformanceCategory {
  RESPONSE_TIME = 'RESPONSE_TIME',
  MEMORY_USAGE = 'MEMORY_USAGE',
  CPU_USAGE = 'CPU_USAGE',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  USER_INTERACTION = 'USER_INTERACTION',
  RENDERING = 'RENDERING',
  BUNDLE_SIZE = 'BUNDLE_SIZE',
  CORE_WEB_VITALS = 'CORE_WEB_VITALS'
}

export interface PerformanceConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  enableAutoOptimization: boolean;
  sampleRate: number; // 0-1
  bufferSize: number;
  reportInterval: number; // em ms
  enableWebVitals: boolean;
  enableResourceTiming: boolean;
  enableUserTiming: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private alerts: PerformanceAlert[] = [];
  private reportTimer?: NodeJS.Timeout;

  private constructor() {
    this.config = {
      enableMetrics: true,
      enableAlerts: true,
      enableAutoOptimization: false,
      sampleRate: 0.1, // 10% das requisições
      bufferSize: 1000,
      reportInterval: 60000, // 1 minuto
      enableWebVitals: true,
      enableResourceTiming: true,
      enableUserTiming: true
    };

    this.initializeThresholds();
    this.initializeObservers();
    this.startReporting();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeThresholds(): void {
    // Thresholds padrão
    this.thresholds.set('response_time', {
      metric: 'response_time',
      warning: 1000, // 1s
      critical: 3000, // 3s
      unit: 'ms'
    });

    this.thresholds.set('memory_usage', {
      metric: 'memory_usage',
      warning: 50, // 50MB
      critical: 100, // 100MB
      unit: 'MB'
    });

    this.thresholds.set('error_rate', {
      metric: 'error_rate',
      warning: 5, // 5%
      critical: 10, // 10%
      unit: '%'
    });

    this.thresholds.set('lcp', {
      metric: 'lcp', // Largest Contentful Paint
      warning: 2500,
      critical: 4000,
      unit: 'ms'
    });

    this.thresholds.set('fid', {
      metric: 'fid', // First Input Delay
      warning: 100,
      critical: 300,
      unit: 'ms'
    });

    this.thresholds.set('cls', {
      metric: 'cls', // Cumulative Layout Shift
      warning: 0.1,
      critical: 0.25,
      unit: 'score'
    });
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Observer para Core Web Vitals
    if (this.config.enableWebVitals && 'PerformanceObserver' in window) {
      this.initializeCoreWebVitalsObserver();
      this.initializeResourceTimingObserver();
      this.initializeNavigationTimingObserver();
    }
  }

  private initializeCoreWebVitalsObserver(): void {
    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          this.recordMetric({
            name: 'lcp',
            value: lastEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.CORE_WEB_VITALS
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: 'fid',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.CORE_WEB_VITALS
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric({
          name: 'cls',
          value: clsValue,
          unit: 'score',
          timestamp: Date.now(),
          category: PerformanceCategory.CORE_WEB_VITALS
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

    } catch (error) {
      logger.warn('Failed to initialize Core Web Vitals observer', 'PerformanceMonitor', { error });
    }
  }

  private initializeResourceTimingObserver(): void {
    if (!this.config.enableResourceTiming) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: 'resource_load_time',
            value: entry.responseEnd - entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.NETWORK,
            tags: {
              resource: entry.name,
              type: entry.initiatorType
            }
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      logger.warn('Failed to initialize resource timing observer', 'PerformanceMonitor', { error });
    }
  }

  private initializeNavigationTimingObserver(): void {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // DOM Content Loaded
          this.recordMetric({
            name: 'dom_content_loaded',
            value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.RENDERING
          });

          // Page Load Time
          this.recordMetric({
            name: 'page_load_time',
            value: entry.loadEventEnd - entry.loadEventStart,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.RENDERING
          });

          // DNS Lookup Time
          this.recordMetric({
            name: 'dns_lookup_time',
            value: entry.domainLookupEnd - entry.domainLookupStart,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.NETWORK
          });

          // TCP Connection Time
          this.recordMetric({
            name: 'tcp_connection_time',
            value: entry.connectEnd - entry.connectStart,
            unit: 'ms',
            timestamp: Date.now(),
            category: PerformanceCategory.NETWORK
          });
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navigationObserver);
    } catch (error) {
      logger.warn('Failed to initialize navigation timing observer', 'PerformanceMonitor', { error });
    }
  }

  // Registrar métrica
  recordMetric(metric: PerformanceMetric): void {
    if (!this.config.enableMetrics) return;

    // Sampling
    if (Math.random() > this.config.sampleRate) return;

    this.metrics.push(metric);

    // Verificar thresholds
    this.checkThresholds(metric);

    // Limitar buffer
    if (this.metrics.length > this.config.bufferSize) {
      this.metrics = this.metrics.slice(-this.config.bufferSize);
    }

    logger.debug('Performance metric recorded', 'PerformanceMonitor', { metric });
  }

  // Verificar thresholds
  private checkThresholds(metric: PerformanceMetric): void {
    if (!this.config.enableAlerts) return;

    const threshold = this.thresholds.get(metric.name);
    if (!threshold) return;

    let severity: 'WARNING' | 'CRITICAL' | null = null;
    let thresholdValue = 0;

    if (metric.value >= threshold.critical) {
      severity = 'CRITICAL';
      thresholdValue = threshold.critical;
    } else if (metric.value >= threshold.warning) {
      severity = 'WARNING';
      thresholdValue = threshold.warning;
    }

    if (severity) {
      const alert: PerformanceAlert = {
        metric: metric.name,
        value: metric.value,
        threshold: thresholdValue,
        severity,
        message: `${metric.name} (${metric.value}${metric.unit}) exceeded ${severity.toLowerCase()} threshold (${thresholdValue}${metric.unit})`,
        timestamp: Date.now()
      };

      this.alerts.push(alert);
      logger.warn('Performance threshold exceeded', 'PerformanceMonitor', { alert });

      // Auditoria para alertas críticos
      if (severity === 'CRITICAL') {
        auditService.logSystemEvent(
          `Performance critical alert: ${alert.message}`,
          { alert, metric }
        );
      }
    }
  }

  // Iniciar timer
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // Finalizar timer e registrar métrica
  endTimer(name: string, category: PerformanceCategory = PerformanceCategory.RESPONSE_TIME, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer '${name}' not found`, 'PerformanceMonitor');
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      category,
      tags
    });

    return duration;
  }

  // Incrementar contador
  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  // Obter valor do contador
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  // Resetar contador
  resetCounter(name: string): void {
    this.counters.set(name, 0);
  }

  // Medir uso de memória
  measureMemoryUsage(): void {
    if (typeof window === 'undefined' || !(window as any).performance?.memory) return;

    const memory = (window as any).performance.memory;
    
    this.recordMetric({
      name: 'memory_used',
      value: memory.usedJSHeapSize / 1024 / 1024, // MB
      unit: 'MB',
      timestamp: Date.now(),
      category: PerformanceCategory.MEMORY_USAGE
    });

    this.recordMetric({
      name: 'memory_total',
      value: memory.totalJSHeapSize / 1024 / 1024, // MB
      unit: 'MB',
      timestamp: Date.now(),
      category: PerformanceCategory.MEMORY_USAGE
    });

    this.recordMetric({
      name: 'memory_limit',
      value: memory.jsHeapSizeLimit / 1024 / 1024, // MB
      unit: 'MB',
      timestamp: Date.now(),
      category: PerformanceCategory.MEMORY_USAGE
    });
  }

  // Medir tempo de renderização de componente
  measureComponentRender(componentName: string, renderFunction: () => void): void {
    const startTime = performance.now();
    renderFunction();
    const endTime = performance.now();

    this.recordMetric({
      name: 'component_render_time',
      value: endTime - startTime,
      unit: 'ms',
      timestamp: Date.now(),
      category: PerformanceCategory.RENDERING,
      tags: { component: componentName }
    });
  }

  // Medir tempo de requisição de API
  async measureApiRequest<T>(name: string, requestFunction: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let error: any = null;

    try {
      const result = await requestFunction();
      return result;
    } catch (err) {
      success = false;
      error = err;
      throw err;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: 'api_request_time',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        category: PerformanceCategory.NETWORK,
        tags: {
          endpoint: name,
          success: success.toString()
        }
      });

      // Incrementar contadores
      this.incrementCounter('api_requests_total');
      if (success) {
        this.incrementCounter('api_requests_success');
      } else {
        this.incrementCounter('api_requests_error');
      }
    }
  }

  // Gerar relatório de performance
  generateReport(periodMs: number = 3600000): PerformanceReport { // 1 hora por padrão
    const now = Date.now();
    const start = now - periodMs;
    
    const periodMetrics = this.metrics.filter(m => m.timestamp >= start && m.timestamp <= now);
    const periodAlerts = this.alerts.filter(a => a.timestamp >= start && a.timestamp <= now);

    // Calcular estatísticas
    const responseTimeMetrics = periodMetrics.filter(m => m.category === PerformanceCategory.RESPONSE_TIME);
    const averageResponseTime = responseTimeMetrics.length > 0 
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length 
      : 0;

    const totalRequests = this.getCounter('api_requests_total');
    const successfulRequests = this.getCounter('api_requests_success');
    const errorRate = totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0;
    const throughput = totalRequests / (periodMs / 1000); // requests per second

    const memoryMetrics = periodMetrics.filter(m => m.name === 'memory_used');
    const averageMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : 0;

    // Gerar recomendações
    const recommendations: string[] = [];
    
    if (averageResponseTime > 1000) {
      recommendations.push('Considere implementar cache para reduzir tempo de resposta');
    }
    
    if (errorRate > 5) {
      recommendations.push('Taxa de erro elevada - verifique logs de erro e implemente retry logic');
    }
    
    if (averageMemoryUsage > 50) {
      recommendations.push('Uso de memória elevado - considere otimizar componentes e implementar lazy loading');
    }
    
    if (periodAlerts.filter(a => a.severity === 'CRITICAL').length > 0) {
      recommendations.push('Alertas críticos detectados - revisar imediatamente');
    }

    return {
      period: { start, end: now },
      metrics: periodMetrics,
      summary: {
        averageResponseTime,
        totalRequests,
        errorRate,
        throughput,
        memoryUsage: averageMemoryUsage,
        cpuUsage: 0 // Não disponível no browser
      },
      alerts: periodAlerts,
      recommendations
    };
  }

  // Iniciar relatórios automáticos
  private startReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(() => {
      const report = this.generateReport();
      
      // Log do relatório
      logger.info('Performance report generated', 'PerformanceMonitor', {
        summary: report.summary,
        alertsCount: report.alerts.length,
        metricsCount: report.metrics.length
      });

      // Medir uso de memória periodicamente
      this.measureMemoryUsage();

      // Limpar alertas antigos
      const oneHourAgo = Date.now() - 3600000;
      this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);

    }, this.config.reportInterval);
  }

  // Configuração
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reiniciar relatórios se o intervalo mudou
    if (config.reportInterval) {
      this.startReporting();
    }
    
    logger.info('Performance monitor config updated', 'PerformanceMonitor', { config });
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Gerenciar thresholds
  setThreshold(metric: string, threshold: PerformanceThreshold): void {
    this.thresholds.set(metric, threshold);
    logger.info(`Performance threshold set for ${metric}`, 'PerformanceMonitor', { threshold });
  }

  getThreshold(metric: string): PerformanceThreshold | undefined {
    return this.thresholds.get(metric);
  }

  getAllThresholds(): PerformanceThreshold[] {
    return Array.from(this.thresholds.values());
  }

  // Obter métricas
  getMetrics(category?: PerformanceCategory, limit?: number): PerformanceMetric[] {
    let filtered = category 
      ? this.metrics.filter(m => m.category === category)
      : this.metrics;
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  // Obter alertas
  getAlerts(severity?: 'WARNING' | 'CRITICAL', limit?: number): PerformanceAlert[] {
    let filtered = severity 
      ? this.alerts.filter(a => a.severity === severity)
      : this.alerts;
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    
    return filtered;
  }

  // Limpar dados
  clearMetrics(): void {
    this.metrics = [];
    logger.info('Performance metrics cleared', 'PerformanceMonitor');
  }

  clearAlerts(): void {
    this.alerts = [];
    logger.info('Performance alerts cleared', 'PerformanceMonitor');
  }

  clearCounters(): void {
    this.counters.clear();
    logger.info('Performance counters cleared', 'PerformanceMonitor');
  }

  // Cleanup
  destroy(): void {
    // Parar observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();

    // Parar timer de relatórios
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined;
    }

    // Limpar dados
    this.clearMetrics();
    this.clearAlerts();
    this.clearCounters();
    this.timers.clear();

    logger.info('Performance monitor destroyed', 'PerformanceMonitor');
  }
}

// Instância singleton
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook para usar o monitor de performance em componentes React
export function usePerformanceMonitor() {
  return performanceMonitor;
}

// Decorator para medir performance de métodos automaticamente
export function measurePerformance(category: PerformanceCategory = PerformanceCategory.RESPONSE_TIME) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const timerName = `${target.constructor.name}.${propertyName}`;
      performanceMonitor.startTimer(timerName);

      try {
        const result = method.apply(this, args);
        
        // Se for uma Promise, aguardar conclusão
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            performanceMonitor.endTimer(timerName, category);
          });
        } else {
          performanceMonitor.endTimer(timerName, category);
          return result;
        }
      } catch (error) {
        performanceMonitor.endTimer(timerName, category);
        throw error;
      }
    };
  };
}

// Função utilitária para medir performance de funções
export async function measureFunction<T>(
  name: string,
  fn: () => T | Promise<T>,
  category: PerformanceCategory = PerformanceCategory.RESPONSE_TIME
): Promise<T> {
  performanceMonitor.startTimer(name);
  
  try {
    const result = await fn();
    return result;
  } finally {
    performanceMonitor.endTimer(name, category);
  }
}

export default performanceMonitor;