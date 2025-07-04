import { logger } from './logger';
import { auditService, AuditAction } from './auditService';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Tipos para notificações
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId?: string;
  schoolId?: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
  data?: Record<string, any>;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  PAYMENT = 'PAYMENT',
  ATTENDANCE = 'ATTENDANCE',
  GRADE = 'GRADE',
  SCHEDULE = 'SCHEDULE',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  REMINDER = 'REMINDER',
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  message: string;
  variables: string[];
  enabled: boolean;
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  types: Partial<Record<NotificationType, boolean>>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
}

export interface NotificationConfig {
  enableRealtime: boolean;
  enablePush: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  maxNotifications: number;
  retentionDays: number;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

class NotificationService {
  private static instance: NotificationService;
  private config: NotificationConfig;
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, ((notification: Notification) => void)[]> = new Map();
  private queue: Notification[] = [];
  private processing = false;

  private constructor() {
    this.config = {
      enableRealtime: true,
      enablePush: true,
      enableEmail: true,
      enableSms: false,
      maxNotifications: 100,
      retentionDays: 30,
      batchSize: 10,
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.initializeTemplates();
    this.startProcessing();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeTemplates(): void {
    // Templates padrão
    this.templates.set('payment_due', {
      id: 'payment_due',
      name: 'Pagamento Vencendo',
      type: NotificationType.PAYMENT,
      title: 'Pagamento Vencendo',
      message: 'Sua mensalidade de {{month}} vence em {{days}} dias. Valor: R$ {{amount}}',
      variables: ['month', 'days', 'amount'],
      enabled: true
    });

    this.templates.set('payment_overdue', {
      id: 'payment_overdue',
      name: 'Pagamento em Atraso',
      type: NotificationType.PAYMENT,
      title: 'Pagamento em Atraso',
      message: 'Sua mensalidade de {{month}} está em atraso há {{days}} dias. Valor: R$ {{amount}}',
      variables: ['month', 'days', 'amount'],
      enabled: true
    });

    this.templates.set('class_reminder', {
      id: 'class_reminder',
      name: 'Lembrete de Aula',
      type: NotificationType.REMINDER,
      title: 'Aula em {{time}}',
      message: 'Você tem aula de {{subject}} com {{teacher}} em {{time}}',
      variables: ['time', 'subject', 'teacher'],
      enabled: true
    });

    this.templates.set('grade_posted', {
      id: 'grade_posted',
      name: 'Nova Nota',
      type: NotificationType.GRADE,
      title: 'Nova Nota Disponível',
      message: 'Nova nota em {{subject}}: {{grade}}. {{comment}}',
      variables: ['subject', 'grade', 'comment'],
      enabled: true
    });

    this.templates.set('attendance_alert', {
      id: 'attendance_alert',
      name: 'Alerta de Frequência',
      type: NotificationType.ATTENDANCE,
      title: 'Alerta de Frequência',
      message: 'Frequência baixa em {{subject}}: {{percentage}}%. Mínimo exigido: {{minimum}}%',
      variables: ['subject', 'percentage', 'minimum'],
      enabled: true
    });

    this.templates.set('system_maintenance', {
      id: 'system_maintenance',
      name: 'Manutenção do Sistema',
      type: NotificationType.SYSTEM,
      title: 'Manutenção Programada',
      message: 'O sistema estará em manutenção de {{start}} até {{end}}. {{details}}',
      variables: ['start', 'end', 'details'],
      enabled: true
    });

    this.templates.set('security_alert', {
      id: 'security_alert',
      name: 'Alerta de Segurança',
      type: NotificationType.SECURITY,
      title: 'Alerta de Segurança',
      message: 'Atividade suspeita detectada: {{activity}}. {{action}}',
      variables: ['activity', 'action'],
      enabled: true
    });
  }

  // Criar notificação
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false
    };

    // Adicionar à fila
    this.queue.push(newNotification);
    
    // Armazenar localmente
    this.notifications.set(newNotification.id, newNotification);

    logger.info('Notification created', 'NotificationService', { 
      id: newNotification.id, 
      type: newNotification.type,
      priority: newNotification.priority
    });

    // Auditoria
    auditService.logSystemEvent(
      `Notification created: ${newNotification.title}`,
      { notificationId: newNotification.id, type: newNotification.type }
    );

    return newNotification;
  }

  // Criar notificação a partir de template
  async createFromTemplate(
    templateId: string, 
    variables: Record<string, string>,
    options: {
      userId?: string;
      schoolId?: string;
      priority?: NotificationPriority;
      expiresAt?: string;
      actions?: NotificationAction[];
    } = {}
  ): Promise<Notification | null> {
    const template = this.templates.get(templateId);
    if (!template || !template.enabled) {
      logger.warn(`Template not found or disabled: ${templateId}`, 'NotificationService');
      return null;
    }

    // Substituir variáveis
    let title = template.title;
    let message = template.message;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    return this.createNotification({
      title,
      message,
      type: template.type,
      priority: options.priority || NotificationPriority.NORMAL,
      userId: options.userId,
      schoolId: options.schoolId,
      expiresAt: options.expiresAt,
      actions: options.actions
    });
  }

