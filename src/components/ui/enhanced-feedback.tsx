import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Info, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { healthCheckService } from '../../services/healthCheck';

// Tipos para diferentes estados de feedback
type FeedbackType = 'loading' | 'success' | 'error' | 'warning' | 'info';
type FeedbackSize = 'sm' | 'md' | 'lg';

interface BaseFeedbackProps {
  type: FeedbackType;
  size?: FeedbackSize;
  className?: string;
  children?: React.ReactNode;
}

// Componente base de feedback
const BaseFeedback: React.FC<BaseFeedbackProps> = ({ 
  type, 
  size = 'md', 
  className, 
  children 
}) => {
  const icons = {
    loading: Loader2,
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    loading: 'text-blue-500',
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const Icon = icons[type];

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Icon 
        className={cn(
          sizes[size], 
          colors[type],
          type === 'loading' && 'animate-spin'
        )} 
      />
      {children && (
        <div className="flex-1">
          {children}
        </div>
      )}
    </div>
  );
};

// Componente de loading com progresso
interface LoadingFeedbackProps {
  message?: string;
  progress?: number;
  size?: FeedbackSize;
  showProgress?: boolean;
  className?: string;
}

export const LoadingFeedback: React.FC<LoadingFeedbackProps> = ({
  message = 'Carregando...',
  progress,
  size = 'md',
  showProgress = false,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <BaseFeedback type="loading" size={size}>
        <span className="text-sm text-muted-foreground">{message}</span>
      </BaseFeedback>
      {showProgress && progress !== undefined && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}
    </div>
  );
};

// Componente de sucesso
interface SuccessFeedbackProps {
  message?: string;
  size?: FeedbackSize;
  autoHide?: boolean;
  duration?: number;
  onHide?: () => void;
  className?: string;
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
  message = 'Operação realizada com sucesso!',
  size = 'md',
  autoHide = false,
  duration = 3000,
  onHide,
  className
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onHide]);

  if (!visible) return null;

  return (
    <BaseFeedback type="success" size={size} className={className}>
      <span className="text-sm text-green-700">{message}</span>
    </BaseFeedback>
  );
};

// Componente de erro com retry
interface ErrorFeedbackProps {
  message?: string;
  error?: Error;
  size?: FeedbackSize;
  showRetry?: boolean;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({
  message = 'Ocorreu um erro',
  error,
  size = 'md',
  showRetry = false,
  onRetry,
  retryText = 'Tentar novamente',
  className
}) => {
  const errorMessage = error?.message || message;

  return (
    <div className={cn('space-y-2', className)}>
      <BaseFeedback type="error" size={size}>
        <div className="flex-1">
          <span className="text-sm text-red-700">{errorMessage}</span>
        </div>
      </BaseFeedback>
      {showRetry && onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          {retryText}
        </Button>
      )}
    </div>
  );
};

// Componente de warning
interface WarningFeedbackProps {
  message: string;
  size?: FeedbackSize;
  className?: string;
}

export const WarningFeedback: React.FC<WarningFeedbackProps> = ({
  message,
  size = 'md',
  className
}) => {
  return (
    <BaseFeedback type="warning" size={size} className={className}>
      <span className="text-sm text-yellow-700">{message}</span>
    </BaseFeedback>
  );
};

// Componente de info
interface InfoFeedbackProps {
  message: string;
  size?: FeedbackSize;
  className?: string;
}

export const InfoFeedback: React.FC<InfoFeedbackProps> = ({
  message,
  size = 'md',
  className
}) => {
  return (
    <BaseFeedback type="info" size={size} className={className}>
      <span className="text-sm text-blue-700">{message}</span>
    </BaseFeedback>
  );
};

// Componente de status de conexão
interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para health check
    const handleHealthChange = (status: any) => {
      setHealthStatus(status.status);
    };

    healthCheckService.addStatusListener(handleHealthChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      healthCheckService.removeStatusListener(handleHealthChange);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className={cn('flex items-center space-x-2 text-red-500', className)}>
        <WifiOff className="h-4 w-4" />
        <span className="text-xs">Offline</span>
      </div>
    );
  }

  const statusConfig = {
    healthy: { color: 'text-green-500', text: 'Online' },
    degraded: { color: 'text-yellow-500', text: 'Lento' },
    unhealthy: { color: 'text-red-500', text: 'Problemas' }
  };

  const config = statusConfig[healthStatus];

  return (
    <div className={cn(`flex items-center space-x-2 ${config.color}`, className)}>
      <Wifi className="h-4 w-4" />
      <span className="text-xs">{config.text}</span>
    </div>
  );
};

// Componente de feedback de formulário
interface FormFeedbackProps {
  isSubmitting?: boolean;
  isSuccess?: boolean;
  error?: string | null;
  successMessage?: string;
  loadingMessage?: string;
  className?: string;
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  isSubmitting = false,
  isSuccess = false,
  error = null,
  successMessage = 'Salvo com sucesso!',
  loadingMessage = 'Salvando...',
  className
}) => {
  if (isSubmitting) {
    return <LoadingFeedback message={loadingMessage} className={className} />;
  }

  if (error) {
    return <ErrorFeedback message={error} className={className} />;
  }

  if (isSuccess) {
    return (
      <SuccessFeedback 
        message={successMessage} 
        autoHide 
        duration={3000}
        className={className} 
      />
    );
  }

  return null;
};

// Componente de estado vazio
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  action,
  className
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Componente de skeleton loading
interface SkeletonProps {
  className?: string;
  lines?: number;
  avatar?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  lines = 3, 
  avatar = false 
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-muted h-10 w-10"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              'h-4 bg-muted rounded',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Hook para feedback de operações
export function useOperationFeedback() {
  const [state, setState] = useState<{
    isLoading: boolean;
    isSuccess: boolean;
    error: string | null;
  }>({ isLoading: false, isSuccess: false, error: null });

  const startOperation = () => {
    setState({ isLoading: true, isSuccess: false, error: null });
  };

  const completeOperation = () => {
    setState({ isLoading: false, isSuccess: true, error: null });
    // Auto-reset success após 3 segundos
    setTimeout(() => {
      setState(prev => ({ ...prev, isSuccess: false }));
    }, 3000);
  };

  const failOperation = (error: string) => {
    setState({ isLoading: false, isSuccess: false, error });
  };

  const reset = () => {
    setState({ isLoading: false, isSuccess: false, error: null });
  };

  return {
    ...state,
    startOperation,
    completeOperation,
    failOperation,
    reset
  };
}