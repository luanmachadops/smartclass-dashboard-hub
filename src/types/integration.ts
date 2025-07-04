// Tipos para sistema de integrações
// Criado em: 2025-01-18
// Descrição: Definições de tipos para integrações com APIs externas

// Enums
export enum IntegrationType {
  PAYMENT = 'PAYMENT',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  CALENDAR = 'CALENDAR',
  VIDEO_CONFERENCE = 'VIDEO_CONFERENCE',
  STORAGE = 'STORAGE',
  ANALYTICS = 'ANALYTICS',
  CRM = 'CRM',
  ACCOUNTING = 'ACCOUNTING',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  MESSAGING = 'MESSAGING',
  AUTHENTICATION = 'AUTHENTICATION',
  CUSTOM = 'CUSTOM'
}

export enum SyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED'
}

export enum WebhookEvent {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  EMAIL_DELIVERED = 'email.delivered',
  EMAIL_BOUNCED = 'email.bounced',
  SMS_DELIVERED = 'sms.delivered',
  SMS_FAILED = 'sms.failed',
  CALENDAR_EVENT_CREATED = 'calendar.event.created',
  CALENDAR_EVENT_UPDATED = 'calendar.event.updated',
  CALENDAR_EVENT_DELETED = 'calendar.event.deleted',
  MEETING_STARTED = 'meeting.started',
  MEETING_ENDED = 'meeting.ended',
  USER_JOINED = 'user.joined',
  USER_LEFT = 'user.left'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertType {
  SYNC_FAILURE = 'sync_failure',
  RATE_LIMIT = 'rate_limit',
  WEBHOOK_FAILURE = 'webhook_failure',
  AUTH_ERROR = 'auth_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  CONNECTION_ERROR = 'connection_error'
}

// Interfaces principais
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  description?: string;
  isActive: boolean;
  config: IntegrationConfig;
  credentials: IntegrationCredentials;
  webhookUrl?: string;
  webhookSecret?: string;
  lastSync?: Date;
  lastError?: string;
  syncStatus: SyncStatus;
  schoolId: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  syncInterval?: number; // em minutos
  batchSize?: number;
  enableWebhooks?: boolean;
  enableRateLimit?: boolean;
  enableCompression?: boolean;
  enableEncryption?: boolean;
  customHeaders?: Record<string, string>;
  customParams?: Record<string, any>;
  fieldMappings?: Record<string, string>;
  transformationRules?: Record<string, string>;
  [key: string]: any;
}

export interface IntegrationCredentials {
  apiKey?: string;
  secretKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  accountId?: string;
  organizationId?: string;
  webhookSecret?: string;
  [key: string]: any;
}

// Interfaces para sincronização
export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsSkipped: number;
  errors: SyncError[];
  warnings: string[];
  duration: number; // em milissegundos
  startedAt: Date;
  completedAt: Date;
}

export interface SyncError {
  code: string;
  message: string;
  details?: any;
  recordId?: string;
  field?: string;
}

export interface SyncOptions {
  batchSize?: number;
  timeout?: number;
  retryAttempts?: number;
  skipErrors?: boolean;
  dryRun?: boolean;
  entityTypes?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
}

// Interfaces para webhooks
export interface WebhookPayload {
  event: WebhookEvent | string;
  data: any;
  timestamp: Date;
  signature?: string;
  source: string;
  version?: string;
}

export interface WebhookLog {
  id: string;
  integrationId: string;
  payload: WebhookPayload;
  success: boolean;
  error?: string;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
  processedAt: Date;
  createdAt: Date;
}

// Interfaces para logs
export interface SyncLog {
  id: string;
  integrationId: string;
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsSkipped: number;
  errors: SyncError[];
  warnings: string[];
  duration: number;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
}

