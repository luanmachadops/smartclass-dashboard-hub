import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { logger } from '../services/logger';

// Componente de loading personalizado
interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner = ({ message = 'Carregando...', size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

// HOC para lazy loading com error boundary
interface LazyWrapperProps {
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error) => void;
}

function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyWrapperProps = {}
) {
  const LazyComponent = lazy(() => {
    logger.debug('Carregando componente lazy...');
    return importFn().catch(error => {
      logger.error('Erro ao carregar componente lazy:', error);
      options.onError?.(error);
      throw error;
    });
  });

  return function WrappedComponent(props: P) {
    return (
      <Suspense 
        fallback={
          options.fallback || <LoadingSpinner message="Carregando componente..." />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Componentes lazy carregados
export const LazyDashboard = withLazyLoading(
  () => import('../pages/Dashboard'),
  {
    fallback: <LoadingSpinner message="Carregando dashboard..." size="lg" />,
    onError: (error) => logger.error('Erro ao carregar Dashboard:', error)
  }
);

export const LazySchoolManagement = withLazyLoading(
  () => import('../pages/SchoolManagement'),
  {
    fallback: <LoadingSpinner message="Carregando gerenciamento de escola..." />,
    onError: (error) => logger.error('Erro ao carregar SchoolManagement:', error)
  }
);

export const LazyStudentManagement = withLazyLoading(
  () => import('../pages/StudentManagement'),
  {
    fallback: <LoadingSpinner message="Carregando gerenciamento de alunos..." />,
    onError: (error) => logger.error('Erro ao carregar StudentManagement:', error)
  }
);

export const LazyTeacherManagement = withLazyLoading(
  () => import('../pages/TeacherManagement'),
  {
    fallback: <LoadingSpinner message="Carregando gerenciamento de professores..." />,
    onError: (error) => logger.error('Erro ao carregar TeacherManagement:', error)
  }
);

export const LazyClassManagement = withLazyLoading(
  () => import('../pages/ClassManagement'),
  {
    fallback: <LoadingSpinner message="Carregando gerenciamento de turmas..." />,
    onError: (error) => logger.error('Erro ao carregar ClassManagement:', error)
  }
);

export const LazyFinancialManagement = withLazyLoading(
  () => import('../pages/FinancialManagement'),
  {
    fallback: <LoadingSpinner message="Carregando gestão financeira..." />,
    onError: (error) => logger.error('Erro ao carregar FinancialManagement:', error)
  }
);

export const LazyChat = withLazyLoading(
  () => import('../pages/Chat'),
  {
    fallback: <LoadingSpinner message="Carregando chat..." />,
    onError: (error) => logger.error('Erro ao carregar Chat:', error)
  }
);

export const LazySettings = withLazyLoading(
  () => import('../pages/Settings'),
  {
    fallback: <LoadingSpinner message="Carregando configurações..." />,
    onError: (error) => logger.error('Erro ao carregar Settings:', error)
  }
);

export const LazyProfile = withLazyLoading(
  () => import('../pages/Profile'),
  {
    fallback: <LoadingSpinner message="Carregando perfil..." />,
    onError: (error) => logger.error('Erro ao carregar Profile:', error)
  }
);

// Componentes de formulário lazy
export const LazyStudentForm = withLazyLoading(
  () => import('../components/forms/StudentForm'),
  {
    fallback: <LoadingSpinner message="Carregando formulário..." size="sm" />,
    onError: (error) => logger.error('Erro ao carregar StudentForm:', error)
  }
);

export const LazyTeacherForm = withLazyLoading(
  () => import('../components/forms/TeacherForm'),
  {
    fallback: <LoadingSpinner message="Carregando formulário..." size="sm" />,
    onError: (error) => logger.error('Erro ao carregar TeacherForm:', error)
  }
);

export const LazyClassForm = withLazyLoading(
  () => import('../components/forms/ClassForm'),
  {
    fallback: <LoadingSpinner message="Carregando formulário..." size="sm" />,
    onError: (error) => logger.error('Erro ao carregar ClassForm:', error)
  }
);

// Componentes de relatório lazy
export const LazyReports = withLazyLoading(
  () => import('../components/reports/Reports'),
  {
    fallback: <LoadingSpinner message="Carregando relatórios..." />,
    onError: (error) => logger.error('Erro ao carregar Reports:', error)
  }
);

export const LazyAnalytics = withLazyLoading(
  () => import('../components/analytics/Analytics'),
  {
    fallback: <LoadingSpinner message="Carregando analytics..." />,
    onError: (error) => logger.error('Erro ao carregar Analytics:', error)
  }
);

// Componentes de calendário lazy
export const LazyCalendar = withLazyLoading(
  () => import('../components/calendar/Calendar'),
  {
    fallback: <LoadingSpinner message="Carregando calendário..." />,
    onError: (error) => logger.error('Erro ao carregar Calendar:', error)
  }
);

// Hook para preload de componentes
export function usePreloadComponents() {
  const preloadComponent = (importFn: () => Promise<any>) => {
    // Preload em background
    setTimeout(() => {
      importFn().catch(error => {
        logger.warn('Erro no preload de componente:', error);
      });
    }, 100);
  };

  const preloadDashboard = () => preloadComponent(() => import('../pages/Dashboard'));
  const preloadSchoolManagement = () => preloadComponent(() => import('../pages/SchoolManagement'));
  const preloadStudentManagement = () => preloadComponent(() => import('../pages/StudentManagement'));
  const preloadTeacherManagement = () => preloadComponent(() => import('../pages/TeacherManagement'));
  const preloadClassManagement = () => preloadComponent(() => import('../pages/ClassManagement'));
  const preloadFinancialManagement = () => preloadComponent(() => import('../pages/FinancialManagement'));
  const preloadChat = () => preloadComponent(() => import('../pages/Chat'));
  const preloadSettings = () => preloadComponent(() => import('../pages/Settings'));
  const preloadProfile = () => preloadComponent(() => import('../pages/Profile'));

  // Preload baseado no tipo de usuário
  const preloadByUserType = (userType: string) => {
    switch (userType) {
      case 'diretor':
        preloadDashboard();
        preloadSchoolManagement();
        preloadStudentManagement();
        preloadTeacherManagement();
        preloadFinancialManagement();
        break;
      case 'professor':
        preloadDashboard();
        preloadClassManagement();
        preloadStudentManagement();
        preloadChat();
        break;
      case 'aluno':
        preloadDashboard();
        preloadChat();
        preloadProfile();
        break;
      default:
        preloadDashboard();
    }
  };

  // Preload baseado na rota atual
  const preloadByRoute = (currentRoute: string) => {
    const routePreloadMap: Record<string, () => void> = {
      '/dashboard': () => {
        preloadSchoolManagement();
        preloadStudentManagement();
      },
      '/school': () => {
        preloadStudentManagement();
        preloadTeacherManagement();
      },
      '/students': () => {
        preloadClassManagement();
        preloadChat();
      },
      '/teachers': () => {
        preloadClassManagement();
        preloadStudentManagement();
      },
      '/classes': () => {
        preloadStudentManagement();
        preloadTeacherManagement();
      },
      '/financial': () => {
        preloadDashboard();
      },
      '/chat': () => {
        preloadProfile();
      }
    };

    const preloadFn = routePreloadMap[currentRoute];
    if (preloadFn) {
      preloadFn();
    }
  };

  return {
    preloadDashboard,
    preloadSchoolManagement,
    preloadStudentManagement,
    preloadTeacherManagement,
    preloadClassManagement,
    preloadFinancialManagement,
    preloadChat,
    preloadSettings,
    preloadProfile,
    preloadByUserType,
    preloadByRoute
  };
}

// Hook para métricas de lazy loading
export function useLazyLoadingMetrics() {
  const getLoadingStats = () => {
    // Esta seria uma implementação mais complexa que rastrearia
    // tempos de carregamento, erros, etc.
    return {
      totalComponents: 12,
      loadedComponents: 0, // Seria rastreado dinamicamente
      averageLoadTime: 0, // Seria calculado dinamicamente
      errorRate: 0 // Seria calculado dinamicamente
    };
  };

  return { getLoadingStats };
}

export { LoadingSpinner, withLazyLoading };