import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';
import { SchoolProvider } from '../contexts/SchoolContext';
import { UserProfileProvider } from '../contexts/UserProfileContext';

// Mock dos serviços
vi.mock('../services/monitoring', () => ({
  monitoring: {
    init: vi.fn(),
    recordEvent: vi.fn(),
    recordError: vi.fn(),
    recordMetric: vi.fn()
  }
}));

// Mock dos componentes lazy
vi.mock('../components/LazyRoute', () => ({
  LazyDashboard: () => <div data-testid="dashboard">Dashboard</div>,
  LazyAlunos: () => <div data-testid="alunos">Alunos</div>,
  LazyProfessores: () => <div data-testid="professores">Professores</div>,
  LazyTurmas: () => <div data-testid="turmas">Turmas</div>,
  LazyComunicacao: () => <div data-testid="comunicacao">Comunicação</div>,
  LazyFinanceiro: () => <div data-testid="financeiro">Financeiro</div>,
  LazyCursos: () => <div data-testid="cursos">Cursos</div>,
  LazyRelatorios: () => <div data-testid="relatorios">Relatórios</div>,
  LazyProfile: () => <div data-testid="profile">Profile</div>
}));

// Mock do ProtectedRoute para permitir acesso durante os testes
vi.mock('../components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock do ErrorBoundary
vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Wrapper de teste com todos os providers necessários
const TestWrapper = ({ children, initialEntries = ['/'] }: { 
  children: React.ReactNode;
  initialEntries?: string[];
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <AuthProvider>
      <SchoolProvider>
        <UserProfileProvider>
          {children}
        </UserProfileProvider>
      </SchoolProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe('Sistema de Roteamento', () => {
  it('deve renderizar a página inicial na rota /', () => {
    render(
      <TestWrapper initialEntries={['/']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByText(/smartclass/i)).toBeInTheDocument();
  });

  it('deve redirecionar /login para /auth', () => {
    render(
      <TestWrapper initialEntries={['/login']}>
        <App />
      </TestWrapper>
    );
    
    // Verifica se está na página de autenticação
    expect(screen.getByText(/entrar/i)).toBeInTheDocument();
  });

  it('deve redirecionar /register para /auth', () => {
    render(
      <TestWrapper initialEntries={['/register']}>
        <App />
      </TestWrapper>
    );
    
    // Verifica se está na página de autenticação
    expect(screen.getByText(/entrar/i)).toBeInTheDocument();
  });

  it('deve renderizar a página de autenticação na rota /auth', () => {
    render(
      <TestWrapper initialEntries={['/auth']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByText(/entrar/i)).toBeInTheDocument();
  });

  it('deve renderizar o dashboard na rota /dashboard', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('deve renderizar a página de alunos na rota /alunos', () => {
    render(
      <TestWrapper initialEntries={['/alunos']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('alunos')).toBeInTheDocument();
  });

  it('deve renderizar a página de professores na rota /professores', () => {
    render(
      <TestWrapper initialEntries={['/professores']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('professores')).toBeInTheDocument();
  });

  it('deve renderizar a página de turmas na rota /turmas', () => {
    render(
      <TestWrapper initialEntries={['/turmas']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('turmas')).toBeInTheDocument();
  });

  it('deve renderizar a página de cursos na rota /cursos', () => {
    render(
      <TestWrapper initialEntries={['/cursos']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('cursos')).toBeInTheDocument();
  });

  it('deve renderizar a página financeira na rota /financeiro', () => {
    render(
      <TestWrapper initialEntries={['/financeiro']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('financeiro')).toBeInTheDocument();
  });

  it('deve renderizar a página de comunicação na rota /comunicacao', () => {
    render(
      <TestWrapper initialEntries={['/comunicacao']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('comunicacao')).toBeInTheDocument();
  });

  it('deve renderizar a página de relatórios na rota /relatorios', () => {
    render(
      <TestWrapper initialEntries={['/relatorios']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('relatorios')).toBeInTheDocument();
  });

  it('deve renderizar a página de perfil na rota /profile', () => {
    render(
      <TestWrapper initialEntries={['/profile']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByTestId('profile')).toBeInTheDocument();
  });

  it('deve renderizar a página 404 para rotas inexistentes', () => {
    render(
      <TestWrapper initialEntries={['/rota-inexistente']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument();
  });

  it('deve sugerir rotas similares na página 404', () => {
    render(
      <TestWrapper initialEntries={['/aluno']}>
        <App />
      </TestWrapper>
    );
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/talvez você estava procurando por/i)).toBeInTheDocument();
  });
});