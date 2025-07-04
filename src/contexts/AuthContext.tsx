// FILE: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { authLogger } from '../services/logger'
import { validateData, registerSchema, loginSchema, inviteUserSchema, type RegisterData, type LoginData, type InviteUserData } from '@/schemas/validation';

// Rate limiting para prevenir ataques de força bruta
class RateLimiter {
  private attempts = new Map<string, number[]>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 5 * 60 * 1000; // 5 minutos

  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Remove tentativas antigas
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false; // Rate limit excedido
    }
    
    // Adiciona nova tentativa
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return true; // Permitido
  }

  getRemainingTime(identifier: string): number {
    const attempts = this.attempts.get(identifier) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const timeRemaining = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, Math.ceil(timeRemaining / 1000 / 60)); // em minutos
  }
}

const rateLimiter = new RateLimiter();

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (!rateLimiter.checkRateLimit(data.email)) {
        const remainingTime = rateLimiter.getRemainingTime(data.email);
        authLogger.warn(`Rate limit excedido para registro: ${data.email}`);
        toast.error(`Muitas tentativas de cadastro. Tente novamente em ${remainingTime} minutos.`);
        return { success: false, error: { message: 'Rate limit excedido' } };
      }
      
      const validation = validateData(registerSchema, data);
      if (!validation.success) {
        const errorMessage = validation.errors.join(', ');
        authLogger.warn('Dados de registro inválidos', { errors: validation.errors });
        toast.error(`Dados inválidos: ${errorMessage}`);
        return { success: false, error: { message: errorMessage } };
      }

      const { email, password, directorName, schoolName } = validation.data;
      
      const timer = authLogger.time('user-registration', {
        action: 'signUp',
        email
      });
      
      authLogger.info('Iniciando processo de registro', {
        action: 'signUp',
        email,
        directorName,
        schoolName
      });
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: directorName,
            nome_escola: schoolName,
            tipo_usuario: 'diretor'
          }
        }
      });

      if (signUpError) {
        timer();
        authLogger.error('Erro ao criar usuário', {
          action: 'signUp',
          email,
          errorCode: signUpError.status,
          errorMessage: signUpError.message
        }, signUpError);
        
        const userFriendlyMessage = getAuthErrorMessage(signUpError);
        toast.error(userFriendlyMessage);
        return { success: false, error: signUpError };
      }
      
      timer();
      authLogger.info('Usuário criado com sucesso', {
        action: 'signUp',
        email: authData?.user?.email,
        userId: authData?.user?.id,
        needsConfirmation: !authData?.session
      });

      if (!authData?.session) {
        toast.info('Verifique seu email para confirmar a conta');
        return { success: true, needsEmailConfirmation: true };
      }

      authLogger.info('Fazendo login automático após registro', {
        action: 'autoLogin',
        email
      });
      
      const loginResult = await retryOperation(
        () => signIn({ email, password }),
        'autoLogin',
        { email }
      );
      
      if (loginResult.success) {
        authLogger.info('Registro e login completados com sucesso', {
          action: 'signUp',
          email
        });
        toast.success('Conta criada com sucesso!');
      }
      
      return loginResult;
    } catch (error) {
      authLogger.error('Erro inesperado no processo de registro', {
        action: 'signUp',
        email: data.email
      }, error as Error);
      toast.error('Erro inesperado no registro');
      return { success: false, error };
    }
  };

  const signIn = async (data: LoginData) => {
    try {
      // Verificar rate limiting
      if (!rateLimiter.checkRateLimit(data.email)) {
        const remainingTime = rateLimiter.getRemainingTime(data.email);
        authLogger.warn(`Rate limit excedido para ${data.email}`);
        toast.error(`Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`);
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
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        timer();
        authLogger.warn('Falha no login', {
          action: 'signIn',
          email,
          errorCode: error.status,
          errorMessage: error.message
        });
        
        const userFriendlyMessage = getAuthErrorMessage(error);
        toast.error(userFriendlyMessage);
        return { success: false, error };
      }
      
      timer();
      authLogger.info('Login realizado com sucesso', {
        action: 'signIn',
        email: authData.user?.email,
        userId: authData.user?.id
      });
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      authLogger.error('Erro inesperado no login', {
        action: 'signIn',
        email: data.email
      }, error as Error);
      toast.error('Erro inesperado no login');
      return { success: false, error };
    }
  };

  const signOut = async () => {
    // ... (código do signOut)
    try {
      authLogger.info('Iniciando logout', { userId: user?.id })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        authLogger.error('Erro no logout', {
          userId: user?.id,
          error: error.message
        }, error)
        toast.error('Erro ao fazer logout')
        return { success: false, error }
      }
      
      authLogger.info('Logout realizado com sucesso', { userId: user?.id })
      toast.success('Logout realizado com sucesso!')
      return { success: true }
    } catch (error) {
      authLogger.error('Erro inesperado no logout', {
        userId: user?.id
      }, error as Error)
      toast.error('Erro inesperado no logout')
      return { success: false, error }
    }
  };

  const inviteUser = async (data: InviteUserData) => {
    // ... (código do inviteUser)
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
      
      // Nota: Esta função precisa ser implementada como uma Edge Function do Supabase
      // pois requer privilégios de admin para convidar usuários
      const { data: responseData, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          nome_completo: nomeCompleto,
          tipo_usuario: tipoUsuario,
          school_id: schoolId
        }
      })

      if (error) {
        authLogger.error('Erro ao convidar usuário', {
          email,
          tipoUsuario,
          schoolId,
          error: error.message,
          invitedBy: user?.id
        }, error)
        toast.error('Erro ao enviar convite: ' + error.message)
        return { success: false, error }
      }

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
      toast.error('Erro inesperado ao enviar convite')
      return { success: false, error }
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    inviteUser
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