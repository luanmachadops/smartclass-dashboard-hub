import { logger } from './logger';
import { auditService, AuditAction } from './auditService';
import { performanceMonitor } from './performanceMonitor';
import { supabase } from '../lib/supabase';

// Tipos para analytics
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  properties: Record<string, any>;
  userId?: string;
  schoolId?: string;
  sessionId: string;
  timestamp: number;
  userAgent: string;
  ip?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface UserSession {
  id: string;
  userId?: string;
  schoolId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: number;
  events: number;
  device: DeviceInfo;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniquePageViews: number;
  topPages: Array<{ page: string; views: number }>;
  topEvents: Array<{ event: string; count: number }>;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  conversionRates: Record<string, number>;
}

export interface AnalyticsConfig {
  enableTracking: boolean;
  enableUserTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableHeatmaps: boolean;
  enableRecordings: boolean;
  sampleRate: number; // 0-1
  batchSize: number;
  flushInterval: number; // em ms
  enableRealtime: boolean;
  enableOfflineTracking: boolean;
  privacyMode: boolean;
}

export enum EventCategory {
  PAGE_VIEW = 'PAGE_VIEW',
  USER_ACTION = 'USER_ACTION',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  ERROR = 'ERROR',
  PERFORMANCE = 'PERFORMANCE',
  CONVERSION = 'CONVERSION',
  ENGAGEMENT = 'ENGAGEMENT',
  CUSTOM = 'CUSTOM'
}

export enum StandardEvents {
  // Page events
  PAGE_VIEW = 'page_view',
  PAGE_LOAD = 'page_load',
  PAGE_UNLOAD = 'page_unload',
  
  // User events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  
  // Navigation
  NAVIGATION = 'navigation',
  SEARCH = 'search',
  FILTER = 'filter',
  SORT = 'sort',
  
  // Actions
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  FORM_ERROR = 'form_error',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  
  // Engagement
  SCROLL_DEPTH = 'scroll_depth',
  TIME_ON_PAGE = 'time_on_page',
  VIDEO_PLAY = 'video_play',
  VIDEO_PAUSE = 'video_pause',
  
  // Errors
  JAVASCRIPT_ERROR = 'javascript_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  
  // Performance
  PERFORMANCE_METRIC = 'performance_metric',
  SLOW_QUERY = 'slow_query',
  
  // Business events
  STUDENT_ENROLLED = 'student_enrolled',
  PAYMENT_COMPLETED = 'payment_completed',
  CLASS_SCHEDULED = 'class_scheduled',
  GRADE_ASSIGNED = 'grade_assigned'
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private currentSession: UserSession | null = null;
  private flushTimer?: NodeJS.Timeout;
  private pageStartTime: number = Date.now();
  private scrollDepth: number = 0;
  private maxScrollDepth: number = 0;
  private isTracking: boolean = false;

