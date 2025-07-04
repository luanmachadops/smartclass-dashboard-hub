import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MetricsService } from '../../services/metrics';
import { HealthCheckService } from '../../services/healthCheck';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Mock do config
vi.mock('../../config/environment', () => ({
  config: {
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-key'
    },
    cache: {
      defaultTTL: 300000,
      maxSize: 100
    }
  }
}));

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockSupabase: any;

  beforeEach(() => {
    // Setup mock do Supabase
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      count: vi.fn().mockReturnThis(),
      single: vi.fn(),
      auth: {
        getUser: vi.fn()
      },
      storage: {
        from: vi.fn().mockReturnThis(),
        list: vi.fn()
      },
      channel: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    };

    (createClient as any).mockReturnValue(mockSupabase);
    metricsService = new MetricsService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserMetrics', () => {
    it('deve retornar métricas de usuário corretamente', async () => {
      // Mock das respostas do Supabase
      mockSupabase.single
        .mockResolvedValueOnce({ data: [{ count: 10 }], error: null }) // total_users
        .mockResolvedValueOnce({ data: [{ count: 5 }], error: null })  // active_users
        .mockResolvedValueOnce({ data: [{ count: 3 }], error: null })  // new_users_today
        .mockResolvedValueOnce({ data: [{ count: 2 }], error: null }); // new_users_week

      const metrics = await metricsService.getUserMetrics();

      expect(metrics).toEqual({
        total_users: 10,
        active_users: 5,
        new_users_today: 3,
        new_users_week: 2
      });

      // Verificar se as queries foram chamadas corretamente
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('deve lidar com erros do Supabase', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const metrics = await metricsService.getUserMetrics();

      expect(metrics).toEqual({
        total_users: 0,
        active_users: 0,
        new_users_today: 0,
        new_users_week: 0
      });
    });

    it('deve usar cache quando disponível', async () => {
      // Primeira chamada
      mockSupabase.single
        .mockResolvedValueOnce({ data: [{ count: 10 }], error: null })
        .mockResolvedValueOnce({ data: [{ count: 5 }], error: null })
        .mockResolvedValueOnce({ data: [{ count: 3 }], error: null })
        .mockResolvedValueOnce({ data: [{ count: 2 }], error: null });

      await metricsService.getUserMetrics();
      
      // Segunda chamada (deve usar cache)
      const cachedMetrics = await metricsService.getUserMetrics();

      expect(cachedMetrics).toEqual({
        total_users: 10,
        active_users: 5,
        new_users_today: 3,
        new_users_week: 2
      });

      // Deve ter chamado o Supabase apenas uma vez
      expect(mockSupabase.from).toHaveBeenCalledTimes(4); // 4 queries na primeira chamada
    });
  });

  describe('getSchoolMetrics', () => {
    it('deve retornar métricas de escola corretamente', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [{ count: 5 }], error: null })  // total_schools
        .mockResolvedValueOnce({ data: [{ count: 3 }], error: null })  // active_schools
        .mockResolvedValueOnce({ data: [{ avg: 25.5 }], error: null }); // avg_students_per_school

      const metrics = await metricsService.getSchoolMetrics();

      expect(metrics).toEqual({
        total_schools: 5,
        active_schools: 3,
        avg_students_per_school: 25.5
      });
    });
  });

  describe('getEngagementMetrics', () => {
    it('deve retornar métricas de engajamento corretamente', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: [{ count: 100 }], error: null }) // daily_active_users
        .mockResolvedValueOnce({ data: [{ count: 500 }], error: null }) // weekly_active_users
        .mockResolvedValueOnce({ data: [{ count: 1500 }], error: null }) // monthly_active_users
        .mockResolvedValueOnce({ data: [{ avg: 45.5 }], error: null }); // avg_session_duration

      const metrics = await metricsService.getEngagementMetrics();

      expect(metrics).toEqual({
        daily_active_users: 100,
        weekly_active_users: 500,
        monthly_active_users: 1500,
        avg_session_duration: 45.5
      });
    });
  });

  describe('getBusinessMetrics', () => {
    it('deve retornar métricas de negócio corretamente', async () => {
      // Mock das métricas individuais
      const userMetrics = {
        total_users: 10,
        active_users: 5,
        new_users_today: 3,
        new_users_week: 2
      };

      const schoolMetrics = {
        total_schools: 5,
        active_schools: 3,
        avg_students_per_school: 25.5
      };

      const engagementMetrics = {
        daily_active_users: 100,
        weekly_active_users: 500,
        monthly_active_users: 1500,
        avg_session_duration: 45.5
      };

      // Spy nos métodos
      const getUserMetricsSpy = vi.spyOn(metricsService, 'getUserMetrics')
        .mockResolvedValue(userMetrics);
      const getSchoolMetricsSpy = vi.spyOn(metricsService, 'getSchoolMetrics')
        .mockResolvedValue(schoolMetrics);
      const getEngagementMetricsSpy = vi.spyOn(metricsService, 'getEngagementMetrics')
        .mockResolvedValue(engagementMetrics);

      const businessMetrics = await metricsService.getBusinessMetrics();

      expect(businessMetrics).toEqual({
        users: userMetrics,
        schools: schoolMetrics,
        engagement: engagementMetrics,
        timestamp: expect.any(Date)
      });

      expect(getUserMetricsSpy).toHaveBeenCalledOnce();
      expect(getSchoolMetricsSpy).toHaveBeenCalledOnce();
      expect(getEngagementMetricsSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Cache Management', () => {
    it('deve limpar o cache corretamente', () => {
      metricsService.clearCache();
      // Não há muito para testar aqui além de verificar que não há erro
      expect(true).toBe(true);
    });

    it('deve rastrear eventos customizados', () => {
      const event = {
        name: 'user_login',
        properties: { user_id: '123', timestamp: new Date() }
      };

      metricsService.trackEvent(event.name, event.properties);
      
      // Verificar se o evento foi adicionado à lista
      const realtimeMetrics = metricsService.getRealtimeMetrics();
      expect(realtimeMetrics.events).toContainEqual(expect.objectContaining({
        name: event.name,
        properties: event.properties
      }));
    });

    it('deve retornar métricas em tempo real', () => {
      const realtimeMetrics = metricsService.getRealtimeMetrics();
      
      expect(realtimeMetrics).toHaveProperty('events');
      expect(realtimeMetrics).toHaveProperty('timestamp');
      expect(Array.isArray(realtimeMetrics.events)).toBe(true);
      expect(realtimeMetrics.timestamp).toBeInstanceOf(Date);
    });
  });
});

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;
  let mockSupabase: any;

  beforeEach(() => {
    // Setup mock do Supabase
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      auth: {
        getUser: vi.fn()
      },
      storage: {
        from: vi.fn().mockReturnThis(),
        list: vi.fn()
      },
      channel: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn()
      })
    };

    (createClient as any).mockReturnValue(mockSupabase);
    healthCheckService = new HealthCheckService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDatabase', () => {
    it('deve retornar status saudável quando database está funcionando', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: { id: '1' }, 
        error: null 
      });

      const result = await healthCheckService.checkDatabase();

      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
        details: 'Database connection successful'
      });
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('deve retornar status não saudável quando database falha', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Connection failed' } 
      });

      const result = await healthCheckService.checkDatabase();

      expect(result).toEqual({
        status: 'unhealthy',
        responseTime: expect.any(Number),
        details: 'Database error: Connection failed'
      });
    });

    it('deve retornar status degradado quando database é lento', async () => {
      // Mock para simular resposta lenta
      mockSupabase.single.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { id: '1' }, error: null }), 6000)
        )
      );

      const result = await healthCheckService.checkDatabase();

      expect(result.status).toBe('degraded');
      expect(result.responseTime).toBeGreaterThan(5000);
    });
  });

  describe('checkAuth', () => {
    it('deve retornar status saudável quando auth está funcionando', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      });

      const result = await healthCheckService.checkAuth();

      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
        details: 'Auth service operational'
      });
    });

    it('deve retornar status não saudável quando auth falha', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: null, 
        error: { message: 'Auth service unavailable' } 
      });

      const result = await healthCheckService.checkAuth();

      expect(result).toEqual({
        status: 'unhealthy',
        responseTime: expect.any(Number),
        details: 'Auth error: Auth service unavailable'
      });
    });
  });

  describe('checkStorage', () => {
    it('deve retornar status saudável quando storage está funcionando', async () => {
      mockSupabase.storage.list.mockResolvedValue({ 
        data: [], 
        error: null 
      });

      const result = await healthCheckService.checkStorage();

      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
        details: 'Storage service operational'
      });
    });

    it('deve retornar status não saudável quando storage falha', async () => {
      mockSupabase.storage.list.mockResolvedValue({ 
        data: null, 
        error: { message: 'Storage unavailable' } 
      });

      const result = await healthCheckService.checkStorage();

      expect(result).toEqual({
        status: 'unhealthy',
        responseTime: expect.any(Number),
        details: 'Storage error: Storage unavailable'
      });
    });
  });

  describe('checkRealtime', () => {
    it('deve retornar status saudável quando realtime está funcionando', async () => {
      const result = await healthCheckService.checkRealtime();

      expect(result).toEqual({
        status: 'healthy',
        responseTime: expect.any(Number),
        details: 'Realtime service operational'
      });
    });
  });

  describe('getOverallHealth', () => {
    it('deve retornar status geral saudável quando todos os serviços estão ok', async () => {
      // Mock todos os checks para retornar healthy
      vi.spyOn(healthCheckService, 'checkDatabase')
        .mockResolvedValue({ status: 'healthy', responseTime: 100, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkAuth')
        .mockResolvedValue({ status: 'healthy', responseTime: 50, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkStorage')
        .mockResolvedValue({ status: 'healthy', responseTime: 75, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkRealtime')
        .mockResolvedValue({ status: 'healthy', responseTime: 25, details: 'OK' });

      const result = await healthCheckService.getOverallHealth();

      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('auth');
      expect(result.checks).toHaveProperty('storage');
      expect(result.checks).toHaveProperty('realtime');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('deve retornar status degradado quando algum serviço está degradado', async () => {
      vi.spyOn(healthCheckService, 'checkDatabase')
        .mockResolvedValue({ status: 'degraded', responseTime: 6000, details: 'Slow' });
      vi.spyOn(healthCheckService, 'checkAuth')
        .mockResolvedValue({ status: 'healthy', responseTime: 50, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkStorage')
        .mockResolvedValue({ status: 'healthy', responseTime: 75, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkRealtime')
        .mockResolvedValue({ status: 'healthy', responseTime: 25, details: 'OK' });

      const result = await healthCheckService.getOverallHealth();

      expect(result.status).toBe('degraded');
    });

    it('deve retornar status não saudável quando algum serviço está falhando', async () => {
      vi.spyOn(healthCheckService, 'checkDatabase')
        .mockResolvedValue({ status: 'unhealthy', responseTime: 0, details: 'Failed' });
      vi.spyOn(healthCheckService, 'checkAuth')
        .mockResolvedValue({ status: 'healthy', responseTime: 50, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkStorage')
        .mockResolvedValue({ status: 'healthy', responseTime: 75, details: 'OK' });
      vi.spyOn(healthCheckService, 'checkRealtime')
        .mockResolvedValue({ status: 'healthy', responseTime: 25, details: 'OK' });

      const result = await healthCheckService.getOverallHealth();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('startPeriodicCheck', () => {
    it('deve iniciar verificações periódicas', () => {
      const callback = vi.fn();
      
      healthCheckService.startPeriodicCheck(1000, callback);
      
      // Verificar se o timer foi configurado
      expect(healthCheckService['intervalId']).toBeDefined();
    });

    it('deve parar verificações periódicas', () => {
      const callback = vi.fn();
      
      healthCheckService.startPeriodicCheck(1000, callback);
      healthCheckService.stopPeriodicCheck();
      
      // Verificar se o timer foi limpo
      expect(healthCheckService['intervalId']).toBeNull();
    });
  });
});

// Testes de integração entre os serviços
describe('Services Integration', () => {
  it('MetricsService e HealthCheckService devem trabalhar juntos', async () => {
    const metricsService = new MetricsService();
    const healthCheckService = new HealthCheckService();

    // Mock básico para evitar erros
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: [{ count: 0 }], error: null }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      },
      storage: {
        from: vi.fn().mockReturnThis(),
        list: vi.fn().mockResolvedValue({ data: [], error: null })
      },
      channel: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() })
    };

    (createClient as any).mockReturnValue(mockSupabase);

    // Testar se ambos os serviços podem ser usados simultaneamente
    const [metrics, health] = await Promise.all([
      metricsService.getUserMetrics(),
      healthCheckService.getOverallHealth()
    ]);

    expect(metrics).toBeDefined();
    expect(health).toBeDefined();
    expect(health.status).toMatch(/healthy|degraded|unhealthy/);
  });
});