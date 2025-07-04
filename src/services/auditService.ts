import { logger } from './logger';
import { supabase } from '../integrations/supabase/client';

// Tipos para o sistema de auditoria
export enum AuditAction {
  // Ações de autenticação
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  
  // Ações de escola
  SCHOOL_CREATE = 'SCHOOL_CREATE',
  SCHOOL_UPDATE = 'SCHOOL_UPDATE',
  SCHOOL_DELETE = 'SCHOOL_DELETE',
  SCHOOL_SETTINGS_UPDATE = 'SCHOOL_SETTINGS_UPDATE',
  
  // Ações de usuários
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_INVITE = 'USER_INVITE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE = 'USER_STATUS_CHANGE',
  
  // Ações de alunos
  STUDENT_CREATE = 'STUDENT_CREATE',
  STUDENT_UPDATE = 'STUDENT_UPDATE',
  STUDENT_DELETE = 'STUDENT_DELETE',
  STUDENT_ENROLL = 'STUDENT_ENROLL',
  STUDENT_UNENROLL = 'STUDENT_UNENROLL',
  
  // Ações de professores
  TEACHER_CREATE = 'TEACHER_CREATE',
  TEACHER_UPDATE = 'TEACHER_UPDATE',
  TEACHER_DELETE = 'TEACHER_DELETE',
  TEACHER_ASSIGN = 'TEACHER_ASSIGN',
  TEACHER_UNASSIGN = 'TEACHER_UNASSIGN',
  
  // Ações de turmas
  CLASS_CREATE = 'CLASS_CREATE',
  CLASS_UPDATE = 'CLASS_UPDATE',
  CLASS_DELETE = 'CLASS_DELETE',
  CLASS_SCHEDULE_UPDATE = 'CLASS_SCHEDULE_UPDATE',
  
  // Ações de instrumentos
  INSTRUMENT_CREATE = 'INSTRUMENT_CREATE',
  INSTRUMENT_UPDATE = 'INSTRUMENT_UPDATE',
  INSTRUMENT_DELETE = 'INSTRUMENT_DELETE',
  INSTRUMENT_ASSIGN = 'INSTRUMENT_ASSIGN',
  INSTRUMENT_RETURN = 'INSTRUMENT_RETURN',
  
  // Ações de pagamentos
  PAYMENT_CREATE = 'PAYMENT_CREATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_DELETE = 'PAYMENT_DELETE',
  PAYMENT_PROCESS = 'PAYMENT_PROCESS',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  
  // Ações de relatórios
  REPORT_GENERATE = 'REPORT_GENERATE',
  REPORT_EXPORT = 'REPORT_EXPORT',
  REPORT_VIEW = 'REPORT_VIEW',
  
