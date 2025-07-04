import { toast } from '@/hooks/use-toast';
import { authLogger } from './logger';

/**
 * Tipos de erro personalizados
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Configurações de retry
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'DatabaseError',
    'PGRST301', // Supabase timeout
    'PGRST116', // Supabase connection error
  ]
};

/**
 * Função de retry com backoff exponencial
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {},
  context: Record<string, any> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      authLogger.info(`Tentativa ${attempt} de ${operationName}`, {
        operation: operationName,
        attempt,
        maxAttempts: finalConfig.maxAttempts,
        ...context
      });
      
      const result = await operation();
      
      if (attempt > 1) {
        authLogger.info(`${operationName} bem-sucedido após ${attempt} tentativas`, {
          operation: operationName,
          attempt,
          ...context
        });
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      const isRetryable = finalConfig.retryableErrors.some(errorType => 
        error.name === errorType || 
        error.code === errorType ||
        error.message?.includes(errorType)
      );
      
      if (!isRetryable || attempt === finalConfig.maxAttempts) {
        authLogger.error(`${operationName} falhou definitivamente`, {
          operation: operationName,
          attempt,
          maxAttempts: finalConfig.maxAttempts,
          error: error.message,
          isRetryable,
          ...context
        }, error);
        break;
      }
      
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );
      
      authLogger.warn(`${operationName} falhou, tentando novamente em ${delay}ms`, {
        operation: operationName,
        attempt,
        nextDelay: delay,
        error: error.message,
        ...context
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Handler global de erros
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Processa e exibe erro para o usuário
   */
  handleError(error: any, context: string = 'Operação'): void {
    const errorInfo = this.parseError(error);
    
    authLogger.error(`Erro em ${context}`, {
      context,
      errorType: errorInfo.type,
      errorMessage: errorInfo.message,
      errorCode: errorInfo.code
    }, error);
    
    // Exibir toast apropriado
    toast.error(errorInfo.userMessage);
  }
  
  /**
   * Analisa o erro e retorna informações estruturadas
   */
  private parseError(error: any): {
    type: string;
    message: string;
    code?: string;
    userMessage: string;
  } {
    // Erro de validação
    if (error instanceof ValidationError) {
      return {
        type: 'ValidationError',
        message: error.message,
        userMessage: `Dados inválidos: ${error.message}`
      };
    }
    
    // Erro de autenticação
    if (error instanceof AuthenticationError) {
      return {
        type: 'AuthenticationError',
        message: error.message,
        code: error.code,
        userMessage: this.getAuthErrorMessage(error)
      };
    }
    
    // Erro de banco de dados
    if (error instanceof DatabaseError) {
      return {
        type: 'DatabaseError',
        message: error.message,
        userMessage: 'Erro no banco de dados. Tente novamente em alguns instantes.'
      };
    }
    
    // Erros do Supabase
    if (error?.code) {
      return {
        type: 'SupabaseError',
        message: error.message,
        code: error.code,
        userMessage: this.getSupabaseErrorMessage(error)
      };
    }
    
    // Erro genérico
    return {
      type: 'UnknownError',
      message: error?.message || 'Erro desconhecido',
      userMessage: 'Ocorreu um erro inesperado. Tente novamente.'
    };
  }
  
  /**
   * Mensagens amigáveis para erros de autenticação
   */
  private getAuthErrorMessage(error: AuthenticationError): string {
    const errorMessages: Record<string, string> = {
      'invalid_credentials': 'Email ou senha incorretos.',
      'email_not_confirmed': 'Confirme seu email antes de fazer login.',
      'signup_disabled': 'Cadastro temporariamente desabilitado.',
      'email_already_exists': 'Este email já está cadastrado.',
      'weak_password': 'A senha deve ter pelo menos 6 caracteres.',
      'invalid_email': 'Email inválido.',
      'rate_limit_exceeded': 'Muitas tentativas. Tente novamente mais tarde.'
    };
    
    return errorMessages[error.code || ''] || error.message;
  }
  
  /**
   * Mensagens amigáveis para erros do Supabase
   */
  private getSupabaseErrorMessage(error: any): string {
    const errorMessages: Record<string, string> = {
      'PGRST301': 'Tempo limite excedido. Tente novamente.',
      'PGRST116': 'Erro de conexão. Verifique sua internet.',
      '23505': 'Este registro já existe.',
      '23503': 'Não é possível excluir este registro pois está sendo usado.',
      '42501': 'Você não tem permissão para esta operação.'
    };
    
    return errorMessages[error.code] || 'Erro no servidor. Tente novamente.';
  }
}

/**
 * Hook para usar o error handler
 */
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();
  
  return {
    handleError: errorHandler.handleError.bind(errorHandler),
    retryOperation: retryWithBackoff
  };
}

/**
 * Decorator para adicionar retry automático a métodos
 */
export function withRetry(config?: Partial<RetryConfig>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return retryWithBackoff(
        () => method.apply(this, args),
        `${target.constructor.name}.${propertyName}`,
        config,
        { args: args.length }
      );
    };
  };
}