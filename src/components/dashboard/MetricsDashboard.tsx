import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, 
  School, 
  TrendingUp, 
  Activity, 
  Clock, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { metricsService, type BusinessMetrics } from '../../services/metrics';
import { healthCheckService, type HealthStatus } from '../../services/healthCheck';
import { LoadingFeedback, ErrorFeedback, ConnectionStatus } from '../ui/enhanced-feedback';
import { useSmartQuery } from '../../hooks/useSmartQuery';
import { logger } from '../../services/logger';

// Componente de métrica individual
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'error';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  status
}) => {
  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${status ? statusColors[status] : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${
              !trend.isPositive ? 'rotate-180' : ''
            }`} />
            {Math.abs(trend.value)}% em relação ao mês anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente de status de saúde
interface HealthStatusCardProps {
  healthStatus: HealthStatus | null;
  onRefresh: () => void;
}

const HealthStatusCard: React.FC<HealthStatusCardProps> = ({ healthStatus, onRefresh }) => {
  if (!healthStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingFeedback message="Verificando status..." />
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    healthy: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
      label: 'Saudável'
    },
    degraded: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: AlertCircle,
      label: 'Degradado'
    },
    unhealthy: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: AlertCircle,
      label: 'Não Saudável'
    }
  };

  const config = statusConfig[healthStatus.status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status do Sistema</span>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <StatusIcon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-sm text-muted-foreground">
                Tempo de resposta: {healthStatus.responseTime}ms
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Banco de Dados</p>
              <Badge variant={healthStatus.details.database.status === 'up' ? 'default' : 'destructive'}>
                {healthStatus.details.database.status}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Autenticação</p>
              <Badge variant={healthStatus.details.auth.status === 'up' ? 'default' : 'destructive'}>
                {healthStatus.details.auth.status}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Storage</p>
              <Badge variant={healthStatus.details.storage.status === 'up' ? 'default' : 'destructive'}>
                {healthStatus.details.storage.status}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Realtime</p>
              <Badge variant={healthStatus.details.realtime.status === 'up' ? 'default' : 'destructive'}>
                {healthStatus.details.realtime.status}
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Última verificação: {new Date(healthStatus.timestamp).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal do dashboard de métricas
export const MetricsDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Query para métricas de negócio
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics
  } = useSmartQuery(
    ['business-metrics', refreshKey],
    () => metricsService.getAllMetrics(),
    'dynamic'
  );

  // Listener para mudanças no health status
  useEffect(() => {
    const handleHealthChange = (status: HealthStatus) => {
      setHealthStatus(status);
    };

    // Obter status inicial
    const initialStatus = healthCheckService.getLastHealthStatus();
    if (initialStatus) {
      setHealthStatus(initialStatus);
    }

    // Adicionar listener
    healthCheckService.addStatusListener(handleHealthChange);

    return () => {
      healthCheckService.removeStatusListener(handleHealthChange);
    };
  }, []);

  const handleRefreshMetrics = () => {
    setRefreshKey(prev => prev + 1);
    refetchMetrics();
    logger.info('Métricas atualizadas manualmente');
  };

  const handleRefreshHealth = async () => {
    try {
      const newStatus = await healthCheckService.performHealthCheck();
      setHealthStatus(newStatus);
    } catch (error) {
      logger.error('Erro ao atualizar health check:', error);
    }
  };

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
          <ConnectionStatus />
        </div>
        <LoadingFeedback message="Carregando métricas..." size="lg" />
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
          <ConnectionStatus />
        </div>
        <ErrorFeedback 
          message="Erro ao carregar métricas" 
          error={metricsError as Error}
          showRetry
          onRetry={handleRefreshMetrics}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
        <div className="flex items-center space-x-4">
          <ConnectionStatus />
          <Button variant="outline" onClick={handleRefreshMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="schools">Escolas</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="health">Saúde do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total de Usuários"
              value={metrics?.users.totalUsers || 0}
              description="Usuários registrados"
              icon={Users}
              trend={{
                value: 12,
                isPositive: true
              }}
              status="success"
            />
            <MetricCard
              title="Escolas Ativas"
              value={metrics?.schools.activeSchools || 0}
              description="Escolas com atividade recente"
              icon={School}
              trend={{
                value: 5,
                isPositive: true
              }}
              status="success"
            />
            <MetricCard
              title="Logins Hoje"
              value={metrics?.engagement.loginsToday || 0}
              description="Acessos realizados hoje"
              icon={Activity}
              trend={{
                value: 8,
                isPositive: true
              }}
              status="success"
            />
            <MetricCard
              title="Tempo Médio de Sessão"
              value={`${metrics?.engagement.averageSessionDuration || 0}min`}
              description="Duração média das sessões"
              icon={Clock}
              trend={{
                value: 3,
                isPositive: false
              }}
              status="warning"
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total de Usuários"
              value={metrics?.users.totalUsers || 0}
              icon={Users}
            />
            <MetricCard
              title="Usuários Ativos"
              value={metrics?.users.activeUsers || 0}
              description="Últimos 30 dias"
              icon={Activity}
            />
            <MetricCard
              title="Novos Usuários Hoje"
              value={metrics?.users.newUsersToday || 0}
              icon={TrendingUp}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Distribuição por Tipo de Usuário</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(metrics?.users.usersByType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total de Escolas"
              value={metrics?.schools.totalSchools || 0}
              icon={School}
            />
            <MetricCard
              title="Escolas Ativas"
              value={metrics?.schools.activeSchools || 0}
              description="Últimos 30 dias"
              icon={Activity}
            />
            <MetricCard
              title="Novas Escolas Hoje"
              value={metrics?.schools.newSchoolsToday || 0}
              icon={TrendingUp}
            />
            <MetricCard
              title="Média de Alunos/Escola"
              value={metrics?.schools.averageStudentsPerSchool || 0}
              icon={BarChart3}
            />
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total de Logins"
              value={metrics?.engagement.totalLogins || 0}
              icon={Activity}
            />
            <MetricCard
              title="Logins Hoje"
              value={metrics?.engagement.loginsToday || 0}
              icon={TrendingUp}
            />
            <MetricCard
              title="Tempo Médio de Sessão"
              value={`${metrics?.engagement.averageSessionDuration || 0}min`}
              icon={Clock}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LineChart className="h-5 w-5" />
                <span>Horários Mais Ativos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics?.engagement.mostActiveHours.map(hour => (
                  <Badge key={hour} variant="outline">
                    {hour}:00
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <HealthStatusCard 
            healthStatus={healthStatus} 
            onRefresh={handleRefreshHealth}
          />
        </TabsContent>
      </Tabs>

      {metrics && (
        <div className="text-xs text-muted-foreground text-center">
          Última atualização: {new Date(metrics.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;