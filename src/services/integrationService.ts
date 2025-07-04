import { logger } from './logger';
import { auditService, AuditAction } from './auditService';
import { cacheService } from './cacheService';
import { rateLimiter } from './rateLimiter';
import { notificationService } from './notificationService';
import { supabase } from '../lib/supabase';

// Tipos para integrações
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  description: string;
  isActive: boolean;
  config: IntegrationConfig;
  credentials: IntegrationCredentials;
  webhookUrl?: string;
  lastSync?: Date;
  lastError?: string;
  syncStatus: SyncStatus;
  schoolId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  batchSize?: number;
  syncInterval?: number; // em minutos
  enableWebhooks?: boolean;
  enableRealtime?: boolean;
  fieldMappings?: Record<string, string>;
  filters?: Record<string, any>;
  customHeaders?: Record<string, string>;
  enableCompression?: boolean;
  enableEncryption?: boolean;
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
  certificate?: string;
  privateKey?: string;
  expiresAt?: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  recordsSkipped: number;
  errors: SyncError[];
  warnings: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface SyncError {
  record: any;
  error: string;
  code?: string;
  field?: string;
}

export interface WebhookPayload {
  id: string;
  integrationId: string;
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}

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
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  EMAIL_SENT = 'EMAIL_SENT',
  EMAIL_DELIVERED = 'EMAIL_DELIVERED',
  EMAIL_BOUNCED = 'EMAIL_BOUNCED',
  SMS_SENT = 'SMS_SENT',
  SMS_DELIVERED = 'SMS_DELIVERED',
  SMS_FAILED = 'SMS_FAILED',
  CALENDAR_EVENT_CREATED = 'CALENDAR_EVENT_CREATED',
  CALENDAR_EVENT_UPDATED = 'CALENDAR_EVENT_UPDATED',
  CALENDAR_EVENT_CANCELLED = 'CALENDAR_EVENT_CANCELLED'
}

// Providers específicos
export interface PaymentProvider {
  createPayment(amount: number, currency: string, metadata?: any): Promise<APIResponse>;
  getPayment(paymentId: string): Promise<APIResponse>;
  refundPayment(paymentId: string, amount?: number): Promise<APIResponse>;
  listPayments(filters?: any): Promise<APIResponse>;
  createSubscription(planId: string, customerId: string): Promise<APIResponse>;
  cancelSubscription(subscriptionId: string): Promise<APIResponse>;
}

export interface EmailProvider {
  sendEmail(to: string[], subject: string, content: string, options?: any): Promise<APIResponse>;
  sendTemplate(templateId: string, to: string[], variables?: any): Promise<APIResponse>;
  createTemplate(name: string, subject: string, content: string): Promise<APIResponse>;
  getDeliveryStatus(messageId: string): Promise<APIResponse>;
  manageBounces(): Promise<APIResponse>;
}

export interface SMSProvider {
  sendSMS(to: string, message: string, options?: any): Promise<APIResponse>;
  sendBulkSMS(recipients: string[], message: string): Promise<APIResponse>;
  getDeliveryStatus(messageId: string): Promise<APIResponse>;
  getBalance(): Promise<APIResponse>;
}

export interface CalendarProvider {
  createEvent(event: any): Promise<APIResponse>;
  updateEvent(eventId: string, updates: any): Promise<APIResponse>;
  deleteEvent(eventId: string): Promise<APIResponse>;
  listEvents(filters?: any): Promise<APIResponse>;
  createCalendar(name: string, description?: string): Promise<APIResponse>;
}

export interface VideoConferenceProvider {
  createMeeting(title: string, startTime: Date, duration: number, options?: any): Promise<APIResponse>;
  updateMeeting(meetingId: string, updates: any): Promise<APIResponse>;
  deleteMeeting(meetingId: string): Promise<APIResponse>;
  getMeeting(meetingId: string): Promise<APIResponse>;
  listMeetings(filters?: any): Promise<APIResponse>;
  generateJoinUrl(meetingId: string, participantName: string): Promise<APIResponse>;
}