// Interfaces para mapeamento de campos
export interface FieldMapping {
  id: string;
  integrationId: string;
  internalField: string;
  externalField: string;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'object';
  isRequired: boolean;
  defaultValue?: string;
  transformationRule?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para dados sincronizados
export interface SyncData {
  id: string;
  integrationId: string;
  externalId: string;
  internalId?: string;
  entityType: string;
  externalData: any;
  internalData?: any;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para rate limiting
export interface RateLimit {
  id: string;
  integrationId: string;
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  currentUsage: {
    minuteRequests: number;
    hourRequests: number;
    dayRequests: number;
    lastMinute: number;
    lastHour: number;
    lastDay: number;
  };
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para templates
export interface IntegrationTemplate {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  description?: string;
  configTemplate: IntegrationConfig;
  fieldMappings: Record<string, string>;
  isPublic: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para alertas
export interface IntegrationAlert {
  id: string;
  integrationId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  details: any;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

// Interfaces para métricas
export interface IntegrationMetrics {
  id: string;
  integrationId: string;
  date: Date;
  syncCount: number;
  successfulSyncs: number;
  failedSyncs: number;
  recordsProcessed: number;
  averageSyncDuration: number;
  webhookCount: number;
  successfulWebhooks: number;
  failedWebhooks: number;
  apiCalls: number;
  rateLimitHits: number;
  errorRate: number;
  uptimePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationStats {
  totalIntegrations: number;
  activeIntegrations: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalWebhooks: number;
  successfulWebhooks: number;
  failedWebhooks: number;
  averageErrorRate: number;
  mostUsedProvider: string;
  mostActiveIntegration: string;
}

// Interfaces para provedores específicos
export interface PaymentProvider {
  processPayment(amount: number, currency: string, paymentMethod: any): Promise<any>;
  refundPayment(paymentId: string, amount?: number): Promise<any>;
  getPayment(paymentId: string): Promise<any>;
  listPayments(filters?: any): Promise<any[]>;
  createCustomer(customerData: any): Promise<any>;
  updateCustomer(customerId: string, customerData: any): Promise<any>;
  deleteCustomer(customerId: string): Promise<void>;
}

export interface EmailProvider {
  sendEmail(to: string | string[], subject: string, content: string, options?: any): Promise<any>;
  sendTemplate(to: string | string[], templateId: string, variables: any, options?: any): Promise<any>;
  createTemplate(name: string, subject: string, content: string): Promise<any>;
  updateTemplate(templateId: string, subject?: string, content?: string): Promise<any>;
  deleteTemplate(templateId: string): Promise<void>;
  getDeliveryStatus(messageId: string): Promise<any>;
}

export interface SMSProvider {
  sendSMS(to: string, message: string, options?: any): Promise<any>;
  sendBulkSMS(recipients: string[], message: string, options?: any): Promise<any>;
  getDeliveryStatus(messageId: string): Promise<any>;
  getBalance(): Promise<number>;
}

export interface CalendarProvider {
  createEvent(event: CalendarEvent): Promise<any>;
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<any>;
  deleteEvent(eventId: string): Promise<void>;
  getEvent(eventId: string): Promise<any>;
  listEvents(filters?: any): Promise<any[]>;
  createCalendar(name: string, description?: string): Promise<any>;
  shareCalendar(calendarId: string, email: string, role: string): Promise<void>;
}

export interface VideoConferenceProvider {
  createMeeting(meeting: VideoMeeting): Promise<any>;
  updateMeeting(meetingId: string, meeting: Partial<VideoMeeting>): Promise<any>;
  deleteMeeting(meetingId: string): Promise<void>;
  getMeeting(meetingId: string): Promise<any>;
  listMeetings(filters?: any): Promise<any[]>;
  startMeeting(meetingId: string): Promise<any>;
  endMeeting(meetingId: string): Promise<void>;
  getRecordings(meetingId: string): Promise<any[]>;
}

// Interfaces para eventos de calendário e reuniões
export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    count?: number;
  };
  reminders?: {
    method: 'email' | 'popup';
    minutes: number;
  }[];
}

export interface VideoMeeting {
  title: string;
  description?: string;
  startTime: Date;
  duration: number; // em minutos
  timezone?: string;
  password?: string;
  waitingRoom?: boolean;
  recordMeeting?: boolean;
  attendees?: {
    email: string;
    name?: string;
    role?: 'host' | 'participant';
  }[];
  settings?: {
    muteOnEntry?: boolean;
    videoOnEntry?: boolean;
    allowScreenShare?: boolean;
    allowChat?: boolean;
  };
}

// Interface para resposta de API genérica
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Tipos para configuração de provedores
export type ProviderConfig = {
  stripe?: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    apiVersion?: string;
  };
  mercadopago?: {
    accessToken: string;
    publicKey: string;
    clientId: string;
    clientSecret: string;
  };
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
  zoom?: {
    apiKey: string;
    apiSecret: string;
    accountId: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName?: string;
  };
  mailchimp?: {
    apiKey: string;
    serverPrefix: string;
    listId?: string;
  };
};

// Tipos para eventos de integração
export type IntegrationEvent = {
  type: 'sync_started' | 'sync_completed' | 'sync_failed' | 'webhook_received' | 'alert_created';
  integrationId: string;
  data: any;
  timestamp: Date;
};

// Tipos para filtros e consultas
export type IntegrationFilters = {
  type?: IntegrationType;
  provider?: string;
  isActive?: boolean;
  syncStatus?: SyncStatus;
  schoolId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastSyncAfter?: Date;
  lastSyncBefore?: Date;
};

export type SyncLogFilters = {
  integrationId?: string;
  success?: boolean;
  startedAfter?: Date;
  startedBefore?: Date;
  minDuration?: number;
  maxDuration?: number;
};

export type WebhookLogFilters = {
  integrationId?: string;
  success?: boolean;
  processedAfter?: Date;
  processedBefore?: Date;
  event?: WebhookEvent | string;
};

// Tipos para paginação
export type PaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// Tipos para jobs de sincronização
export type SyncJob = {
  id: string;
  integrationId: string;
  type: 'manual' | 'scheduled' | 'webhook';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  options: SyncOptions;
  result?: SyncResult;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
};

// Tipos para validação
export type ValidationResult = {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    code: string;
  }[];
};

// Tipos para transformação de dados
export type DataTransformer = {
  transform(data: any, mapping: Record<string, string>): any;
  validate(data: any, schema: any): ValidationResult;
  sanitize(data: any): any;
};

// Tipos para cache de integração
export type IntegrationCache = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
};

// Tipos para monitoramento
export type IntegrationMonitor = {
  trackEvent(event: IntegrationEvent): void;
  trackMetric(name: string, value: number, tags?: Record<string, string>): void;
  trackError(error: Error, context?: any): void;
  trackPerformance(operation: string, duration: number, success: boolean): void;
};

// Tipos para configuração do serviço
export type IntegrationServiceConfig = {
  enableCache?: boolean;
  cacheTimeout?: number;
  enableMonitoring?: boolean;
  enableRateLimit?: boolean;
  defaultTimeout?: number;
  defaultRetryAttempts?: number;
  maxConcurrentSyncs?: number;
  webhookTimeout?: number;
  encryptionKey?: string;
};

// Tipos para hooks React
export type UseIntegrationServiceReturn = {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  createIntegration: (integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Integration>;
  updateIntegration: (id: string, updates: Partial<Integration>) => Promise<Integration>;
  deleteIntegration: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<boolean>;
  syncIntegration: (id: string, options?: SyncOptions) => Promise<SyncResult>;
  pauseIntegration: (id: string) => Promise<void>;
  resumeIntegration: (id: string) => Promise<void>;
  getStats: (schoolId: string) => Promise<IntegrationStats>;
  refresh: () => Promise<void>;
};