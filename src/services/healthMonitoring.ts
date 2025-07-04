import { supabase } from '@/integrations/supabase/client';
import { authLogger } from './logger';

/**
 * Status de saúde do sistema
 */
export interface HealthStatus {
  database: 'healthy' | 'degraded' | 'down';
  auth: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  overall: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errors: string[];
}

/**
 * Métricas de performance
 */
export interface PerformanceMetrics {
  databaseResponseTime: number;
  authResponseTime: number;
  storageResponseTime: number;
  totalRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
}

/**
 * Configurações de monitoramento
 */
export interface MonitoringConfig {
  checkInterval: number; // em ms
  timeout: number; // em ms
  retryAttempts: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
  };
}

const DEFAULT_CONFIG: MonitoringConfig = {
  checkInterval: 30000, // 30 segundos
  timeout: 5000, // 5 segundos
  retryAttempts: 3,
  alertThresholds: {
    responseTime: 2000, // 2 segundos
    errorRate: 0.1 // 10%
  }
};

/**
 * Classe para monitoramento de saúde do sistema
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private config: MonitoringConfig;
  private metrics: PerformanceMetrics;
  private currentStatus: HealthStatus;
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((status: HealthStatus) => void)[] = [];
  
  private constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      databaseResponseTime: 0,
      authResponseTime: 0,
      storageResponseTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      successRate: 100,
      averageResponseTime: 0
    };
    this.currentStatus = {
      database: 'healthy',
      auth: 'healthy',
      storage: 'healthy',
      overall: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errors: []
    };
  }
  
  static getInstance(config?: Partial<MonitoringConfig>): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor(config);
    }
    return HealthMonitor.instance;
  }
  
  /**
   * Inicia o monitoramento automático
   */
  startMonitoring(): void {
    if (this.intervalId) {
      this.stopMonitoring();
    }
    
    authLogger.info('Iniciando monitoramento de saúde do sistema');
    
    // Primeira verificação imediata
    this.performHealthCheck();
    
    // Verificações periódicas
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
  }
  
  /**
   * Para o monitoramento automático
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      authLogger.info('Monitoramento de saúde parado');
    }
  }
  
  /**
   * Adiciona listener para mudanças de status
   */
  addStatusListener(listener: (status: HealthStatus) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove listener
   */
  removeStatusListener(listener: (status: HealthStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Executa verificação completa de saúde
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      authLogger.info('Iniciando verificação de saúde do sistema');
      
      // Verificar banco de dados
      const dbStatus = await this.checkDatabase();
      
      // Verificar autenticação
      const authStatus = await this.checkAuth();
      
      // Verificar storage
      const storageStatus = await this.checkStorage();
      
      const responseTime = Date.now() - startTime;
      
      // Determinar status geral
      const overall = this.determineOverallStatus([dbStatus, authStatus, storageStatus]);
      
      this.currentStatus = {
        database: dbStatus,
        auth: authStatus,
        storage: storageStatus,
        overall,
        lastCheck: new Date(),
        responseTime,
        errors
      };
      
      // Atualizar métricas
      this.updateMetrics(responseTime, errors.length === 0);
      
      // Notificar listeners
      this.notifyListeners();
      
      // Log do resultado
      authLogger.info('Verificação de saúde concluída', {
        status: overall,
        responseTime,
        database: dbStatus,
        auth: authStatus,
        storage: storageStatus
      });
      
      return this.currentStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      errors.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      this.currentStatus = {
        database: 'down',
        auth: 'down',
        storage: 'down',
        overall: 'down',
        lastCheck: new Date(),
        responseTime,
        errors
      };
      
      this.updateMetrics(responseTime, false);
      this.notifyListeners();
      
      authLogger.error('Falha na verificação de saúde', {
        responseTime,
        errors
      }, error as Error);
      
      return this.currentStatus;
    }
  }
  
  /**
   * Verifica saúde do banco de dados
   */
  private async checkDatabase(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const startTime = Date.now();
      
      // Teste simples de conectividade
      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      this.metrics.databaseResponseTime = responseTime;
      
      if (error) {
        authLogger.warn('Erro na verificação do banco de dados', { error: error.message });
        return 'degraded';
      }
      
      if (responseTime > this.config.alertThresholds.responseTime) {
        authLogger.warn('Banco de dados com resposta lenta', { responseTime });
        return 'degraded';
      }
      
      return 'healthy';
    } catch (error) {
      authLogger.error('Banco de dados inacessível', {}, error as Error);
      return 'down';
    }
  }
  
  /**
   * Verifica saúde da autenticação
   */
  private async checkAuth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const startTime = Date.now();
      
      // Verificar se consegue acessar informações do usuário atual
      const { data, error } = await supabase.auth.getUser();
      
      const responseTime = Date.now() - startTime;
      this.metrics.authResponseTime = responseTime;
      
      if (error && error.message !== 'Invalid JWT') {
        authLogger.warn('Erro na verificação de autenticação', { error: error.message });
        return 'degraded';
      }
      
      if (responseTime > this.config.alertThresholds.responseTime) {
        authLogger.warn('Autenticação com resposta lenta', { responseTime });
        return 'degraded';
      }
      
      return 'healthy';
    } catch (error) {
      authLogger.error('Sistema de autenticação inacessível', {}, error as Error);
      return 'down';
    }
  }
  
  /**
   * Verifica saúde do storage
   */
  private async checkStorage(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const startTime = Date.now();
      
      // Verificar se consegue listar buckets
      const { data, error } = await supabase.storage.listBuckets();
      
      const responseTime = Date.now() - startTime;
      this.metrics.storageResponseTime = responseTime;
      
      if (error) {
        authLogger.warn('Erro na verificação do storage', { error: error.message });
        return 'degraded';
      }
      
      if (responseTime > this.config.alertThresholds.responseTime) {
        authLogger.warn('Storage com resposta lenta', { responseTime });
        return 'degraded';
      }
      
      return 'healthy';
    } catch (error) {
      authLogger.error('Sistema de storage inacessível', {}, error as Error);
      return 'down';
    }
  }
  
  /**
   * Determina status geral baseado nos componentes
   */
  private determineOverallStatus(statuses: ('healthy' | 'degraded' | 'down')[]): 'healthy' | 'degraded' | 'down' {
    if (statuses.some(status => status === 'down')) {
      return 'down';
    }
    if (statuses.some(status => status === 'degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }
  
  /**
   * Atualiza métricas de performance
   */
  private updateMetrics(responseTime: number, success: boolean): void {
    this.metrics.totalRequests++;
    
    if (!success) {
      this.metrics.failedRequests++;
    }
    
    this.metrics.successRate = ((this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests) * 100;
    
    // Calcular média móvel do tempo de resposta
    this.metrics.averageResponseTime = (
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests
    );
  }
  
  /**
   * Notifica todos os listeners sobre mudança de status
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        authLogger.error('Erro ao notificar listener de status', {}, error as Error);
      }
    });
  }
  
  /**
   * Obtém status atual
   */
  getCurrentStatus(): HealthStatus {
    return { ...this.currentStatus };
  }
  
  /**
   * Obtém métricas atuais
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Verifica se o sistema está saudável
   */
  isHealthy(): boolean {
    return this.currentStatus.overall === 'healthy';
  }
  
  /**
   * Verifica se há degradação
   */
  isDegraded(): boolean {
    return this.currentStatus.overall === 'degraded';
  }
  
  /**
   * Verifica se o sistema está fora do ar
   */
  isDown(): boolean {
    return this.currentStatus.overall === 'down';
  }
}

/**
 * Hook para usar o monitoramento de saúde
 */
export function useHealthMonitoring() {
  const monitor = HealthMonitor.getInstance();
  
  return {
    startMonitoring: () => monitor.startMonitoring(),
    stopMonitoring: () => monitor.stopMonitoring(),
    performHealthCheck: () => monitor.performHealthCheck(),
    getCurrentStatus: () => monitor.getCurrentStatus(),
    getMetrics: () => monitor.getMetrics(),
    isHealthy: () => monitor.isHealthy(),
    isDegraded: () => monitor.isDegraded(),
    isDown: () => monitor.isDown(),
    addStatusListener: (listener: (status: HealthStatus) => void) => monitor.addStatusListener(listener),
    removeStatusListener: (listener: (status: HealthStatus) => void) => monitor.removeStatusListener(listener)
  };
}

/**
 * Função utilitária para verificação rápida de saúde
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('schools')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}