  // Processar fila de notificações
  private async startProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    while (this.processing) {
      if (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.config.batchSize);
        await this.processBatch(batch);
      }
      
      // Aguardar antes da próxima verificação
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async processBatch(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      try {
        await this.processNotification(notification);
      } catch (error) {
        logger.error('Failed to process notification', 'NotificationService', {
          notificationId: notification.id,
          error
        });
      }
    }
  }

  private async processNotification(notification: Notification): Promise<void> {
    // Verificar preferências do usuário
    if (notification.userId) {
      const preferences = await this.getUserPreferences(notification.userId);
      if (!this.shouldSendNotification(notification, preferences)) {
        logger.debug('Notification skipped due to user preferences', 'NotificationService', {
          notificationId: notification.id,
          userId: notification.userId
        });
        return;
      }
    }

    // Enviar através dos canais habilitados
    const promises: Promise<void>[] = [];

    // In-app notification (sempre enviar)
    promises.push(this.sendInAppNotification(notification));

    // Push notification
    if (this.config.enablePush) {
      promises.push(this.sendPushNotification(notification));
    }

    // Email notification
    if (this.config.enableEmail) {
      promises.push(this.sendEmailNotification(notification));
    }

    // SMS notification
    if (this.config.enableSms) {
      promises.push(this.sendSmsNotification(notification));
    }

    // Realtime notification
    if (this.config.enableRealtime) {
      promises.push(this.sendRealtimeNotification(notification));
    }

    await Promise.allSettled(promises);

    // Salvar no banco de dados
    await this.saveNotificationToDatabase(notification);
  }

