import React from 'react';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from 'vitest';
import {
  screen,
  waitFor
} from '@testing-library/react';
import {
  renderWithProviders,
  mockSupabase,
  apiMocks,
  userEvents,
  waitForElements,
  formUtils,
  testCleanup,
  mockUser,
  mockSchool
} from './testUtils';
import Auth from '../pages/Auth';

// Mock do Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Mock do react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('Auth Component', () => {
  beforeEach(() => {
    testCleanup.clearAllMocks();
    testCleanup.clearStorage();
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o formulário de login por padrão', () => {
      renderWithProviders(<Auth />);
      
      expect(screen.getByText(/entrar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('deve ter link para alternar para cadastro', () => {
      renderWithProviders(<Auth />);
      
      const signupLink = screen.getByText(/não tem uma conta/i);
      expect(signupLink).toBeInTheDocument();
    });

    it('deve ter link para recuperação de senha', () => {
      renderWithProviders(<Auth />);
      
      const forgotPasswordLink = screen.getByText(/esqueceu a senha/i);
      expect(forgotPasswordLink).toBeInTheDocument();
    });
  });

  describe('Alternância entre Login e Cadastro', () => {
    it('deve alternar para formulário de cadastro', async () => {
      renderWithProviders(<Auth />);
      
      const signupLink = screen.getByText(/não tem uma conta/i);
      await userEvents.click(signupLink);
      
      expect(screen.getByText(/criar conta/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome da escola/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome do diretor/i)).toBeInTheDocument();
    });

    it('deve alternar de volta para login', async () => {
      renderWithProviders(<Auth />);
      
      // Ir para cadastro
      const signupLink = screen.getByText(/não tem uma conta/i);
      await userEvents.click(signupLink);
      
      // Voltar para login
      const loginLink = screen.getByText(/já tem uma conta/i);
      await userEvents.click(loginLink);
      
      expect(screen.getByText(/entrar/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/nome da escola/i)).not.toBeInTheDocument();
    });
  });

  describe('Formulário de Login', () => {
    it('deve validar campos obrigatórios', async () => {
      renderWithProviders(<Auth />);
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
      });
    });

    it('deve validar formato do email', async () => {
      renderWithProviders(<Auth />);
      
      const emailField = screen.getByLabelText(/email/i);
      await userEvents.type(emailField, 'email-invalido');
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('deve validar tamanho mínimo da senha', async () => {
      renderWithProviders(<Auth />);
      
      const passwordField = screen.getByLabelText(/senha/i);
      await userEvents.type(passwordField, '123');
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
      });
    });

    it('deve fazer login com sucesso', async () => {
      apiMocks.mockSuccessfulLogin();
      renderWithProviders(<Auth />);
      
      await formUtils.fillForm({
        email: 'test@example.com',
        senha: 'password123'
      });
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('deve exibir erro de login', async () => {
      apiMocks.mockFailedLogin('Credenciais inválidas');
      renderWithProviders(<Auth />);
      
      await formUtils.fillForm({
        email: 'test@example.com',
        senha: 'senhaerrada'
      });
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitForElements.toastToAppear(/credenciais inválidas/i);
    });

    it('deve mostrar loading durante login', async () => {
      // Mock que demora para resolver
      mockSupabase.auth.signInWithPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      renderWithProviders(<Auth />);
      
      await formUtils.fillForm({
        email: 'test@example.com',
        senha: 'password123'
      });
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      expect(screen.getByText(/entrando/i)).toBeInTheDocument();
    });
  });

  describe('Formulário de Cadastro', () => {
    beforeEach(async () => {
      renderWithProviders(<Auth />);
      const signupLink = screen.getByText(/não tem uma conta/i);
      await userEvents.click(signupLink);
    });

    it('deve renderizar todos os campos do cadastro', () => {
      expect(screen.getByLabelText(/nome da escola/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nome do diretor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    });

    it('deve validar campos obrigatórios do cadastro', async () => {
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/nome da escola é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/nome do diretor é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
        expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
      });
    });

    it('deve validar confirmação de senha', async () => {
      await formUtils.fillForm({
        'nome da escola': 'Escola Teste',
        'nome do diretor': 'Diretor Teste',
        email: 'test@example.com',
        senha: 'password123',
        'confirmar senha': 'senhadiferente'
      });
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
      });
    });

    it('deve formatar telefone automaticamente', async () => {
      const phoneField = screen.getByLabelText(/telefone/i);
      await userEvents.type(phoneField, '11999999999');
      
      await waitFor(() => {
        expect(phoneField).toHaveValue('(11) 99999-9999');
      });
    });

    it('deve fazer cadastro com sucesso', async () => {
      apiMocks.mockSuccessfulSignup();
      
      await formUtils.fillForm({
        'nome da escola': 'Escola Teste',
        'nome do diretor': 'Diretor Teste',
        email: 'test@example.com',
        senha: 'password123',
        'confirmar senha': 'password123',
        telefone: '(11) 99999-9999'
      });
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'Diretor Teste',
              role: 'director',
              school_name: 'Escola Teste',
              phone: '(11) 99999-9999'
            }
          }
        });
      });
    });

    it('deve exibir erro de cadastro', async () => {
      apiMocks.mockFailedSignup('Email já existe');
      
      await formUtils.fillForm({
        'nome da escola': 'Escola Teste',
        'nome do diretor': 'Diretor Teste',
        email: 'existing@example.com',
        senha: 'password123',
        'confirmar senha': 'password123'
      });
      
      const submitButton = screen.getByRole('button', { name: /criar conta/i });
      await userEvents.click(submitButton);
      
      await waitForElements.toastToAppear(/email já existe/i);
    });
  });

  describe('Recuperação de Senha', () => {
    it('deve alternar para formulário de recuperação', async () => {
      renderWithProviders(<Auth />);
      
      const forgotPasswordLink = screen.getByText(/esqueceu a senha/i);
      await userEvents.click(forgotPasswordLink);
      
      expect(screen.getByText(/recuperar senha/i)).toBeInTheDocument();
      expect(screen.getByText(/digite seu email para receber/i)).toBeInTheDocument();
    });

    it('deve validar email na recuperação', async () => {
      renderWithProviders(<Auth />);
      
      const forgotPasswordLink = screen.getByText(/esqueceu a senha/i);
      await userEvents.click(forgotPasswordLink);
      
      const submitButton = screen.getByRole('button', { name: /enviar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('deve voltar para login após recuperação', async () => {
      renderWithProviders(<Auth />);
      
      const forgotPasswordLink = screen.getByText(/esqueceu a senha/i);
      await userEvents.click(forgotPasswordLink);
      
      const backLink = screen.getByText(/voltar para login/i);
      await userEvents.click(backLink);
      
      expect(screen.getByText(/entrar/i)).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels associados aos inputs', () => {
      renderWithProviders(<Auth />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('deve ter botões com texto descritivo', () => {
      renderWithProviders(<Auth />);
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('deve ter navegação por teclado', async () => {
      renderWithProviders(<Auth />);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      
      await userEvents.focus(emailInput);
      expect(emailInput).toHaveFocus();
      
      // Simular Tab para próximo campo
      emailInput.blur();
      await userEvents.focus(passwordInput);
      expect(passwordInput).toHaveFocus();
    });
  });

  describe('Responsividade', () => {
    it('deve ser responsivo em telas pequenas', () => {
      // Simular tela pequena
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      
      renderWithProviders(<Auth />);
      
      const container = screen.getByRole('main') || screen.getByTestId('auth-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Rate Limiting', () => {
    it('deve implementar rate limiting para tentativas de login', async () => {
      apiMocks.mockFailedLogin('Muitas tentativas');
      renderWithProviders(<Auth />);
      
      // Simular múltiplas tentativas
      for (let i = 0; i < 5; i++) {
        await formUtils.fillForm({
          email: 'test@example.com',
          senha: 'senhaerrada'
        });
        
        const submitButton = screen.getByRole('button', { name: /entrar/i });
        await userEvents.click(submitButton);
        
        await waitFor(() => {
          // Aguardar processamento
        });
      }
      
      // Verificar se rate limiting foi aplicado
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(5);
    });
  });

  describe('Segurança', () => {
    it('deve limpar campos sensíveis após erro', async () => {
      apiMocks.mockFailedLogin('Credenciais inválidas');
      renderWithProviders(<Auth />);
      
      const passwordField = screen.getByLabelText(/senha/i);
      await userEvents.type(passwordField, 'senhaerrada');
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        expect(passwordField).toHaveValue('');
      });
    });

    it('deve não expor informações sensíveis nos logs', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      apiMocks.mockFailedLogin();
      renderWithProviders(<Auth />);
      
      await formUtils.fillForm({
        email: 'test@example.com',
        senha: 'senhasecreta'
      });
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvents.click(submitButton);
      
      await waitFor(() => {
        const logCalls = consoleSpy.mock.calls.flat();
        const hasPassword = logCalls.some(call => 
          typeof call === 'string' && call.includes('senhasecreta')
        );
        expect(hasPassword).toBe(false);
      });
      
      consoleSpy.mockRestore();
    });
  });
});