  // Ações de sistema
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // Ações de segurança
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL = 'PARTIAL',
  BLOCKED = 'BLOCKED'
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AuditEntry {
  id?: string;
  timestamp: string;
  action: AuditAction;
  result: AuditResult;
  severity: AuditSeverity;
  user_id?: string;
  school_id?: string;
  target_id?: string;
  target_type?: string;
  description: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  duration?: number;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AuditFilter {
  action?: AuditAction;
  result?: AuditResult;
  severity?: AuditSeverity;
  user_id?: string;
  school_id?: string;
  target_type?: string;
  start_date?: Date;
  end_date?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEntries: number;
  entriesByAction: Record<AuditAction, number>;
  entriesByResult: Record<AuditResult, number>;
  entriesBySeverity: Record<AuditSeverity, number>;
  successRate: number;
  failureRate: number;
  topUsers: Array<{ user_id: string; count: number }>;
  topActions: Array<{ action: AuditAction; count: number }>;
  securityIncidents: number;
  averageResponseTime: number;
  recentActivity: AuditEntry[];
}

class AuditService {
  private static instance: AuditService;
  private sessionId: string;
  private requestCounter: number = 0;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private generateSessionId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${this.sessionId}_${this.requestCounter}`;
  }

  private getClientInfo(): { ip_address?: string; user_agent?: string } {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      user_agent: navigator.userAgent,
      // IP será obtido no backend
      ip_address: undefined
    };
  }

  private getCurrentUser(): { user_id?: string; school_id?: string } {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          user_id: user.id,
          school_id: user.school_id
        };
      }
    } catch (e) {
      logger.warn('Failed to get current user for audit', 'AuditService', { error: e });
    }
    return {};
  }

  private determineSeverity(action: AuditAction, result: AuditResult): AuditSeverity {
    // Ações críticas de segurança
    if ([
      AuditAction.SECURITY_VIOLATION,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.SYSTEM_BACKUP,
      AuditAction.SYSTEM_RESTORE,
      AuditAction.DATA_EXPORT
    ].includes(action)) {
      return AuditSeverity.CRITICAL;
    }

    // Ações de alta importância
    if ([
      AuditAction.USER_DELETE,
      AuditAction.SCHOOL_DELETE,
      AuditAction.STUDENT_DELETE,
      AuditAction.TEACHER_DELETE,
      AuditAction.CLASS_DELETE,
      AuditAction.PAYMENT_REFUND,
      AuditAction.USER_ROLE_CHANGE
    ].includes(action)) {
      return AuditSeverity.HIGH;
    }

    // Falhas em ações importantes
    if (result === AuditResult.FAILURE && [
      AuditAction.LOGIN,
      AuditAction.SIGNUP,
      AuditAction.PASSWORD_RESET,
      AuditAction.PAYMENT_PROCESS
    ].includes(action)) {
      return AuditSeverity.HIGH;
    }

    // Ações de média importância
    if ([
      AuditAction.USER_CREATE,
      AuditAction.STUDENT_CREATE,
      AuditAction.TEACHER_CREATE,
      AuditAction.CLASS_CREATE,
      AuditAction.PAYMENT_CREATE,
      AuditAction.SCHOOL_UPDATE,
      AuditAction.USER_UPDATE
    ].includes(action)) {
      return AuditSeverity.MEDIUM;
    }

    // Ações de baixa importância
    return AuditSeverity.LOW;
  }

  async log(
    action: AuditAction,
    result: AuditResult,
    description: string,
    options: {
      target_id?: string;
      target_type?: string;
      details?: Record<string, any>;
      duration?: number;
      error_message?: string;
      metadata?: Record<string, any>;
      severity?: AuditSeverity;
    } = {}
  ): Promise<void> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const clientInfo = this.getClientInfo();
    const userInfo = this.getCurrentUser();
    const severity = options.severity || this.determineSeverity(action, result);

    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      result,
      severity,
      description,
      session_id: this.sessionId,
      request_id: requestId,
      duration: options.duration,
      error_message: options.error_message,
      ...userInfo,
      ...clientInfo,
      ...options
    };

    try {
      // Log localmente primeiro
      logger.info(
        `Audit: ${action} - ${result}`,
        'AuditService',
        {
          action,
          result,
          severity,
          description,
          target_id: options.target_id,
          target_type: options.target_type,
          duration: options.duration
        }
      );

      // Salvar no banco de dados
      const { error } = await supabase
        .from('audit_logs')
        .insert([entry]);

      if (error) {
        logger.error('Failed to save audit entry to database', 'AuditService', { error, entry });
        // Salvar localmente como fallback
        this.saveToLocalStorage(entry);
      } else {
        const duration = Date.now() - startTime;
        logger.debug('Audit entry saved successfully', 'AuditService', { duration, requestId });
      }

      // Alertas para eventos críticos
      if (severity === AuditSeverity.CRITICAL || result === AuditResult.BLOCKED) {
        this.triggerSecurityAlert(entry);
      }

    } catch (error) {
      logger.error('Failed to log audit entry', 'AuditService', { error, entry });
      this.saveToLocalStorage(entry);
    }
  }

  private saveToLocalStorage(entry: AuditEntry): void {
    try {
      const existingLogs = localStorage.getItem('audit_logs_fallback');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);
      
      // Manter apenas os últimos 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('audit_logs_fallback', JSON.stringify(logs));
    } catch (error) {
      logger.error('Failed to save audit entry to localStorage', 'AuditService', { error });
    }
  }

  private triggerSecurityAlert(entry: AuditEntry): void {
    logger.fatal(
      `SECURITY ALERT: ${entry.action} - ${entry.description}`,
      'SecurityAlert',
      {
        entry,
        timestamp: entry.timestamp,
        user_id: entry.user_id,
        ip_address: entry.ip_address
      }
    );

    // Aqui você pode adicionar integração com sistemas de alerta
    // como Slack, email, SMS, etc.
  }

  // Métodos de conveniência para ações comuns
  async logLogin(success: boolean, user_id?: string, error_message?: string): Promise<void> {
    await this.log(
      AuditAction.LOGIN,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      success ? 'User logged in successfully' : 'Login attempt failed',
      {
        target_id: user_id,
        target_type: 'user',
        error_message
      }
    );
  }

  async logLogout(user_id?: string): Promise<void> {
    await this.log(
      AuditAction.LOGOUT,
      AuditResult.SUCCESS,
      'User logged out',
      {
        target_id: user_id,
        target_type: 'user'
      }
    );
  }

  async logSignup(success: boolean, user_id?: string, error_message?: string): Promise<void> {
    await this.log(
      AuditAction.SIGNUP,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      success ? 'User registered successfully' : 'Registration failed',
      {
        target_id: user_id,
        target_type: 'user',
        error_message
      }
    );
  }

  async logUserCreate(success: boolean, user_id?: string, details?: Record<string, any>, error_message?: string): Promise<void> {
    await this.log(
      AuditAction.USER_CREATE,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      success ? 'User created successfully' : 'User creation failed',
      {
        target_id: user_id,
        target_type: 'user',
        details,
        error_message
      }
    );
  }

  async logUserUpdate(success: boolean, user_id?: string, details?: Record<string, any>, error_message?: string): Promise<void> {
    await this.log(
      AuditAction.USER_UPDATE,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      success ? 'User updated successfully' : 'User update failed',
      {
        target_id: user_id,
        target_type: 'user',
        details,
        error_message
      }
    );
  }

  async logUserDelete(success: boolean, user_id?: string, error_message?: string): Promise<void> {
    await this.log(
      AuditAction.USER_DELETE,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      success ? 'User deleted successfully' : 'User deletion failed',
      {
        target_id: user_id,
        target_type: 'user',
        error_message,
        severity: AuditSeverity.HIGH
      }
    );
  }

  async logSecurityViolation(description: string, details?: Record<string, any>): Promise<void> {
    await this.log(
      AuditAction.SECURITY_VIOLATION,
      AuditResult.BLOCKED,
      description,
      {
        details,
        severity: AuditSeverity.CRITICAL
      }
    );
  }

  async logUnauthorizedAccess(resource: string, details?: Record<string, any>): Promise<void> {
    await this.log(
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditResult.BLOCKED,
      `Unauthorized access attempt to ${resource}`,
      {
        target_id: resource,
        target_type: 'resource',
        details,
        severity: AuditSeverity.CRITICAL
      }
    );
  }

  async logRateLimitExceeded(endpoint: string, details?: Record<string, any>): Promise<void> {
    await this.log(
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditResult.BLOCKED,
      `Rate limit exceeded for ${endpoint}`,
      {
        target_id: endpoint,
        target_type: 'endpoint',
        details,
        severity: AuditSeverity.HIGH
      }
    );
  }

  // Métodos de consulta
  async getAuditLogs(filter: AuditFilter = {}): Promise<AuditEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filter.action) {
        query = query.eq('action', filter.action);
      }
      if (filter.result) {
        query = query.eq('result', filter.result);
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.school_id) {
        query = query.eq('school_id', filter.school_id);
      }
      if (filter.target_type) {
        query = query.eq('target_type', filter.target_type);
      }
      if (filter.start_date) {
        query = query.gte('timestamp', filter.start_date.toISOString());
      }
      if (filter.end_date) {
        query = query.lte('timestamp', filter.end_date.toISOString());
      }
      if (filter.search) {
        query = query.or(`description.ilike.%${filter.search}%,action.ilike.%${filter.search}%`);
      }
      if (filter.limit) {
        query = query.limit(filter.limit);
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch audit logs', 'AuditService', { error, filter });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch audit logs', 'AuditService', { error, filter });
      return [];
    }
  }

  async getAuditStats(filter: AuditFilter = {}): Promise<AuditStats> {
    try {
      const logs = await this.getAuditLogs({ ...filter, limit: 10000 });
      
      const entriesByAction: Record<AuditAction, number> = {} as any;
      const entriesByResult: Record<AuditResult, number> = {} as any;
      const entriesBySeverity: Record<AuditSeverity, number> = {} as any;
      const userCounts: Record<string, number> = {};
      const actionCounts: Record<AuditAction, number> = {} as any;
      
      let totalDuration = 0;
      let durationCount = 0;
      let securityIncidents = 0;
      let successCount = 0;
      let failureCount = 0;

      for (const log of logs) {
        // Contadores por categoria
        entriesByAction[log.action] = (entriesByAction[log.action] || 0) + 1;
        entriesByResult[log.result] = (entriesByResult[log.result] || 0) + 1;
        entriesBySeverity[log.severity] = (entriesBySeverity[log.severity] || 0) + 1;
        
        // Contadores de usuários e ações
        if (log.user_id) {
          userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
        }
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        
        // Métricas de performance
        if (log.duration) {
          totalDuration += log.duration;
          durationCount++;
        }
        
        // Contadores de resultado
        if (log.result === AuditResult.SUCCESS) {
          successCount++;
        } else if (log.result === AuditResult.FAILURE) {
          failureCount++;
        }
        
        // Incidentes de segurança
        if (log.severity === AuditSeverity.CRITICAL || [
          AuditAction.SECURITY_VIOLATION,
          AuditAction.UNAUTHORIZED_ACCESS,
          AuditAction.SUSPICIOUS_ACTIVITY
        ].includes(log.action)) {
          securityIncidents++;
        }
      }

      const topUsers = Object.entries(userCounts)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action: action as AuditAction, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const totalEntries = logs.length;
      const successRate = totalEntries > 0 ? (successCount / totalEntries) * 100 : 0;
      const failureRate = totalEntries > 0 ? (failureCount / totalEntries) * 100 : 0;
      const averageResponseTime = durationCount > 0 ? totalDuration / durationCount : 0;

      return {
        totalEntries,
        entriesByAction,
        entriesByResult,
        entriesBySeverity,
        successRate,
        failureRate,
        topUsers,
        topActions,
        securityIncidents,
        averageResponseTime,
        recentActivity: logs.slice(0, 20)
      };
    } catch (error) {
      logger.error('Failed to generate audit stats', 'AuditService', { error });
      return {
        totalEntries: 0,
        entriesByAction: {} as any,
        entriesByResult: {} as any,
        entriesBySeverity: {} as any,
        successRate: 0,
        failureRate: 0,
        topUsers: [],
        topActions: [],
        securityIncidents: 0,
        averageResponseTime: 0,
        recentActivity: []
      };
    }
  }

  async exportAuditLogs(filter: AuditFilter = {}, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.getAuditLogs(filter);
    
    if (format === 'csv') {
      const headers = [
        'timestamp', 'action', 'result', 'severity', 'user_id', 'school_id',
        'target_id', 'target_type', 'description', 'ip_address', 'user_agent'
      ];
      
      const rows = logs.map(log => [
        log.timestamp,
        log.action,
        log.result,
        log.severity,
        log.user_id || '',
        log.school_id || '',
        log.target_id || '',
        log.target_type || '',
        log.description,
        log.ip_address || '',
        log.user_agent || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(logs, null, 2);
  }

  // Método para sincronizar logs locais com o servidor
  async syncLocalLogs(): Promise<void> {
    try {
      const localLogsStr = localStorage.getItem('audit_logs_fallback');
      if (!localLogsStr) return;

      const localLogs: AuditEntry[] = JSON.parse(localLogsStr);
      if (localLogs.length === 0) return;

      logger.info(`Syncing ${localLogs.length} local audit logs`, 'AuditService');

      const { error } = await supabase
        .from('audit_logs')
        .insert(localLogs);

      if (error) {
        logger.error('Failed to sync local audit logs', 'AuditService', { error });
      } else {
        localStorage.removeItem('audit_logs_fallback');
        logger.info('Local audit logs synced successfully', 'AuditService');
      }
    } catch (error) {
      logger.error('Failed to sync local audit logs', 'AuditService', { error });
    }
  }
}

// Instância singleton
export const auditService = AuditService.getInstance();

// Hook para usar o serviço de auditoria em componentes React
export function useAuditService() {
  return auditService;
}

// Decorator para auditoria automática de métodos
export function withAudit(action: AuditAction, description?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const auditDescription = description || `${propertyName} executed`;

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        await auditService.log(
          action,
          AuditResult.SUCCESS,
          auditDescription,
          {
            duration,
            details: { args, result }
          }
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        await auditService.log(
          action,
          AuditResult.FAILURE,
          auditDescription,
          {
            duration,
            error_message: (error as Error).message,
            details: { args }
          }
        );
        
        throw error;
      }
    };
  };
}

export default auditService;