  private constructor() {
    this.config = {
      enableTracking: true,
      enableUserTracking: true,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      enableHeatmaps: false,
      enableRecordings: false,
      sampleRate: 1.0,
      batchSize: 50,
      flushInterval: 30000, // 30 segundos
      enableRealtime: false,
      enableOfflineTracking: true,
      privacyMode: false
    };

    this.initialize();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Inicializar serviço
  private initialize(): void {
    if (!this.config.enableTracking) return;

    // Verificar se deve rastrear (sample rate)
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.isTracking = true;
    this.startSession();
    this.setupEventListeners();
    this.startFlushTimer();

    logger.info('Analytics service initialized', 'AnalyticsService', {
      config: this.config
    });
  }

  // Iniciar sessão
  private startSession(): void {
    const sessionId = crypto.randomUUID();
    const deviceInfo = this.getDeviceInfo();
    const urlParams = new URLSearchParams(window.location.search);

    this.currentSession = {
      id: sessionId,
      userId: this.getCurrentUserId(),
      schoolId: this.getCurrentSchoolId(),
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      device: deviceInfo,
      referrer: document.referrer || undefined,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined
    };

    // Salvar sessão no localStorage para persistência
    if (this.config.enableOfflineTracking) {
      localStorage.setItem('analytics_session', JSON.stringify(this.currentSession));
    }

    logger.debug('Analytics session started', 'AnalyticsService', {
      sessionId,
      deviceInfo
    });
  }

  // Configurar listeners de eventos
  private setupEventListeners(): void {
    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent(StandardEvents.PAGE_UNLOAD, EventCategory.PAGE_VIEW, {
          timeOnPage: Date.now() - this.pageStartTime
        });
        this.endSession();
      } else {
        this.pageStartTime = Date.now();
        this.trackEvent(StandardEvents.PAGE_LOAD, EventCategory.PAGE_VIEW);
      }
    });

    // Beforeunload
    window.addEventListener('beforeunload', () => {
      this.trackEvent(StandardEvents.PAGE_UNLOAD, EventCategory.PAGE_VIEW, {
        timeOnPage: Date.now() - this.pageStartTime,
        scrollDepth: this.maxScrollDepth
      });
      this.flush(true); // Flush síncrono
      this.endSession();
    });

    // Scroll tracking
    if (this.config.enableUserTracking) {
      let scrollTimeout: NodeJS.Timeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.updateScrollDepth();
        }, 100);
      });
    }

    // Error tracking
    if (this.config.enableErrorTracking) {
      window.addEventListener('error', (event) => {
        this.trackError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(event.reason, {
          type: 'unhandled_promise_rejection'
        });
      });
    }

    // Performance tracking
    if (this.config.enablePerformanceTracking) {
      // Web Vitals
      this.trackWebVitals();
    }

    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.trackEvent(StandardEvents.BUTTON_CLICK, EventCategory.USER_ACTION, {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.trim(),
          href: target.getAttribute('href'),
          id: target.id,
          className: target.className
        });
      }
    });
  }

  // Rastrear evento
  trackEvent(
    name: string,
    category: EventCategory,
    properties: Record<string, any> = {},
    options: {
      label?: string;
      value?: number;
      userId?: string;
      schoolId?: string;
    } = {}
  ): void {
    if (!this.isTracking || !this.currentSession) return;

    const event: AnalyticsEvent = {
      id: crypto.randomUUID(),
      name,
      category,
      action: name,
      label: options.label,
      value: options.value,
      properties: {
        ...properties,
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      userId: options.userId || this.getCurrentUserId(),
      schoolId: options.schoolId || this.getCurrentSchoolId(),
      sessionId: this.currentSession.id,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    // Adicionar informações de localização se disponível
    if (navigator.geolocation && !this.config.privacyMode) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          event.properties.latitude = position.coords.latitude;
          event.properties.longitude = position.coords.longitude;
        },
        () => {}, // Ignorar erros de geolocalização
        { timeout: 1000 }
      );
    }

    this.eventQueue.push(event);
    this.currentSession.events++;

    // Flush imediato para eventos críticos
    if (category === EventCategory.ERROR || this.config.enableRealtime) {
      this.flush();
    } else if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }

    logger.debug('Event tracked', 'AnalyticsService', {
      name,
      category,
      properties: Object.keys(properties)
    });
  }

  // Rastrear page view
  trackPageView(page?: string, title?: string): void {
    const currentPage = page || window.location.pathname;
    const pageTitle = title || document.title;

    this.trackEvent(StandardEvents.PAGE_VIEW, EventCategory.PAGE_VIEW, {
      page: currentPage,
      title: pageTitle,
      url: window.location.href,
      search: window.location.search,
      hash: window.location.hash
    });

    if (this.currentSession) {
      this.currentSession.pageViews++;
    }

    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
  }

  // Rastrear erro
  trackError(error: Error | string, context: Record<string, any> = {}): void {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      ...context
    };

    this.trackEvent(StandardEvents.JAVASCRIPT_ERROR, EventCategory.ERROR, errorInfo);

    // Também registrar no logger
    logger.error('JavaScript error tracked', 'AnalyticsService', errorInfo);
  }

  // Rastrear conversão
  trackConversion(
    conversionName: string,
    value?: number,
    currency?: string,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(conversionName, EventCategory.CONVERSION, {
      ...properties,
      value,
      currency: currency || 'BRL'
    }, { value });

    logger.info('Conversion tracked', 'AnalyticsService', {
      conversionName,
      value,
      currency
    });
  }

  // Rastrear timing
  trackTiming(
    category: string,
    variable: string,
    time: number,
    label?: string
  ): void {
    this.trackEvent(StandardEvents.PERFORMANCE_METRIC, EventCategory.PERFORMANCE, {
      category,
      variable,
      time,
      label
    }, { value: time });
  }

  // Rastrear Web Vitals
  private trackWebVitals(): void {
    // Simular Web Vitals (em produção usaria a biblioteca web-vitals)
    if (typeof PerformanceObserver !== 'undefined') {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackTiming('Web Vitals', 'LCP', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Ignorar se não suportado
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.trackTiming('Web Vitals', 'FID', entry.processingStart - entry.startTime);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Ignorar se não suportado
      }
    }

    // Navigation Timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackTiming('Navigation', 'DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.trackTiming('Navigation', 'Load Complete', navigation.loadEventEnd - navigation.loadEventStart);
          this.trackTiming('Navigation', 'Total Load Time', navigation.loadEventEnd - navigation.fetchStart);
        }
      }, 0);
    });
  }

  // Atualizar profundidade de scroll
  private updateScrollDepth(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const scrollPercent = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    
    if (scrollPercent > this.maxScrollDepth) {
      this.maxScrollDepth = scrollPercent;
      
      // Rastrear marcos de scroll
      const milestones = [25, 50, 75, 90, 100];
      const milestone = milestones.find(m => scrollPercent >= m && this.scrollDepth < m);
      
      if (milestone) {
        this.trackEvent(StandardEvents.SCROLL_DEPTH, EventCategory.ENGAGEMENT, {
          depth: milestone,
          page: window.location.pathname
        });
      }
    }
    
    this.scrollDepth = scrollPercent;
  }

  // Obter informações do dispositivo
  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    
    // Detectar tipo de dispositivo
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    
    // Detectar OS
    let os = 'Unknown';
    if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Mac/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iOS|iPhone|iPad/.test(userAgent)) os = 'iOS';
    
    // Detectar browser
    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';
    
    return {
      type: deviceType,
      os,
      browser,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Obter ID do usuário atual
  private getCurrentUserId(): string | undefined {
    try {
      const user = supabase.auth.getUser();
      return user ? 'current_user_id' : undefined; // Simplificado
    } catch {
      return undefined;
    }
  }

  // Obter ID da escola atual
  private getCurrentSchoolId(): string | undefined {
    try {
      // Implementar lógica para obter escola atual
      return localStorage.getItem('current_school_id') || undefined;
    } catch {
      return undefined;
    }
  }

  // Iniciar timer de flush
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  // Enviar eventos para o servidor
  private async flush(sync: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (sync) {
        // Envio síncrono usando sendBeacon
        if (navigator.sendBeacon) {
          const data = JSON.stringify({ events });
          navigator.sendBeacon('/api/analytics', data);
        }
      } else {
        // Envio assíncrono
        await this.sendEvents(events);
      }

      logger.debug('Events flushed', 'AnalyticsService', {
        eventCount: events.length
      });

    } catch (error) {
      logger.error('Failed to flush events', 'AnalyticsService', { error });
      
      // Recolocar eventos na fila se falhar
      if (!sync) {
        this.eventQueue.unshift(...events);
      }
      
      // Salvar no localStorage se offline tracking estiver habilitado
      if (this.config.enableOfflineTracking) {
        this.saveEventsOffline(events);
      }
    }
  }

  // Enviar eventos para o servidor
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // Em produção, enviaria para um endpoint de analytics
    // Por enquanto, salvar no Supabase
    
    const { error } = await supabase
      .from('analytics_events')
      .insert(events.map(event => ({
        id: event.id,
        name: event.name,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        properties: event.properties,
        user_id: event.userId,
        school_id: event.schoolId,
        session_id: event.sessionId,
        timestamp: new Date(event.timestamp).toISOString(),
        user_agent: event.userAgent,
        ip: event.ip
      })));

    if (error) {
      throw error;
    }
  }

  // Salvar eventos offline
  private saveEventsOffline(events: AnalyticsEvent[]): void {
    try {
      const existingEvents = JSON.parse(localStorage.getItem('analytics_offline_events') || '[]');
      const allEvents = [...existingEvents, ...events];
      
      // Limitar número de eventos offline
      const maxOfflineEvents = 1000;
      if (allEvents.length > maxOfflineEvents) {
        allEvents.splice(0, allEvents.length - maxOfflineEvents);
      }
      
      localStorage.setItem('analytics_offline_events', JSON.stringify(allEvents));
    } catch (error) {
      logger.warn('Failed to save events offline', 'AnalyticsService', { error });
    }
  }

  // Carregar e enviar eventos offline
  private async loadAndSendOfflineEvents(): Promise<void> {
    try {
      const offlineEvents = JSON.parse(localStorage.getItem('analytics_offline_events') || '[]');
      
      if (offlineEvents.length > 0) {
        await this.sendEvents(offlineEvents);
        localStorage.removeItem('analytics_offline_events');
        
        logger.info('Offline events sent', 'AnalyticsService', {
          eventCount: offlineEvents.length
        });
      }
    } catch (error) {
      logger.error('Failed to send offline events', 'AnalyticsService', { error });
    }
  }

  // Finalizar sessão
  private endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

    // Salvar sessão
    this.saveSession(this.currentSession);

    logger.debug('Analytics session ended', 'AnalyticsService', {
      sessionId: this.currentSession.id,
      duration: this.currentSession.duration,
      events: this.currentSession.events,
      pageViews: this.currentSession.pageViews
    });

    this.currentSession = null;
  }

  // Salvar sessão
  private async saveSession(session: UserSession): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          school_id: session.schoolId,
          start_time: new Date(session.startTime).toISOString(),
          end_time: session.endTime ? new Date(session.endTime).toISOString() : null,
          duration: session.duration,
          page_views: session.pageViews,
          events: session.events,
          device: session.device,
          referrer: session.referrer,
          utm_source: session.utmSource,
          utm_medium: session.utmMedium,
          utm_campaign: session.utmCampaign
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Failed to save session', 'AnalyticsService', { error });
    }
  }

  // Obter métricas
  async getMetrics(
    startDate: Date,
    endDate: Date,
    schoolId?: string
  ): Promise<AnalyticsMetrics> {
    try {
      // Implementar queries para obter métricas
      // Por enquanto, retornar dados simulados
      
      return {
        totalUsers: 150,
        activeUsers: 45,
        newUsers: 12,
        sessions: 89,
        averageSessionDuration: 420000, // 7 minutos
        bounceRate: 0.35,
        pageViews: 234,
        uniquePageViews: 156,
        topPages: [
          { page: '/dashboard', views: 89 },
          { page: '/students', views: 67 },
          { page: '/classes', views: 45 }
        ],
        topEvents: [
          { event: 'button_click', count: 234 },
          { event: 'page_view', count: 156 },
          { event: 'form_submit', count: 89 }
        ],
        userRetention: {
          day1: 0.85,
          day7: 0.62,
          day30: 0.34
        },
        conversionRates: {
          'student_enrollment': 0.12,
          'payment_completion': 0.89
        }
      };
    } catch (error) {
      logger.error('Failed to get analytics metrics', 'AnalyticsService', { error });
      throw error;
    }
  }

  // Identificar usuário
  identify(userId: string, traits: Record<string, any> = {}): void {
    if (this.currentSession) {
      this.currentSession.userId = userId;
    }

    this.trackEvent('user_identified', EventCategory.USER_ACTION, {
      userId,
      traits
    });

    logger.debug('User identified', 'AnalyticsService', { userId });
  }

  // Definir propriedades da escola
  setSchool(schoolId: string, properties: Record<string, any> = {}): void {
    if (this.currentSession) {
      this.currentSession.schoolId = schoolId;
    }

    localStorage.setItem('current_school_id', schoolId);

    this.trackEvent('school_set', EventCategory.SYSTEM_EVENT, {
      schoolId,
      properties
    });

    logger.debug('School set', 'AnalyticsService', { schoolId });
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reiniciar timer se necessário
    if (newConfig.flushInterval !== undefined) {
      this.startFlushTimer();
    }

    // Reinicializar se tracking foi habilitado/desabilitado
    if (newConfig.enableTracking !== undefined) {
      if (newConfig.enableTracking && !this.isTracking) {
        this.initialize();
      } else if (!newConfig.enableTracking && this.isTracking) {
        this.destroy();
      }
    }

    logger.info('Analytics config updated', 'AnalyticsService', { newConfig });
  }

  // Obter configuração
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // Obter sessão atual
  getCurrentSession(): UserSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  // Obter estatísticas da fila
  getQueueStats(): {
    queueSize: number;
    isTracking: boolean;
    sessionActive: boolean;
  } {
    return {
      queueSize: this.eventQueue.length,
      isTracking: this.isTracking,
      sessionActive: this.currentSession !== null
    };
  }

  // Forçar flush
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Destruir serviço
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush final
    if (this.eventQueue.length > 0) {
      this.flush(true);
    }

    this.endSession();
    this.isTracking = false;

    logger.info('Analytics service destroyed', 'AnalyticsService');
  }
}

// Instância singleton
export const analyticsService = AnalyticsService.getInstance();

// Hook para usar o serviço de analytics em componentes React
export function useAnalyticsService() {
  return analyticsService;
}

// Decorator para rastreamento automático de métodos
export function trackMethod(
  eventName?: string,
  category: EventCategory = EventCategory.USER_ACTION,
  properties: Record<string, any> = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const finalEventName = eventName || `${target.constructor.name}_${propertyName}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        
        analyticsService.trackEvent(finalEventName, category, {
          ...properties,
          success: true,
          duration: Date.now() - startTime,
          args: args.length
        });
        
        return result;
      } catch (error) {
        analyticsService.trackEvent(finalEventName, category, {
          ...properties,
          success: false,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default analyticsService;