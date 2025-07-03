/**
 * Componente ErrorBoundary para capturar e tratar erros React
 * Integrado com logging e monitoramento
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/services/logger'
import { monitoring } from '@/services/monitoring'
import { config } from '@/config/environment'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualiza o state para mostrar a UI de erro
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'
    
    // Log detalhado do erro
    logger.error('Erro capturado pelo ErrorBoundary', {
      errorId,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary'
    }, error)
    
    // Registrar no monitoramento
    monitoring.recordError({
      message: `ErrorBoundary: ${error.message}`,
      error,
      type: 'custom',
      context: {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    })
    
    // Atualizar state com informações do erro
    this.setState({
      errorInfo
    })
    
    // Callback customizado
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    logger.info('Usuário tentando recuperar do erro', {
      errorId: this.state.errorId
    })
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleGoHome = () => {
    logger.info('Usuário navegando para home após erro', {
      errorId: this.state.errorId
    })
    
    window.location.href = '/'
  }

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state
    
    logger.info('Usuário reportando erro', { errorId })
    
    // Preparar dados do erro para report
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }
    
    // Copiar para clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Informações do erro copiadas para a área de transferência!')
      })
      .catch(() => {
        // Fallback: mostrar em um prompt
        prompt('Copie as informações do erro:', JSON.stringify(errorReport, null, 2))
      })
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, errorId } = this.state
      const showDetails = this.props.showDetails ?? config.isDevelopment

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            {/* Ícone e título */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Oops! Algo deu errado
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Encontramos um erro inesperado. Nossa equipe foi notificada.
              </p>
            </div>

            {/* ID do erro */}
            {errorId && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>ID do Erro:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{errorId}</code>
                </p>
              </div>
            )}

            {/* Detalhes do erro (apenas em desenvolvimento) */}
            {showDetails && error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Detalhes do Erro
                </h3>
                <div className="space-y-2">
                  <div>
                    <strong className="text-red-700 dark:text-red-300">Mensagem:</strong>
                    <p className="text-red-600 dark:text-red-400 font-mono text-sm bg-red-100 dark:bg-red-900/40 p-2 rounded mt-1">
                      {error.message}
                    </p>
                  </div>
                  
                  {error.stack && (
                    <div>
                      <strong className="text-red-700 dark:text-red-300">Stack Trace:</strong>
                      <pre className="text-red-600 dark:text-red-400 font-mono text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded mt-1 overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <strong className="text-red-700 dark:text-red-300">Component Stack:</strong>
                      <pre className="text-red-600 dark:text-red-400 font-mono text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded mt-1 overflow-auto max-h-40">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Home className="w-4 h-4" />
                Ir para Início
              </Button>
              
              {config.isDevelopment && (
                <Button
                  onClick={this.handleReportError}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Bug className="w-4 h-4" />
                  Copiar Erro
                </Button>
              )}
            </div>

            {/* Informações de contato */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Se o problema persistir, entre em contato com o suporte em{' '}
                <a 
                  href={config.urls.support}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {config.urls.support.replace('mailto:', '')}
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Hook para usar ErrorBoundary programaticamente
export const useErrorHandler = () => {
  return {
    captureError: (error: Error, context?: Record<string, any>) => {
      logger.error('Erro capturado programaticamente', context, error)
      
      monitoring.recordError({
        message: error.message,
        error,
        type: 'custom',
        context
      })
    },
    
    captureException: (message: string, context?: Record<string, any>) => {
      const error = new Error(message)
      
      logger.error('Exceção capturada programaticamente', context, error)
      
      monitoring.recordError({
        message,
        error,
        type: 'custom',
        context
      })
    }
  }
}

// Componente wrapper para facilitar o uso
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}