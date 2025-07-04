import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  LoadingSpinner,
  SuccessMessage,
  ErrorMessage,
  WarningMessage,
  InfoMessage,
  ConnectionStatus,
  FormFeedback,
  EmptyState,
  SkeletonLoader,
  useOperationFeedback
} from '../../components/ui/enhanced-feedback';
import { MetricsDashboard } from '../../components/dashboard/MetricsDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dos serviços
vi.mock('../../services/metrics', () => ({
  MetricsService: vi.fn().mockImplementation(() => ({
    getUserMetrics: vi.fn().mockResolvedValue({
      total_users: 100,
      active_users: 80,
      new_users_today: 5,
      new_users_week: 25
    }),
    getSchoolMetrics: vi.fn().mockResolvedValue({
      total_schools: 10,
      active_schools: 8,
      avg_students_per_school: 50
    }),
    getEngagementMetrics: vi.fn().mockResolvedValue({
      daily_active_users: 60,
      weekly_active_users: 200,
      monthly_active_users: 500,
      avg_session_duration: 45
    }),
    getBusinessMetrics: vi.fn().mockResolvedValue({
      users: {
        total_users: 100,
        active_users: 80,
        new_users_today: 5,
        new_users_week: 25
      },
      schools: {
        total_schools: 10,
        active_schools: 8,
        avg_students_per_school: 50
      },
      engagement: {
        daily_active_users: 60,
        weekly_active_users: 200,
        monthly_active_users: 500,
        avg_session_duration: 45
      },
      timestamp: new Date()
    }),
    clearCache: vi.fn(),
    trackEvent: vi.fn(),
    getRealtimeMetrics: vi.fn().mockReturnValue({
      events: [],
      timestamp: new Date()
    })
  }))
}));

vi.mock('../../services/healthCheck', () => ({
  HealthCheckService: vi.fn().mockImplementation(() => ({
    getOverallHealth: vi.fn().mockResolvedValue({
      status: 'healthy',
      checks: {
        database: { status: 'healthy', responseTime: 100, details: 'OK' },
        auth: { status: 'healthy', responseTime: 50, details: 'OK' },
        storage: { status: 'healthy', responseTime: 75, details: 'OK' },
        realtime: { status: 'healthy', responseTime: 25, details: 'OK' }
      },
      timestamp: new Date()
    }),
    startPeriodicCheck: vi.fn(),
    stopPeriodicCheck: vi.fn()
  }))
}));

