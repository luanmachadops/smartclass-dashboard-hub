import { supabase } from '../integrations/supabase/client';
import { logger } from './logger';

// Tipos para health check
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  details: {
    database: HealthCheckResult;
    auth: HealthCheckResult;
    storage: HealthCheckResult;
    realtime: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  error?: string;
  lastCheck: Date;
}

// Classe para health checks
class HealthCheckService {
  private lastHealthCheck: HealthStatus | null = null;
  private checkInterval: number = 30000; // 30 segundos
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: ((status: HealthStatus) => void)[] = [];

  constructor() {
    this.startPeriodicChecks();
  }

  // Verificar saúde do banco de dados
  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Fazer uma query simples para testar a conexão
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();

      const responseTime = Date.now() - startTime;

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (ok)
        return {
          status: 'down',
          responseTime,
          error: error.message,
          lastCheck: new Date()
        };
      }

      return {
        status: responseTime > 2000 ? 'degraded' : 'up',
        responseTime,
        lastCheck: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  // Verificar saúde da autenticação
  async checkAuth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Verificar se conseguimos obter a sessão atual
      const { data, error } = await supabase.auth.getSession();
      
      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'down',
          responseTime,
          error: error.message,
          lastCheck: new Date()
        };
      }

      return {
        status: responseTime > 1000 ? 'degraded' : 'up',
        responseTime,
        lastCheck: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  // Verificar saúde do storage
  async checkStorage(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Listar buckets para testar a conexão com storage
      const { data, error } = await supabase.storage.listBuckets();
      
      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'down',
          responseTime,
          error: error.message,
          lastCheck: new Date()
        };
      }

      return {
        status: responseTime > 2000 ? 'degraded' : 'up',
        responseTime,
        lastCheck: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  // Verificar saúde do realtime
  async checkRealtime(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Verificar status das conexões realtime
      const channels = supabase.getChannels();
      const responseTime = Date.now() - startTime;

      // Se não há canais, consideramos como funcionando
      return {
        status: 'up',
        responseTime,
        lastCheck: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date()
      };
    }
  }

  // Executar health check completo
  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando health check...');
      
      const [database, auth, storage, realtime] = await Promise.all([
        this.checkDatabase(),
        this.checkAuth(),
        this.checkStorage(),
        this.checkRealtime()
      ]);

      const totalResponseTime = Date.now() - startTime;

      // Determinar status geral
      const services = [database, auth, storage, realtime];
      const downServices = services.filter(s => s.status === 'down').length;
      const degradedServices = services.filter(s => s.status === 'degraded').length;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      
      if (downServices > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices > 0 || totalResponseTime > 5000) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date(),
        responseTime: totalResponseTime,
        details: {
          database,
          auth,
          storage,
          realtime
        }
      };

      this.lastHealthCheck = healthStatus;
      
      // Notificar listeners
      this.listeners.forEach(listener => {
        try {
          listener(healthStatus);
        } catch (error) {
          logger.error('Erro ao notificar listener de health check:', error);
        }
      });

      logger.info(`Health check concluído: ${overallStatus} (${totalResponseTime}ms)`);
      return healthStatus;
    } catch (error) {
      logger.error('Erro durante health check:', error);
      
      const errorStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          database: { status: 'down', responseTime: 0, error: 'Health check failed', lastCheck: new Date() },
          auth: { status: 'down', responseTime: 0, error: 'Health check failed', lastCheck: new Date() },
          storage: { status: 'down', responseTime: 0, error: 'Health check failed', lastCheck: new Date() },
          realtime: { status: 'down', responseTime: 0, error: 'Health check failed', lastCheck: new Date() }
        }
      };

      this.lastHealthCheck = errorStatus;
      return errorStatus;
    }
  }

  // Obter último status de saúde
  getLastHealthStatus(): HealthStatus | null {
    return this.lastHealthCheck;
  }

  // Verificar se o sistema está saudável
  isHealthy(): boolean {
    return this.lastHealthCheck?.status === 'healthy';
  }

  // Adicionar listener para mudanças de status
  addStatusListener(listener: (status: HealthStatus) => void): void {
    this.listeners.push(listener);
  }

  // Remover listener
  removeStatusListener(listener: (status: HealthStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Iniciar verificações periódicas
  startPeriodicChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Fazer primeira verificação imediatamente
    this.performHealthCheck();

    // Configurar verificações periódicas
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);

    logger.info(`Health checks iniciados (intervalo: ${this.checkInterval}ms)`);
  }

  // Parar verificações periódicas
  stopPeriodicChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Health checks interrompidos');
    }
  }

  // Configurar intervalo de verificação
  setCheckInterval(intervalMs: number): void {
    this.checkInterval = intervalMs;
    if (this.intervalId) {
      this.startPeriodicChecks(); // Reiniciar com novo intervalo
    }
  }

  // Obter métricas de disponibilidade
  getUptimeMetrics(): { uptime: number; totalChecks: number; successfulChecks: number } {
    // Esta seria uma implementação mais complexa que manteria histórico
    // Por enquanto, retornamos dados baseados no último check
    const isUp = this.isHealthy();
    return {
      uptime: isUp ? 100 : 0,
      totalChecks: 1,
      successfulChecks: isUp ? 1 : 0
    };
  }
}

// Instância singleton
export const healthCheckService = new HealthCheckService();

// Tipos exportados
export type { HealthStatus, HealthCheckResult };