class IntegrationService {
  private static instance: IntegrationService;
  private integrations: Map<string, Integration> = new Map();
  private providers: Map<string, any> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private webhookSecrets: Map<string, string> = new Map();

  private constructor() {
    this.loadIntegrations();
    this.initializeProviders();
  }

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  // Carregar integrações do banco
  private async loadIntegrations(): Promise<void> {
    try {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const integration of integrations || []) {
        const integrationObj: Integration = {
          id: integration.id,
          name: integration.name,
          type: integration.type,
          provider: integration.provider,
          description: integration.description,
          isActive: integration.is_active,
          config: integration.config || {},
          credentials: integration.credentials || {},
          webhookUrl: integration.webhook_url,
          lastSync: integration.last_sync ? new Date(integration.last_sync) : undefined,
          lastError: integration.last_error,
          syncStatus: integration.sync_status || SyncStatus.IDLE,
          schoolId: integration.school_id,
          createdBy: integration.created_by,
          createdAt: new Date(integration.created_at),
          updatedAt: new Date(integration.updated_at)
        };

        this.integrations.set(integration.id, integrationObj);
        
        // Configurar sync automático se habilitado
        if (integrationObj.config.syncInterval) {
          this.scheduleSyncJob(integrationObj);
        }
      }

      logger.info('Integrations loaded', 'IntegrationService', {
        count: this.integrations.size
      });

    } catch (error) {
      logger.error('Failed to load integrations', 'IntegrationService', { error });
    }
  }

  // Inicializar providers
  private initializeProviders(): void {
    // Registrar providers padrão
    this.registerProvider('stripe', new StripeProvider());
    this.registerProvider('mercadopago', new MercadoPagoProvider());
    this.registerProvider('sendgrid', new SendGridProvider());
    this.registerProvider('twilio', new TwilioProvider());
    this.registerProvider('google_calendar', new GoogleCalendarProvider());
    this.registerProvider('zoom', new ZoomProvider());
    this.registerProvider('aws_s3', new AWSS3Provider());
    this.registerProvider('mailchimp', new MailchimpProvider());
  }

  // Registrar provider personalizado
  registerProvider(name: string, provider: any): void {
    this.providers.set(name, provider);
    logger.debug('Provider registered', 'IntegrationService', { name });
  }

  // Criar nova integração
  async createIntegration(
    schoolId: string,
    name: string,
    type: IntegrationType,
    provider: string,
    config: IntegrationConfig,
    credentials: IntegrationCredentials,
    description?: string
  ): Promise<Integration> {
    try {
      // Validar provider
      if (!this.providers.has(provider)) {
        throw new Error(`Provider '${provider}' not found`);
      }

      // Testar conexão
      const testResult = await this.testConnection(provider, config, credentials);
      if (!testResult.success) {
        throw new Error(`Connection test failed: ${testResult.error}`);
      }

      const integrationData = {
        name,
        type,
        provider,
        description: description || '',
        is_active: true,
        config,
        credentials: this.encryptCredentials(credentials),
        sync_status: SyncStatus.IDLE,
        school_id: schoolId,
        created_by: 'current_user_id' // Simplificado
      };

      const { data, error } = await supabase
        .from('integrations')
        .insert(integrationData)
        .select()
        .single();

      if (error) throw error;

      const integration: Integration = {
        id: data.id,
        name: data.name,
        type: data.type,
        provider: data.provider,
        description: data.description,
        isActive: data.is_active,
        config: data.config,
        credentials: this.decryptCredentials(data.credentials),
        syncStatus: data.sync_status,
        schoolId: data.school_id,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      this.integrations.set(integration.id, integration);

      // Configurar sync automático se habilitado
      if (integration.config.syncInterval) {
        this.scheduleSyncJob(integration);
      }

      await auditService.logAction(
        AuditAction.CREATE,
        'integration',
        integration.id,
        { name, type, provider },
        schoolId
      );

      logger.info('Integration created', 'IntegrationService', {
        id: integration.id,
        name,
        type,
        provider
      });

      return integration;

    } catch (error) {
      logger.error('Failed to create integration', 'IntegrationService', { error });
      throw error;
    }
  }

  // Atualizar integração
  async updateIntegration(
    integrationId: string,
    updates: Partial<{
      name: string;
      description: string;
      config: IntegrationConfig;
      credentials: IntegrationCredentials;
      isActive: boolean;
    }>
  ): Promise<Integration> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Se credenciais foram atualizadas, testar conexão
      if (updates.credentials || updates.config) {
        const testConfig = updates.config || integration.config;
        const testCredentials = updates.credentials || integration.credentials;
        
        const testResult = await this.testConnection(
          integration.provider,
          testConfig,
          testCredentials
        );
        
        if (!testResult.success) {
          throw new Error(`Connection test failed: ${testResult.error}`);
        }
      }

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.config) updateData.config = updates.config;
      if (updates.credentials) updateData.credentials = this.encryptCredentials(updates.credentials);
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('integrations')
        .update(updateData)
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;

      const updatedIntegration: Integration = {
        ...integration,
        name: data.name,
        description: data.description,
        config: data.config,
        credentials: updates.credentials || integration.credentials,
        isActive: data.is_active,
        updatedAt: new Date(data.updated_at)
      };

      this.integrations.set(integrationId, updatedIntegration);

      // Reconfigurar sync se necessário
      if (updates.config?.syncInterval !== undefined) {
        this.clearSyncJob(integrationId);
        if (updates.config.syncInterval > 0) {
          this.scheduleSyncJob(updatedIntegration);
        }
      }

      await auditService.logAction(
        AuditAction.UPDATE,
        'integration',
        integrationId,
        updates,
        integration.schoolId
      );

      logger.info('Integration updated', 'IntegrationService', {
        id: integrationId,
        updates: Object.keys(updates)
      });

      return updatedIntegration;

    } catch (error) {
      logger.error('Failed to update integration', 'IntegrationService', { error });
      throw error;
    }
  }

  // Deletar integração
  async deleteIntegration(integrationId: string): Promise<void> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Parar sync job
      this.clearSyncJob(integrationId);

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      this.integrations.delete(integrationId);

      await auditService.logAction(
        AuditAction.DELETE,
        'integration',
        integrationId,
        { name: integration.name },
        integration.schoolId
      );

      logger.info('Integration deleted', 'IntegrationService', {
        id: integrationId,
        name: integration.name
      });

    } catch (error) {
      logger.error('Failed to delete integration', 'IntegrationService', { error });
      throw error;
    }
  }

  // Testar conexão com provider
  async testConnection(
    provider: string,
    config: IntegrationConfig,
    credentials: IntegrationCredentials
  ): Promise<APIResponse> {
    try {
      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        return {
          success: false,
          error: `Provider '${provider}' not found`
        };
      }

      // Configurar provider com credenciais
      if (providerInstance.configure) {
        providerInstance.configure(config, credentials);
      }

      // Testar conexão
      if (providerInstance.testConnection) {
        return await providerInstance.testConnection();
      }

      // Se não tem método de teste, assumir sucesso
      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Executar sincronização
  async syncIntegration(integrationId: string, force: boolean = false): Promise<SyncResult> {
    const startTime = new Date();
    let result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      duration: 0,
      startTime,
      endTime: new Date()
    };

    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      if (!integration.isActive && !force) {
        throw new Error('Integration is not active');
      }

      // Verificar rate limiting
      const rateLimitKey = `integration_sync_${integrationId}`;
      if (!await rateLimiter.checkLimit(rateLimitKey, 10, 3600)) { // 10 syncs por hora
        throw new Error('Rate limit exceeded for integration sync');
      }

      // Atualizar status
      await this.updateSyncStatus(integrationId, SyncStatus.SYNCING);

      const provider = this.providers.get(integration.provider);
      if (!provider) {
        throw new Error(`Provider '${integration.provider}' not found`);
      }

      // Configurar provider
      if (provider.configure) {
        provider.configure(integration.config, integration.credentials);
      }

      // Executar sincronização baseada no tipo
      switch (integration.type) {
        case IntegrationType.PAYMENT:
          result = await this.syncPayments(provider, integration);
          break;
        case IntegrationType.EMAIL:
          result = await this.syncEmails(provider, integration);
          break;
        case IntegrationType.CALENDAR:
          result = await this.syncCalendar(provider, integration);
          break;
        default:
          if (provider.sync) {
            result = await provider.sync(integration);
          } else {
            throw new Error(`Sync not implemented for type '${integration.type}'`);
          }
      }

      result.success = result.errors.length === 0;
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();

      // Atualizar status e última sincronização
      await this.updateSyncStatus(
        integrationId,
        result.success ? SyncStatus.SUCCESS : SyncStatus.ERROR,
        result.success ? undefined : result.errors[0]?.error
      );

      // Salvar resultado da sincronização
      await this.saveSyncResult(integrationId, result);

      logger.info('Integration sync completed', 'IntegrationService', {
        integrationId,
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        duration: result.duration
      });

      return result;

    } catch (error) {
      result.success = false;
      result.errors.push({
        record: null,
        error: error instanceof Error ? error.message : String(error)
      });
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - startTime.getTime();

      await this.updateSyncStatus(
        integrationId,
        SyncStatus.ERROR,
        error instanceof Error ? error.message : String(error)
      );

      logger.error('Integration sync failed', 'IntegrationService', {
        integrationId,
        error
      });

      return result;
    }
  }

  // Sincronizar pagamentos
  private async syncPayments(provider: PaymentProvider, integration: Integration): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      duration: 0,
      startTime: new Date(),
      endTime: new Date()
    };

    try {
      // Obter pagamentos do provider
      const response = await provider.listPayments({
        since: integration.lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch payments');
      }

      const payments = Array.isArray(response.data) ? response.data : [response.data];
      result.recordsProcessed = payments.length;

      for (const payment of payments) {
        try {
          // Mapear campos do provider para formato interno
          const mappedPayment = this.mapFields(payment, integration.config.fieldMappings || {});
          
          // Verificar se pagamento já existe
          const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('external_id', payment.id)
            .eq('school_id', integration.schoolId)
            .single();

          if (existingPayment) {
            // Atualizar pagamento existente
            const { error } = await supabase
              .from('payments')
              .update({
                ...mappedPayment,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPayment.id);

            if (error) throw error;
            result.recordsUpdated++;
          } else {
            // Criar novo pagamento
            const { error } = await supabase
              .from('payments')
              .insert({
                ...mappedPayment,
                external_id: payment.id,
                school_id: integration.schoolId,
                integration_id: integration.id
              });

            if (error) throw error;
            result.recordsCreated++;
          }

        } catch (error) {
          result.errors.push({
            record: payment,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

    } catch (error) {
      result.errors.push({
        record: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return result;
  }

  // Sincronizar emails
  private async syncEmails(provider: EmailProvider, integration: Integration): Promise<SyncResult> {
    // Implementação similar ao syncPayments
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      duration: 0,
      startTime: new Date(),
      endTime: new Date()
    };
  }

  // Sincronizar calendário
  private async syncCalendar(provider: CalendarProvider, integration: Integration): Promise<SyncResult> {
    // Implementação similar ao syncPayments
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      recordsSkipped: 0,
      errors: [],
      warnings: [],
      duration: 0,
      startTime: new Date(),
      endTime: new Date()
    };
  }

  // Mapear campos usando field mappings
  private mapFields(data: any, mappings: Record<string, string>): any {
    const mapped: any = {};
    
    for (const [internalField, externalField] of Object.entries(mappings)) {
      if (data[externalField] !== undefined) {
        mapped[internalField] = data[externalField];
      }
    }
    
    return mapped;
  }

  // Agendar job de sincronização
  private scheduleSyncJob(integration: Integration): void {
    if (!integration.config.syncInterval) return;

    const intervalMs = integration.config.syncInterval * 60 * 1000; // converter para ms
    
    const timer = setInterval(async () => {
      try {
        await this.syncIntegration(integration.id);
      } catch (error) {
        logger.error('Scheduled sync failed', 'IntegrationService', {
          integrationId: integration.id,
          error
        });
      }
    }, intervalMs);

    this.syncTimers.set(integration.id, timer);
    
    logger.debug('Sync job scheduled', 'IntegrationService', {
      integrationId: integration.id,
      intervalMinutes: integration.config.syncInterval
    });
  }

  // Limpar job de sincronização
  private clearSyncJob(integrationId: string): void {
    const timer = this.syncTimers.get(integrationId);
    if (timer) {
      clearInterval(timer);
      this.syncTimers.delete(integrationId);
      
      logger.debug('Sync job cleared', 'IntegrationService', {
        integrationId
      });
    }
  }

  // Atualizar status de sincronização
  private async updateSyncStatus(
    integrationId: string,
    status: SyncStatus,
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        sync_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === SyncStatus.SUCCESS) {
        updateData.last_sync = new Date().toISOString();
        updateData.last_error = null;
      } else if (status === SyncStatus.ERROR && error) {
        updateData.last_error = error;
      }

      const { error: updateError } = await supabase
        .from('integrations')
        .update(updateData)
        .eq('id', integrationId);

      if (updateError) throw updateError;

      // Atualizar cache local
      const integration = this.integrations.get(integrationId);
      if (integration) {
        integration.syncStatus = status;
        if (status === SyncStatus.SUCCESS) {
          integration.lastSync = new Date();
          integration.lastError = undefined;
        } else if (status === SyncStatus.ERROR && error) {
          integration.lastError = error;
        }
        integration.updatedAt = new Date();
      }

    } catch (error) {
      logger.error('Failed to update sync status', 'IntegrationService', {
        integrationId,
        status,
        error
      });
    }
  }

  // Salvar resultado da sincronização
  private async saveSyncResult(integrationId: string, result: SyncResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('integration_sync_logs')
        .insert({
          integration_id: integrationId,
          success: result.success,
          records_processed: result.recordsProcessed,
          records_created: result.recordsCreated,
          records_updated: result.recordsUpdated,
          records_deleted: result.recordsDeleted,
          records_skipped: result.recordsSkipped,
          errors: result.errors,
          warnings: result.warnings,
          duration: result.duration,
          started_at: result.startTime.toISOString(),
          completed_at: result.endTime.toISOString()
        });

      if (error) throw error;

    } catch (error) {
      logger.error('Failed to save sync result', 'IntegrationService', {
        integrationId,
        error
      });
    }
  }

  // Processar webhook
  async processWebhook(
    integrationId: string,
    payload: any,
    signature?: string
  ): Promise<void> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      // Verificar assinatura se configurada
      if (signature && this.webhookSecrets.has(integrationId)) {
        const secret = this.webhookSecrets.get(integrationId)!;
        if (!this.verifyWebhookSignature(payload, signature, secret)) {
          throw new Error('Invalid webhook signature');
        }
      }

      const provider = this.providers.get(integration.provider);
      if (!provider) {
        throw new Error(`Provider '${integration.provider}' not found`);
      }

      // Processar webhook baseado no provider
      if (provider.processWebhook) {
        await provider.processWebhook(payload, integration);
      }

      // Registrar webhook
      await this.logWebhook(integrationId, payload, true);

      logger.info('Webhook processed', 'IntegrationService', {
        integrationId,
        event: payload.event || 'unknown'
      });

    } catch (error) {
      await this.logWebhook(integrationId, payload, false, error);
      
      logger.error('Failed to process webhook', 'IntegrationService', {
        integrationId,
        error
      });
      
      throw error;
    }
  }

  // Verificar assinatura do webhook
  private verifyWebhookSignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    try {
      // Implementar verificação baseada no provider
      // Por enquanto, retornar true
      return true;
    } catch {
      return false;
    }
  }

  // Registrar webhook
  private async logWebhook(
    integrationId: string,
    payload: any,
    success: boolean,
    error?: any
  ): Promise<void> {
    try {
      const { error: logError } = await supabase
        .from('integration_webhook_logs')
        .insert({
          integration_id: integrationId,
          payload,
          success,
          error: error ? (error instanceof Error ? error.message : String(error)) : null,
          processed_at: new Date().toISOString()
        });

      if (logError) throw logError;

    } catch (logError) {
      logger.error('Failed to log webhook', 'IntegrationService', {
        integrationId,
        error: logError
      });
    }
  }

  // Criptografar credenciais
  private encryptCredentials(credentials: IntegrationCredentials): IntegrationCredentials {
    // Em produção, usar criptografia real
    // Por enquanto, retornar as credenciais como estão
    return credentials;
  }

  // Descriptografar credenciais
  private decryptCredentials(credentials: IntegrationCredentials): IntegrationCredentials {
    // Em produção, usar descriptografia real
    // Por enquanto, retornar as credenciais como estão
    return credentials;
  }

  // Obter integração por ID
  getIntegration(integrationId: string): Integration | undefined {
    return this.integrations.get(integrationId);
  }

  // Obter integrações por escola
  getIntegrationsBySchool(schoolId: string): Integration[] {
    return Array.from(this.integrations.values())
      .filter(integration => integration.schoolId === schoolId);
  }

  // Obter integrações por tipo
  getIntegrationsByType(type: IntegrationType, schoolId?: string): Integration[] {
    return Array.from(this.integrations.values())
      .filter(integration => 
        integration.type === type && 
        (!schoolId || integration.schoolId === schoolId)
      );
  }

  // Obter provider
  getProvider(name: string): any {
    return this.providers.get(name);
  }

  // Listar providers disponíveis
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Pausar integração
  async pauseIntegration(integrationId: string): Promise<void> {
    await this.updateSyncStatus(integrationId, SyncStatus.PAUSED);
    this.clearSyncJob(integrationId);
    
    logger.info('Integration paused', 'IntegrationService', { integrationId });
  }

  // Retomar integração
  async resumeIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    await this.updateSyncStatus(integrationId, SyncStatus.IDLE);
    
    if (integration.config.syncInterval) {
      this.scheduleSyncJob(integration);
    }
    
    logger.info('Integration resumed', 'IntegrationService', { integrationId });
  }

  // Obter estatísticas
  getStats(): {
    totalIntegrations: number;
    activeIntegrations: number;
    integrationsByType: Record<string, number>;
    integrationsByStatus: Record<string, number>;
  } {
    const integrations = Array.from(this.integrations.values());
    
    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.isActive).length,
      integrationsByType: integrations.reduce((acc, integration) => {
        acc[integration.type] = (acc[integration.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      integrationsByStatus: integrations.reduce((acc, integration) => {
        acc[integration.syncStatus] = (acc[integration.syncStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Destruir serviço
  destroy(): void {
    // Limpar todos os timers
    for (const timer of this.syncTimers.values()) {
      clearInterval(timer);
    }
    this.syncTimers.clear();
    
    logger.info('Integration service destroyed', 'IntegrationService');
  }
}

// Implementações básicas dos providers (podem ser expandidas)
class StripeProvider implements PaymentProvider {
  private config?: IntegrationConfig;
  private credentials?: IntegrationCredentials;

  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {
    this.config = config;
    this.credentials = credentials;
  }

  async testConnection(): Promise<APIResponse> {
    // Implementar teste de conexão com Stripe
    return { success: true };
  }

  async createPayment(amount: number, currency: string, metadata?: any): Promise<APIResponse> {
    // Implementar criação de pagamento
    return { success: true, data: { id: 'payment_123' } };
  }

  async getPayment(paymentId: string): Promise<APIResponse> {
    // Implementar busca de pagamento
    return { success: true, data: { id: paymentId } };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<APIResponse> {
    // Implementar reembolso
    return { success: true };
  }

  async listPayments(filters?: any): Promise<APIResponse> {
    // Implementar listagem de pagamentos
    return { success: true, data: [] };
  }

  async createSubscription(planId: string, customerId: string): Promise<APIResponse> {
    // Implementar criação de assinatura
    return { success: true, data: { id: 'sub_123' } };
  }

  async cancelSubscription(subscriptionId: string): Promise<APIResponse> {
    // Implementar cancelamento de assinatura
    return { success: true };
  }
}

// Implementações similares para outros providers
class MercadoPagoProvider implements PaymentProvider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
  async createPayment(amount: number, currency: string, metadata?: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async getPayment(paymentId: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async refundPayment(paymentId: string, amount?: number): Promise<APIResponse> { return { success: true }; }
  async listPayments(filters?: any): Promise<APIResponse> { return { success: true, data: [] }; }
  async createSubscription(planId: string, customerId: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async cancelSubscription(subscriptionId: string): Promise<APIResponse> { return { success: true }; }
}

class SendGridProvider implements EmailProvider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
  async sendEmail(to: string[], subject: string, content: string, options?: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async sendTemplate(templateId: string, to: string[], variables?: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async createTemplate(name: string, subject: string, content: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async getDeliveryStatus(messageId: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async manageBounces(): Promise<APIResponse> { return { success: true, data: {} }; }
}

class TwilioProvider implements SMSProvider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
  async sendSMS(to: string, message: string, options?: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async sendBulkSMS(recipients: string[], message: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async getDeliveryStatus(messageId: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async getBalance(): Promise<APIResponse> { return { success: true, data: {} }; }
}

class GoogleCalendarProvider implements CalendarProvider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
  async createEvent(event: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async updateEvent(eventId: string, updates: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async deleteEvent(eventId: string): Promise<APIResponse> { return { success: true }; }
  async listEvents(filters?: any): Promise<APIResponse> { return { success: true, data: [] }; }
  async createCalendar(name: string, description?: string): Promise<APIResponse> { return { success: true, data: {} }; }
}

class ZoomProvider implements VideoConferenceProvider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
  async createMeeting(title: string, startTime: Date, duration: number, options?: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async updateMeeting(meetingId: string, updates: any): Promise<APIResponse> { return { success: true, data: {} }; }
  async deleteMeeting(meetingId: string): Promise<APIResponse> { return { success: true }; }
  async getMeeting(meetingId: string): Promise<APIResponse> { return { success: true, data: {} }; }
  async listMeetings(filters?: any): Promise<APIResponse> { return { success: true, data: [] }; }
  async generateJoinUrl(meetingId: string, participantName: string): Promise<APIResponse> { return { success: true, data: {} }; }
}

class AWSS3Provider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
}

class MailchimpProvider {
  configure(config: IntegrationConfig, credentials: IntegrationCredentials): void {}
  async testConnection(): Promise<APIResponse> { return { success: true }; }
}

// Instância singleton
export const integrationService = IntegrationService.getInstance();

// Hook para usar o serviço de integração em componentes React
export function useIntegrationService() {
  return integrationService;
}

export default integrationService;