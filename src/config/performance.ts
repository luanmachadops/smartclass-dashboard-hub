// Configurações de performance e otimização

// Configurações de lazy loading
export const LAZY_LOADING_CONFIG = {
  // Delay para carregamento de imagens (em ms)
  imageLoadDelay: 100,
  
  // Threshold para intersection observer
  intersectionThreshold: 0.1,
  
  // Margem para pré-carregamento
  rootMargin: '50px',
  
  // Configurações de retry para componentes lazy
  retryConfig: {
    attempts: 3,
    delay: 1000,
  },
};

// Configurações de cache
export const CACHE_CONFIG = {
  // TTL padrão para cache de API (5 minutos)
  defaultTTL: 5 * 60 * 1000,
  
  // TTL para dados de usuário (15 minutos)
  userDataTTL: 15 * 60 * 1000,
  
  // TTL para dados estáticos (1 hora)
  staticDataTTL: 60 * 60 * 1000,
  
  // Tamanho máximo do cache
  maxCacheSize: 100,
  
  // Habilitar persistência no localStorage
  enablePersistence: true,
};

// Configurações de debounce
export const DEBOUNCE_CONFIG = {
  // Delay para busca em tempo real
  searchDelay: 300,
  
  // Delay para validação de formulários
  validationDelay: 500,
  
  // Delay para auto-save
  autoSaveDelay: 2000,
  
  // Delay para resize events
  resizeDelay: 150,
};

// Configurações de paginação
export const PAGINATION_CONFIG = {
  // Itens por página padrão
  defaultPageSize: 20,
  
  // Opções de tamanho de página
  pageSizeOptions: [10, 20, 50, 100],
  
  // Número máximo de páginas para pré-carregamento
  preloadPages: 2,
  
  // Habilitar scroll infinito
  enableInfiniteScroll: true,
};

// Configurações de compressão
export const COMPRESSION_CONFIG = {
  // Threshold para compressão de dados (1KB)
  compressionThreshold: 1024,
  
  // Nível de compressão (1-9)
  compressionLevel: 6,
  
  // Habilitar compressão para localStorage
  enableLocalStorageCompression: true,
};

// Configurações de monitoramento
export const MONITORING_CONFIG = {
  // Habilitar Web Vitals
  enableWebVitals: true,
  
  // Habilitar Sentry em produção
  enableSentry: process.env.NODE_ENV === 'production',
  
  // Sample rate para performance monitoring
  performanceSampleRate: 0.1,
  
  // Sample rate para error tracking
  errorSampleRate: 1.0,
  
  // Habilitar session replay
  enableSessionReplay: process.env.NODE_ENV === 'production',
};

// Configurações de otimização de imagens
export const IMAGE_CONFIG = {
  // Formatos suportados em ordem de preferência
  supportedFormats: ['webp', 'avif', 'png', 'jpg'],
  
  // Tamanhos de breakpoint para imagens responsivas
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    large: 1440,
  },
  
  // Qualidade padrão para compressão
  defaultQuality: 80,
  
  // Habilitar lazy loading para imagens
  enableLazyLoading: true,
  
  // Placeholder para imagens carregando
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiA5VjEzTTEyIDEzTDE2IDlNMTIgMTNMOCA5IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
};

// Configurações de bundle splitting
export const BUNDLE_CONFIG = {
  // Chunks para vendor libraries
  vendorChunks: {
    react: ['react', 'react-dom'],
    router: ['react-router-dom'],
    ui: ['@radix-ui', 'lucide-react'],
    query: ['@tanstack/react-query'],
    forms: ['react-hook-form', '@hookform/resolvers'],
    utils: ['date-fns', 'clsx', 'class-variance-authority'],
  },
  
  // Tamanho máximo para chunks (em KB)
  maxChunkSize: 500,
  
  // Tamanho mínimo para chunks (em KB)
  minChunkSize: 20,
};

// Configurações de Service Worker
export const SERVICE_WORKER_CONFIG = {
  // Habilitar service worker
  enabled: process.env.NODE_ENV === 'production',
  
  // Estratégia de cache
  cacheStrategy: 'staleWhileRevalidate',
  
  // TTL para cache do service worker (24 horas)
  cacheTTL: 24 * 60 * 60 * 1000,
  
  // Recursos para pré-cache
  precacheResources: [
    '/',
    '/dashboard',
    '/login',
    '/static/css/',
    '/static/js/',
  ],
};

// Configurações de acessibilidade
export const ACCESSIBILITY_CONFIG = {
  // Habilitar navegação por teclado
  enableKeyboardNavigation: true,
  
  // Habilitar anúncios para screen readers
  enableScreenReaderAnnouncements: true,
  
  // Delay para anúncios (em ms)
  announcementDelay: 100,
  
  // Configurações de foco
  focusConfig: {
    // Mostrar outline de foco
    showFocusOutline: true,
    
    // Cor do outline de foco
    focusOutlineColor: '#3b82f6',
    
    // Largura do outline de foco
    focusOutlineWidth: '2px',
  },
  
  // Configurações de contraste
  contrastConfig: {
    // Nível mínimo de contraste
    minimumContrast: 4.5,
    
    // Habilitar modo de alto contraste
    enableHighContrast: false,
  },
};

// Configurações de desenvolvimento
export const DEVELOPMENT_CONFIG = {
  // Habilitar logs detalhados
  enableVerboseLogs: process.env.NODE_ENV === 'development',
  
  // Habilitar React DevTools
  enableReactDevTools: process.env.NODE_ENV === 'development',
  
  // Habilitar Query DevTools
  enableQueryDevTools: process.env.NODE_ENV === 'development',
  
  // Habilitar hot reload
  enableHotReload: process.env.NODE_ENV === 'development',
  
  // Mostrar warnings de performance
  showPerformanceWarnings: process.env.NODE_ENV === 'development',
};

// Função para obter configuração baseada no ambiente
export function getEnvironmentConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    
    // Configurações específicas do ambiente
    cache: {
      ...CACHE_CONFIG,
      enablePersistence: isProduction,
    },
    
    monitoring: {
      ...MONITORING_CONFIG,
      enableSentry: isProduction,
      enableSessionReplay: isProduction,
    },
    
    serviceWorker: {
      ...SERVICE_WORKER_CONFIG,
      enabled: isProduction,
    },
    
    development: {
      ...DEVELOPMENT_CONFIG,
      enableVerboseLogs: isDevelopment,
      enableReactDevTools: isDevelopment,
      enableQueryDevTools: isDevelopment,
    },
  };
}

// Exportar todas as configurações
export const PERFORMANCE_CONFIG = {
  lazyLoading: LAZY_LOADING_CONFIG,
  cache: CACHE_CONFIG,
  debounce: DEBOUNCE_CONFIG,
  pagination: PAGINATION_CONFIG,
  compression: COMPRESSION_CONFIG,
  monitoring: MONITORING_CONFIG,
  image: IMAGE_CONFIG,
  bundle: BUNDLE_CONFIG,
  serviceWorker: SERVICE_WORKER_CONFIG,
  accessibility: ACCESSIBILITY_CONFIG,
  development: DEVELOPMENT_CONFIG,
};