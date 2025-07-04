import { supabase } from '../integrations/supabase/client';
import { logger } from './logger';

// Tipos para métricas
interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  usersByType: Record<string, number>;
}

interface SchoolMetrics {
  totalSchools: number;
  activeSchools: number;
  newSchoolsToday: number;
  averageStudentsPerSchool: number;
}

interface EngagementMetrics {
  totalLogins: number;
  loginsToday: number;
  averageSessionDuration: number;
  mostActiveHours: number[];
}

interface BusinessMetrics {
  users: UserMetrics;
  schools: SchoolMetrics;
  engagement: EngagementMetrics;
  lastUpdated: Date;
}

// Classe para coleta de métricas
class MetricsService {
  private cache: BusinessMetrics | null = null;
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutos
  private lastCacheTime: number = 0;

  async getUserMetrics(): Promise<UserMetrics> {
    try {
      // Total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Usuários ativos (logaram nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

      // Novos usuários hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Usuários por tipo
      const { data: userTypes } = await supabase
        .from('profiles')
        .select('tipo_usuario')
        .not('tipo_usuario', 'is', null);

      const usersByType = userTypes?.reduce((acc, user) => {
        acc[user.tipo_usuario] = (acc[user.tipo_usuario] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        usersByType
      };
    } catch (error) {
      logger.error('Erro ao obter métricas de usuários:', error);
      throw error;
    }
  }

  async getSchoolMetrics(): Promise<SchoolMetrics> {
    try {
      // Total de escolas
      const { count: totalSchools } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      // Escolas ativas (com atividade nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeSchools } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      // Novas escolas hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: newSchoolsToday } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Média de alunos por escola
      const { data: schoolsWithStudents } = await supabase
        .from('schools')
        .select(`
          id,
          alunos(count)
        `);

      const totalStudents = schoolsWithStudents?.reduce((sum, school) => {
        return sum + (school.alunos?.length || 0);
      }, 0) || 0;

      const averageStudentsPerSchool = totalSchools ? totalStudents / totalSchools : 0;

      return {
        totalSchools: totalSchools || 0,
        activeSchools: activeSchools || 0,
        newSchoolsToday: newSchoolsToday || 0,
        averageStudentsPerSchool: Math.round(averageStudentsPerSchool * 100) / 100
      };
    } catch (error) {
      logger.error('Erro ao obter métricas de escolas:', error);
      throw error;
    }
  }

  async getEngagementMetrics(): Promise<EngagementMetrics> {
    try {
      // Para métricas de engajamento, precisaríamos de uma tabela de logs
      // Por enquanto, retornamos dados simulados baseados nos perfis
      const { count: totalLogins } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('last_sign_in_at', 'is', null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: loginsToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', today.toISOString());

      return {
        totalLogins: totalLogins || 0,
        loginsToday: loginsToday || 0,
        averageSessionDuration: 25, // Simulado - 25 minutos
        mostActiveHours: [9, 10, 14, 15, 16] // Simulado - horários mais ativos
      };
    } catch (error) {
      logger.error('Erro ao obter métricas de engajamento:', error);
      throw error;
    }
  }

  async getAllMetrics(useCache: boolean = true): Promise<BusinessMetrics> {
    const now = Date.now();
    
    // Verificar cache
    if (useCache && this.cache && (now - this.lastCacheTime) < this.cacheExpiry) {
      return this.cache;
    }

    try {
      logger.info('Coletando métricas de negócio...');
      
      const [users, schools, engagement] = await Promise.all([
        this.getUserMetrics(),
        this.getSchoolMetrics(),
        this.getEngagementMetrics()
      ]);

      const metrics: BusinessMetrics = {
        users,
        schools,
        engagement,
        lastUpdated: new Date()
      };

      // Atualizar cache
      this.cache = metrics;
      this.lastCacheTime = now;

      logger.info('Métricas coletadas com sucesso');
      return metrics;
    } catch (error) {
      logger.error('Erro ao coletar métricas:', error);
      throw error;
    }
  }

  // Método para limpar cache
  clearCache(): void {
    this.cache = null;
    this.lastCacheTime = 0;
  }

  // Método para registrar eventos customizados
  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    try {
      logger.info(`Evento rastreado: ${event}`, properties);
      
      // Aqui você poderia integrar com serviços como Google Analytics,
      // Mixpanel, Amplitude, etc.
      
      // Por enquanto, apenas logamos o evento
    } catch (error) {
      logger.error('Erro ao rastrear evento:', error);
    }
  }

  // Método para obter métricas em tempo real
  async getRealTimeMetrics(): Promise<Partial<BusinessMetrics>> {
    try {
      // Métricas que podem ser obtidas rapidamente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [newUsersToday, newSchoolsToday, loginsToday] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('schools')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString()),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_sign_in_at', today.toISOString())
      ]);

      return {
        users: {
          newUsersToday: newUsersToday.count || 0
        } as UserMetrics,
        schools: {
          newSchoolsToday: newSchoolsToday.count || 0
        } as SchoolMetrics,
        engagement: {
          loginsToday: loginsToday.count || 0
        } as EngagementMetrics,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Erro ao obter métricas em tempo real:', error);
      throw error;
    }
  }
}

// Instância singleton
export const metricsService = new MetricsService();

// Tipos exportados
export type { UserMetrics, SchoolMetrics, EngagementMetrics, BusinessMetrics };