// Mock do AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', tipo_usuario: 'diretor' },
    isAuthenticated: true
  })
}));

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Enhanced Feedback Components', () => {
  describe('LoadingSpinner', () => {
    it('deve renderizar spinner básico', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve renderizar com texto customizado', () => {
      render(<LoadingSpinner text="Processando dados..." />);
      expect(screen.getByText('Processando dados...')).toBeInTheDocument();
    });

    it('deve renderizar em tamanho pequeno', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('deve renderizar em tamanho grande', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('deve renderizar com overlay', () => {
      render(<LoadingSpinner overlay />);
      expect(screen.getByRole('status').parentElement).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('SuccessMessage', () => {
    it('deve renderizar mensagem de sucesso', () => {
      render(<SuccessMessage message="Operação realizada com sucesso!" />);
      expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-green-50', 'text-green-800');
    });

    it('deve renderizar com título', () => {
      render(
        <SuccessMessage 
          title="Sucesso" 
          message="Operação realizada com sucesso!" 
        />
      );
      expect(screen.getByText('Sucesso')).toBeInTheDocument();
      expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();
    });

    it('deve chamar onClose quando botão for clicado', () => {
      const onClose = vi.fn();
      render(
        <SuccessMessage 
          message="Sucesso!" 
          onClose={onClose}
        />
      );
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('ErrorMessage', () => {
    it('deve renderizar mensagem de erro', () => {
      render(<ErrorMessage message="Ocorreu um erro!" />);
      expect(screen.getByText('Ocorreu um erro!')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-red-50', 'text-red-800');
    });

    it('deve renderizar com detalhes do erro', () => {
      render(
        <ErrorMessage 
          message="Erro de conexão" 
          details="Não foi possível conectar ao servidor"
        />
      );
      expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
      expect(screen.getByText('Não foi possível conectar ao servidor')).toBeInTheDocument();
    });

    it('deve renderizar botão de retry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorMessage 
          message="Erro!" 
          onRetry={onRetry}
        />
      );
      
      const retryButton = screen.getByText('Tentar novamente');
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe('WarningMessage', () => {
    it('deve renderizar mensagem de aviso', () => {
      render(<WarningMessage message="Atenção: dados podem estar desatualizados" />);
      expect(screen.getByText('Atenção: dados podem estar desatualizados')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50', 'text-yellow-800');
    });
  });

  describe('InfoMessage', () => {
    it('deve renderizar mensagem informativa', () => {
      render(<InfoMessage message="Informação importante" />);
      expect(screen.getByText('Informação importante')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-blue-50', 'text-blue-800');
    });
  });

  describe('ConnectionStatus', () => {
    it('deve renderizar status online', () => {
      render(<ConnectionStatus isOnline={true} />);
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-green-50', 'text-green-700');
    });

    it('deve renderizar status offline', () => {
      render(<ConnectionStatus isOnline={false} />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveClass('bg-red-50', 'text-red-700');
    });

    it('deve renderizar com última sincronização', () => {
      const lastSync = new Date('2024-01-01T10:00:00Z');
      render(<ConnectionStatus isOnline={true} lastSync={lastSync} />);
      expect(screen.getByText(/Última sincronização:/)).toBeInTheDocument();
    });
  });

  describe('FormFeedback', () => {
    it('deve renderizar feedback de sucesso', () => {
      render(<FormFeedback type="success" message="Formulário enviado!" />);
      expect(screen.getByText('Formulário enviado!')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('border-green-200');
    });

    it('deve renderizar feedback de erro', () => {
      render(<FormFeedback type="error" message="Erro no formulário!" />);
      expect(screen.getByText('Erro no formulário!')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('border-red-200');
    });

    it('deve renderizar lista de erros', () => {
      const errors = ['Campo obrigatório', 'Email inválido'];
      render(<FormFeedback type="error" message="Erros encontrados:" errors={errors} />);
      
      expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('deve renderizar estado vazio básico', () => {
      render(
        <EmptyState 
          title="Nenhum dado encontrado"
          description="Não há dados para exibir"
        />
      );
      
      expect(screen.getByText('Nenhum dado encontrado')).toBeInTheDocument();
      expect(screen.getByText('Não há dados para exibir')).toBeInTheDocument();
    });

    it('deve renderizar com ação', () => {
      const onAction = vi.fn();
      render(
        <EmptyState 
          title="Nenhum usuário"
          description="Adicione o primeiro usuário"
          actionLabel="Adicionar usuário"
          onAction={onAction}
        />
      );
      
      const actionButton = screen.getByText('Adicionar usuário');
      fireEvent.click(actionButton);
      expect(onAction).toHaveBeenCalledOnce();
    });

    it('deve renderizar ícone customizado', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Icon</div>;
      render(
        <EmptyState 
          title="Vazio"
          description="Descrição"
          icon={<CustomIcon />}
        />
      );
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('SkeletonLoader', () => {
    it('deve renderizar skeleton básico', () => {
      render(<SkeletonLoader />);
      expect(screen.getByRole('status')).toHaveClass('animate-pulse');
    });

    it('deve renderizar múltiplas linhas', () => {
      render(<SkeletonLoader lines={3} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons).toHaveLength(3);
    });

    it('deve renderizar com altura customizada', () => {
      render(<SkeletonLoader height="h-20" />);
      expect(screen.getByRole('status')).toHaveClass('h-20');
    });

    it('deve renderizar skeleton de avatar', () => {
      render(<SkeletonLoader variant="avatar" />);
      expect(screen.getByRole('status')).toHaveClass('rounded-full');
    });

    it('deve renderizar skeleton de card', () => {
      render(<SkeletonLoader variant="card" />);
      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('space-y-3');
    });
  });
});

describe('useOperationFeedback Hook', () => {
  const TestComponent = () => {
    const { state, execute, reset } = useOperationFeedback();
    
    const handleSuccess = () => {
      execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true };
      });
    };
    
    const handleError = () => {
      execute(async () => {
        throw new Error('Test error');
      });
    };
    
    return (
      <div>
        <div data-testid="status">{state.status}</div>
        <div data-testid="error">{state.error?.message || ''}</div>
        <div data-testid="data">{JSON.stringify(state.data)}</div>
        <button onClick={handleSuccess}>Success</button>
        <button onClick={handleError}>Error</button>
        <button onClick={reset}>Reset</button>
      </div>
    );
  };

  it('deve iniciar com status idle', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('deve executar operação com sucesso', async () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Success'));
    
    // Deve mostrar loading
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    
    // Aguardar sucesso
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('success');
    });
    
    expect(screen.getByTestId('data')).toHaveTextContent('{"success":true}');
  });

  it('deve lidar com erro', async () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Error'));
    
    // Aguardar erro
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
    });
    
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('deve resetar estado', async () => {
    render(<TestComponent />);
    
    // Executar operação com erro
    fireEvent.click(screen.getByText('Error'));
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
    });
    
    // Resetar
    fireEvent.click(screen.getByText('Reset'));
    
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('');
  });
});

describe('MetricsDashboard Component', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('deve renderizar dashboard de métricas', async () => {
    render(<MetricsDashboard />, { wrapper });
    
    // Verificar se o título está presente
    expect(screen.getByText('Dashboard de Métricas')).toBeInTheDocument();
    
    // Aguardar carregamento dos dados
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument(); // total_users
    });
  });

  it('deve alternar entre abas', async () => {
    render(<MetricsDashboard />, { wrapper });
    
    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    });
    
    // Clicar na aba de usuários
    fireEvent.click(screen.getByText('Usuários'));
    
    // Verificar se a aba foi alterada
    expect(screen.getByText('Usuários')).toHaveClass('border-blue-500');
  });

  it('deve exibir métricas de usuários', async () => {
    render(<MetricsDashboard />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Usuários Ativos')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });
  });

  it('deve exibir métricas de escolas', async () => {
    render(<MetricsDashboard />, { wrapper });
    
    // Clicar na aba de escolas
    fireEvent.click(screen.getByText('Escolas'));
    
    await waitFor(() => {
      expect(screen.getByText('Total de Escolas')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('deve exibir status de saúde do sistema', async () => {
    render(<MetricsDashboard />, { wrapper });
    
    // Clicar na aba de saúde
    fireEvent.click(screen.getByText('Saúde do Sistema'));
    
    await waitFor(() => {
      expect(screen.getByText('Status Geral')).toBeInTheDocument();
      expect(screen.getByText('Saudável')).toBeInTheDocument();
    });
  });

  it('deve atualizar métricas automaticamente', async () => {
    render(<MetricsDashboard />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });
    
    // Verificar se há indicação de atualização automática
    expect(screen.getByText(/Atualizado/)).toBeInTheDocument();
  });

  it('deve lidar com erro no carregamento', async () => {
    // Mock para simular erro
    const { MetricsService } = await import('../../services/metrics');
    const mockService = new MetricsService();
    vi.mocked(mockService.getBusinessMetrics).mockRejectedValue(new Error('API Error'));
    
    render(<MetricsDashboard />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar/)).toBeInTheDocument();
    });
  });

  it('deve exibir estado de carregamento', () => {
    render(<MetricsDashboard />, { wrapper });
    
    // Verificar se há indicadores de carregamento
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// Testes de acessibilidade
describe('Accessibility Tests', () => {
  it('componentes devem ter roles apropriados', () => {
    render(
      <div>
        <LoadingSpinner />
        <SuccessMessage message="Sucesso" />
        <ErrorMessage message="Erro" />
        <ConnectionStatus isOnline={true} />
      </div>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('botões devem ser acessíveis via teclado', () => {
    const onClose = vi.fn();
    render(<SuccessMessage message="Sucesso" onClose={onClose} />);
    
    const button = screen.getByRole('button');
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('mensagens devem ter aria-labels apropriados', () => {
    render(<ErrorMessage message="Erro crítico" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });
});

// Testes de responsividade
describe('Responsive Tests', () => {
  it('componentes devem se adaptar a diferentes tamanhos', () => {
    render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');
    
    render(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8');
  });

  it('dashboard deve ser responsivo', async () => {
    const wrapper = createWrapper();
    render(<MetricsDashboard />, { wrapper });
    
    // Verificar se há classes responsivas
    const container = screen.getByText('Dashboard de Métricas').closest('div');
    expect(container).toHaveClass('p-6');
  });
});