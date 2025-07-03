/**
 * Configurações de ambiente da aplicação
 * Centraliza todas as variáveis de ambiente e configurações
 */

// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

// Verificar se todas as variáveis obrigatórias estão definidas
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`)
  }
}

export const config = {
  // Ambiente
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  
  // Supabase
  supabase: {
    url: requiredEnvVars.VITE_SUPABASE_URL,
    anonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
  },
  
  // API
  api: {
    timeout: 30000, // 30 segundos
    retryAttempts: 3,
    retryDelay: 1000, // 1 segundo
  },
  
  // Logging
  logging: {
    level: import.meta.env.DEV ? 'DEBUG' : 'INFO',
    maxLogs: 1000,
    enableConsole: import.meta.env.DEV,
    enableRemote: import.meta.env.PROD,
  },
  
  // UI
  ui: {
    toastDuration: 5000, // 5 segundos
    debounceDelay: 300, // 300ms
    animationDuration: 200, // 200ms
  },
  
  // Validação
  validation: {
    passwordMinLength: 6,
    nameMinLength: 2,
    nameMaxLength: 100,
    schoolNameMaxLength: 200,
    phoneRegex: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
  },
  
  // Paginação
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
  
  // Upload de arquivos
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // Cache
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutos
    maxSize: 100, // máximo de 100 itens no cache
  },
  
  // Monitoramento
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    enablePerformanceMonitoring: import.meta.env.PROD,
    sampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% em produção, 100% em desenvolvimento
  },
  
  // Features flags
  features: {
    enableChat: import.meta.env.VITE_ENABLE_CHAT === 'true',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false', // habilitado por padrão
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableBetaFeatures: import.meta.env.VITE_ENABLE_BETA_FEATURES === 'true',
  },
  
  // URLs
  urls: {
    support: 'mailto:suporte@smartclass.com',
    documentation: 'https://docs.smartclass.com',
    privacy: 'https://smartclass.com/privacy',
    terms: 'https://smartclass.com/terms',
  },
} as const

// Função helper para verificar se estamos em desenvolvimento
export const isDev = () => config.isDevelopment

// Função helper para verificar se estamos em produção
export const isProd = () => config.isProduction

// Função helper para obter configurações específicas do ambiente
export const getEnvConfig = () => {
  if (config.isDevelopment) {
    return {
      logLevel: 'DEBUG',
      enableDetailedErrors: true,
      enableDevTools: true,
      apiTimeout: 60000, // 1 minuto em dev
    }
  }
  
  return {
    logLevel: 'INFO',
    enableDetailedErrors: false,
    enableDevTools: false,
    apiTimeout: 30000, // 30 segundos em prod
  }
}

// Validar configuração na inicialização
export const validateConfig = () => {
  const errors: string[] = []
  
  // Validar URLs do Supabase
  try {
    new URL(config.supabase.url)
  } catch {
    errors.push('VITE_SUPABASE_URL deve ser uma URL válida')
  }
  
  if (config.supabase.anonKey.length < 100) {
    errors.push('VITE_SUPABASE_ANON_KEY parece ser inválida')
  }
  
  // Validar configurações numéricas
  if (config.api.timeout <= 0) {
    errors.push('Timeout da API deve ser maior que 0')
  }
  
  if (config.pagination.defaultPageSize <= 0 || config.pagination.defaultPageSize > config.pagination.maxPageSize) {
    errors.push('Tamanho de página padrão deve ser entre 1 e o tamanho máximo')
  }
  
  if (errors.length > 0) {
    throw new Error(`Erros de configuração:\n${errors.join('\n')}`)
  }
}

// Executar validação na importação
validateConfig()