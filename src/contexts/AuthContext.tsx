// FILE: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authLogger } from '../services/logger'
import { ErrorHandler, retryWithBackoff, AuthenticationError } from '../services/errorHandler';
import { useRealTimeValidation } from '../hooks/useRealTimeValidation';
import { userCache } from '../services/cache';
import { rateLimiter, RateLimitType } from '../services/rateLimiter';
import { auditService } from '../services/auditService';
import { validateData, registerSchema, loginSchema, inviteUserSchema, type RegisterData, type LoginData, type InviteUserData } from '@/schemas/validation';



// Mova esta função para fora do componente para que não dependa de `this`
const getAuthErrorMessage = (error: any): string => {
  const errorMessage = error?.message?.toLowerCase() || '';

  if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid')) {
    return 'Email ou senha incorretos';
  }
  if (errorMessage.includes('email already registered') || errorMessage.includes('already registered')) {
    return 'Este email já está cadastrado';
  }
  if (errorMessage.includes('weak password') || errorMessage.includes('password')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres';
  }
  if (errorMessage.includes('email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada';
  }
  if (errorMessage.includes('too many requests')) {
    return 'Muitas tentativas. Tente novamente em alguns minutos';
  }
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Erro de conexão. Verifique sua internet';
  }

  // Fallback para erros não mapeados
  return error?.message || 'Erro desconhecido';
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: RegisterData) => Promise<{ success: boolean; error?: any; needsEmailConfirmation?: boolean }>;
  signIn: (data: LoginData) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  inviteUser: (data: InviteUserData) => Promise<{ success: boolean; error?: any }>;
  refreshSession: () => Promise<void>;
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimitAttempts, setRateLimitAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  
  const errorHandler = ErrorHandler.getInstance();

  // Método para retry automático de operações críticas
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string,
    context: Record<string, any> = {},
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        authLogger.trace(`Tentativa ${attempt} de ${operationName}`, {
          action: operationName,
          attempt,
          maxRetries,
          ...context
        });
        
        const result = await operation();
        
        if (attempt > 1) {
          authLogger.info(`${operationName} bem-sucedido após ${attempt} tentativas`, {
            action: operationName,
            attempt,
            ...context
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        authLogger.warn(`Tentativa ${attempt} de ${operationName} falhou`, {
          action: operationName,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
          ...context
        });
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    authLogger.error(`${operationName} falhou após ${maxRetries} tentativas`, {
      action: operationName,
      maxRetries,
      ...context
    }, lastError);
    
    throw lastError;
  };

  useEffect(() => {
    authLogger.info('Inicializando AuthContext');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        authLogger.info('Evento de autenticação', {
          event,
          userEmail: session?.user?.email,
          userId: session?.user?.id
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        authLogger.error('Erro ao obter sessão existente', { error: error.message }, error);
      } else {
        authLogger.info('Sessão existente verificada', {
          hasSession: !!session,
          userEmail: session?.user?.email
        });
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authLogger.debug('Limpando subscription do AuthContext');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: RegisterData) => {
    try {
      // Verificar rate limiting
      const rateLimitResult = rateLimiter.checkSignup(data.email);
      if (!rateLimitResult.allowed) {
        const config = rateLimiter.getConfig(RateLimitType.SIGNUP);
        const message = config?.message || 'Muitas tentativas de cadastro. Tente novamente mais tarde.';
        authLogger.warn(`Rate limit excedido para registro: ${data.email}`);
        toast.error(message);
        return { success: false, error: { message: 'Rate limit excedido' } };
      }

      const validation = validateData(registerSchema, data, 'registerForm');
      if (!validation.success) {
        const errorMessages = Object.values(validation.errors).join(', ');
        authLogger.warn('Dados de registro inválidos', { component: 'Auth', errors: validation.errors });
        toast.error(`Dados inválidos: ${errorMessages}`);
        return { success: false, error: { message: 'Dados de registro inválidos', details: validation.errors } };
      }

      const { email, password, directorName, schoolName, phone } = validation.data;

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: directorName,
            nome_escola: schoolName,
            telefone: phone,
            tipo_usuario: 'diretor',
            school_id: null // Adicionar campo school_id para evitar erro, ajustar conforme necessário
          },
        },
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        authLogger.error('Erro ao criar usuário', { 
          action: 'signUp', 
          email: data.email, 
          errorCode: error.status, 
          errorMessage: error.message 
        }, error);
        toast.error(errorMessage);
        return { success: false, error };
      }

      const needsEmailConfirmation = !!signUpData.user && !signUpData.user.email_confirmed_at;

      if (needsEmailConfirmation) {
        toast.success('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      } else {
        toast.success('Cadastro realizado com sucesso!');
      }

      authLogger.info('Usuário cadastrado com sucesso', { 
        action: 'signUp', 
        email: data.email, 
        userId: signUpData.user?.id, 
        needsConfirmation: needsEmailConfirmation 
      });

      return { success: true, needsEmailConfirmation };
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err);
      authLogger.error('Erro inesperado no processo de signUp', { 
        action: 'signUp', 
        email: data.email, 
        error: err instanceof Error ? err.message : String(err) 
      }, err as Error);
      toast.error(errorMessage);
      return { success: false, error: err };
    }
  };

  const signIn = async (data: LoginData) => {
    try {
      // Verificar rate limiting
      const rateLimitResult = rateLimiter.checkLogin(data.email);
      if (!rateLimitResult.allowed) {
        const config = rateLimiter.getConfig(RateLimitType.LOGIN);
        const message = config?.message || 'Muitas tentativas de login. Tente novamente mais tarde.';
        authLogger.warn(`Rate limit excedido para ${data.email}`);
        await auditService.logLogin(false, undefined, message);
        toast.error(message);
        return { success: false, error: { message: 'Rate limit excedido' } };
      }
      
      // Validar dados de entrada
      const validation = validateData(loginSchema, data)
      if (!validation.success) {
        const errorMessage = validation.errors.join(', ')
        authLogger.warn('Dados de login inválidos', { errors: validation.errors })
        toast.error(`Dados inválidos: ${errorMessage}`)
        return { success: false, error: { message: errorMessage } }
      }

      const { email, password } = validation.data
      
      const timer = authLogger.time('user-login', {
        action: 'signIn',
        email
      });
      
      authLogger.info('Tentativa de login', {
        action: 'signIn',
        email
      })
      
      const signInOperation = async () => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          authLogger.warn('Falha no login', {
            action: 'signIn',
            email,
            errorCode: error.status,
            errorMessage: error.message
          });
          
          await auditService.logLogin(false, undefined, error.message);
          throw new AuthenticationError(error.message);
        }

        return authData;
      };

      const authData = await retryWithBackoff(signInOperation, 2, 1000);
      
      // Reset rate limit após login bem-sucedido
      rateLimiter.resetLimit(RateLimitType.LOGIN, data.email);
      
      // Log de auditoria
      await auditService.logLogin(true, authData.user?.id);
      
      timer();
      authLogger.info('Login realizado com sucesso', {
        action: 'signIn',
        email: authData.user?.email,
        userId: authData.user?.id
      });
      
      // Cache dos dados do usuário
      if (authData.user) {
        userCache.set(`user_${authData.user.id}`, authData.user, 15 * 60 * 1000);
      }
      if (authData.session) {
        userCache.set(`session_${authData.user?.id}`, authData.session, 15 * 60 * 1000);
      }
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      authLogger.error('Erro inesperado no login', {
        action: 'signIn',
        email: data.email
      }, error as Error);
      await auditService.logLogin(false, undefined, (error as Error).message);
      errorHandler.handleError(error, 'Erro inesperado no login');
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      authLogger.info('Iniciando logout', { userId: user?.id })
      
      const signOutOperation = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          authLogger.error('Erro no logout', {
            userId: user?.id,
            error: error.message
          }, error);
          throw new AuthenticationError(error.message);
        }
      };

      await retryWithBackoff(signOutOperation, 2, 500);
      
      // Limpar cache do usuário
      if (user) {
        userCache.delete(`user_${user.id}`);
        userCache.delete(`session_${user.id}`);
      }
      

      
      authLogger.info('Logout realizado com sucesso', { userId: user?.id })
      toast.success('Logout realizado com sucesso!')
      return { success: true }
    } catch (error) {
      authLogger.error('Erro inesperado no logout', {
        userId: user?.id
      }, error as Error)
      errorHandler.handleError(error, 'Erro inesperado no logout')
      return { success: false, error }
    }
  };

  const inviteUser = async (data: InviteUserData) => {
    try {
      // Validar dados de entrada
      const validation = validateData(inviteUserSchema, data)
      if (!validation.success) {
        const errorMessage = validation.errors.join(', ')
        authLogger.warn('Dados de convite inválidos', { errors: validation.errors })
        toast.error(`Dados inválidos: ${errorMessage}`)
        return { success: false, error: { message: errorMessage } }
      }

      const { email, nomeCompleto, tipoUsuario, schoolId } = validation.data
      
      authLogger.info('Convidando usuário', {
        email,
        nomeCompleto: nomeCompleto,
        tipoUsuario,
        schoolId,
        invitedBy: user?.id
      })
      
      const inviteOperation = async () => {
        // Nota: Esta função precisa ser implementada como uma Edge Function do Supabase
        // pois requer privilégios de admin para convidar usuários
        const { data: responseData, error } = await supabase.functions.invoke('invite-user', {
          body: {
            email,
            nome_completo: nomeCompleto,
            tipo_usuario: tipoUsuario,
            school_id: schoolId
          }
        });

        if (error) {
          authLogger.error('Erro ao convidar usuário', {
            email,
            tipoUsuario,
            schoolId,
            error: error.message,
            invitedBy: user?.id
          }, error);
          throw new AuthenticationError(error.message);
        }

        return responseData;
      };

      await retryWithBackoff(inviteOperation, 3, 1000);

      authLogger.info('Convite enviado com sucesso', {
        email,
        tipoUsuario,
        schoolId,
        invitedBy: user?.id
      })
      toast.success('Convite enviado com sucesso!')
      return { success: true }
    } catch (error) {
      authLogger.error('Erro inesperado ao convidar usuário', {
        email: data.email,
        invitedBy: user?.id
      }, error as Error)
      errorHandler.handleError(error, 'Erro inesperado ao enviar convite')
      return { success: false, error }
    }
  };

  const refreshSession = async () => {
    try {
      authLogger.info('Atualizando sessão');
      
      const refreshOperation = async () => {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          authLogger.error('Erro ao atualizar sessão', { error: error.message });
          throw new AuthenticationError(error.message);
        }
        
        return data;
      };
      
      const data = await retryWithBackoff(refreshOperation, 2, 1000);
      
      if (data.session && data.user) {
        // Atualizar cache
        userCache.set(`user_${data.user.id}`, data.user, 15 * 60 * 1000);
        userCache.set(`session_${data.user.id}`, data.session, 15 * 60 * 1000);
      }
      
      authLogger.info('Sessão atualizada com sucesso');
    } catch (error: any) {
      authLogger.error('Falha ao atualizar sessão', {}, error);
      errorHandler.handleError(error, 'Erro ao atualizar sessão');
      throw error;
    }
  };
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    inviteUser,
    refreshSession,
    validateEmail,
    validatePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}