  private shouldSendNotification(notification: Notification, preferences: NotificationPreferences): boolean {
    // Verificar se o tipo está habilitado
    if (preferences.types[notification.type] === false) {
      return false;
    }

    // Verificar horário de silêncio
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end) {
        // Permitir apenas notificações urgentes durante horário de silêncio
        return notification.priority === NotificationPriority.URGENT;
      }
    }

    return true;
  }

  // Enviar notificação in-app
  private async sendInAppNotification(notification: Notification): Promise<void> {
    // Notificar listeners
    const listeners = this.listeners.get('in-app') || [];
    listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        logger.error('Error in notification listener', 'NotificationService', { error });
      }
    });
  }

  // Enviar push notification
  private async sendPushNotification(notification: Notification): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se há subscription
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        return;
      }

      // Enviar através do service worker
      await registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        data: notification.data,
        actions: notification.actions?.map(action => ({
          action: action.id,
          title: action.label
        })) || [],
        requireInteraction: notification.priority === NotificationPriority.URGENT
      });

      logger.debug('Push notification sent', 'NotificationService', {
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Failed to send push notification', 'NotificationService', {
        notificationId: notification.id,
        error
      });
    }
  }

  // Enviar email notification
  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!notification.userId) return;

    try {
      // Implementar envio de email através do Supabase Edge Functions
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: notification.userId,
          subject: notification.title,
          html: this.generateEmailTemplate(notification),
          type: 'notification'
        }
      });

      if (error) {
        throw error;
      }

      logger.debug('Email notification sent', 'NotificationService', {
        notificationId: notification.id,
        userId: notification.userId
      });
    } catch (error) {
      logger.error('Failed to send email notification', 'NotificationService', {
        notificationId: notification.id,
        error
      });
    }
  }

  // Enviar SMS notification
  private async sendSmsNotification(notification: Notification): Promise<void> {
    if (!notification.userId) return;

    try {
      // Implementar envio de SMS através do Supabase Edge Functions
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: notification.userId,
          message: `${notification.title}: ${notification.message}`,
          type: 'notification'
        }
      });

      if (error) {
        throw error;
      }

      logger.debug('SMS notification sent', 'NotificationService', {
        notificationId: notification.id,
        userId: notification.userId
      });
    } catch (error) {
      logger.error('Failed to send SMS notification', 'NotificationService', {
        notificationId: notification.id,
        error
      });
    }
  }

  // Enviar notificação em tempo real
  private async sendRealtimeNotification(notification: Notification): Promise<void> {
    try {
      const channelName = notification.userId 
        ? `user:${notification.userId}` 
        : notification.schoolId 
        ? `school:${notification.schoolId}` 
        : 'global';

      let channel = this.channels.get(channelName);
      
      if (!channel) {
        channel = supabase.channel(channelName);
        this.channels.set(channelName, channel);
        
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.debug(`Subscribed to channel: ${channelName}`, 'NotificationService');
          }
        });
      }

      // Enviar notificação
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });

      logger.debug('Realtime notification sent', 'NotificationService', {
        notificationId: notification.id,
        channel: channelName
      });
    } catch (error) {
      logger.error('Failed to send realtime notification', 'NotificationService', {
        notificationId: notification.id,
        error
      });
    }
  }

  // Salvar notificação no banco de dados
  private async saveNotificationToDatabase(notification: Notification): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          user_id: notification.userId,
          school_id: notification.schoolId,
          data: notification.data,
          read: notification.read,
          expires_at: notification.expiresAt,
          actions: notification.actions
        });

      if (error) {
        throw error;
      }

      logger.debug('Notification saved to database', 'NotificationService', {
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Failed to save notification to database', 'NotificationService', {
        notificationId: notification.id,
        error
      });
    }
  }

  // Gerar template de email
  private generateEmailTemplate(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${notification.title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .priority-urgent { border-left: 5px solid #dc3545; }
          .priority-high { border-left: 5px solid #fd7e14; }
          .priority-normal { border-left: 5px solid #007bff; }
          .priority-low { border-left: 5px solid #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content priority-${notification.priority.toLowerCase()}">
            <p>${notification.message}</p>
            ${notification.actions ? `
              <div style="margin-top: 20px;">
                ${notification.actions.map(action => `
                  <a href="#" style="display: inline-block; padding: 10px 20px; margin: 5px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
                    ${action.label}
                  </a>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>SmartClass Dashboard - Sistema de Gestão Escolar</p>
            <p>Esta é uma notificação automática. Não responda este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Marcar como lida
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      this.notifications.set(notificationId, notification);
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      logger.debug('Notification marked as read', 'NotificationService', {
        notificationId
      });
    } catch (error) {
      logger.error('Failed to mark notification as read', 'NotificationService', {
        notificationId,
        error
      });
    }
  }

  // Marcar todas como lidas
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw error;
      }

      // Atualizar cache local
      for (const [id, notification] of this.notifications.entries()) {
        if (notification.userId === userId && !notification.read) {
          notification.read = true;
          this.notifications.set(id, notification);
        }
      }

      logger.debug('All notifications marked as read', 'NotificationService', {
        userId
      });
    } catch (error) {
      logger.error('Failed to mark all notifications as read', 'NotificationService', {
        userId,
        error
      });
    }
  }

  // Obter notificações do usuário
  async getUserNotifications(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        priority: item.priority,
        userId: item.user_id,
        schoolId: item.school_id,
        data: item.data,
        read: item.read,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        actions: item.actions
      })) || [];
    } catch (error) {
      logger.error('Failed to get user notifications', 'NotificationService', {
        userId,
        error
      });
      return [];
    }
  }

  // Obter contagem de não lidas
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      logger.error('Failed to get unread count', 'NotificationService', {
        userId,
        error
      });
      return 0;
    }
  }

  // Gerenciar preferências do usuário
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = this.preferences.get(userId);
    
    if (!preferences) {
      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found
          throw error;
        }

        preferences = data ? {
          userId: data.user_id,
          email: data.email,
          push: data.push,
          inApp: data.in_app,
          sms: data.sms,
          types: data.types || {},
          quietHours: data.quiet_hours || { enabled: false, start: '22:00', end: '08:00' },
          frequency: data.frequency || 'IMMEDIATE'
        } : {
          userId,
          email: true,
          push: true,
          inApp: true,
          sms: false,
          types: {},
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          frequency: 'IMMEDIATE'
        };

        this.preferences.set(userId, preferences);
      } catch (error) {
        logger.error('Failed to get user preferences', 'NotificationService', {
          userId,
          error
        });
        
        // Retornar preferências padrão
        preferences = {
          userId,
          email: true,
          push: true,
          inApp: true,
          sms: false,
          types: {},
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          frequency: 'IMMEDIATE'
        };
      }
    }

    return preferences;
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          email: updatedPreferences.email,
          push: updatedPreferences.push,
          in_app: updatedPreferences.inApp,
          sms: updatedPreferences.sms,
          types: updatedPreferences.types,
          quiet_hours: updatedPreferences.quietHours,
          frequency: updatedPreferences.frequency
        });

      if (error) {
        throw error;
      }

      this.preferences.set(userId, updatedPreferences);

      logger.info('User notification preferences updated', 'NotificationService', {
        userId
      });
    } catch (error) {
      logger.error('Failed to update user preferences', 'NotificationService', {
        userId,
        error
      });
      throw error;
    }
  }

  // Gerenciar listeners
  addListener(channel: string, listener: (notification: Notification) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(listener);
  }

  removeListener(channel: string, listener: (notification: Notification) => void): void {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Configuração
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Notification service config updated', 'NotificationService', { config });
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Parar processamento
    this.processing = false;

    // Desconectar canais
    for (const channel of this.channels.values()) {
      await channel.unsubscribe();
    }
    this.channels.clear();

    // Limpar listeners
    this.listeners.clear();

    // Limpar cache
    this.notifications.clear();
    this.preferences.clear();
    this.queue = [];

    logger.info('Notification service cleaned up', 'NotificationService');
  }
}

// Instância singleton
export const notificationService = NotificationService.getInstance();

// Hook para usar o serviço de notificações em componentes React
export function useNotificationService() {
  return notificationService;
}

export default notificationService;