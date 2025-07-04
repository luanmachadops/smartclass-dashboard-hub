import { logger } from './logger';
import { auditService, AuditAction } from './auditService';
import { cacheService } from './cacheService';
import { notificationService } from './notificationService';
import { supabase } from '../lib/supabase';

// Tipos para sincronização offline
export interface OfflineOperation {
  id: string;
  type: OperationType;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  originalData?: any; // Para operações de UPDATE
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: OperationPriority;
  dependencies: string[]; // IDs de operações que devem ser executadas antes
  metadata: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  operationId: string;
  error?: string;
  conflictResolution?: ConflictResolution;
  serverData?: any;
}

export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolvedData: any;
  conflictDetails: {
    localData: any;
    serverData: any;
    conflictFields: string[];
  };
}

export interface OfflineConfig {
  enableOfflineMode: boolean;
  maxOperations: number;
  syncInterval: number; // em ms
  retryInterval: number; // em ms
  maxRetries: number;
  conflictStrategy: ConflictStrategy;
  enableBackgroundSync: boolean;
  enableConflictResolution: boolean;
  prioritizeOperations: boolean;
}

export interface OfflineStats {
  isOnline: boolean;
  pendingOperations: number;
  failedOperations: number;
  lastSyncTime: number;
  totalSynced: number;
  totalConflicts: number;
  averageSyncTime: number;
  storageUsed: number;
}

export enum OperationType {
  USER_ACTION = 'USER_ACTION',
  SYSTEM_ACTION = 'SYSTEM_ACTION',
  BACKGROUND_SYNC = 'BACKGROUND_SYNC',
  CONFLICT_RESOLUTION = 'CONFLICT_RESOLUTION'
}

export enum OperationPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum ConflictStrategy {
  CLIENT_WINS = 'CLIENT_WINS',
  SERVER_WINS = 'SERVER_WINS',
  MERGE = 'MERGE',
  MANUAL = 'MANUAL',
  TIMESTAMP = 'TIMESTAMP'
}

class OfflineService {
  private static instance: OfflineService;
  private config: OfflineConfig;
  private operationQueue: Map<string, OfflineOperation> = new Map();
  private isOnline: boolean = navigator.onLine;
  private syncTimer?: NodeJS.Timeout;
  private retryTimer?: NodeJS.Timeout;
  private stats: OfflineStats;
  private syncInProgress: boolean = false;
  private listeners: Set<(stats: OfflineStats) => void> = new Set();

  private constructor() {
    this.config = {
      enableOfflineMode: true,
      maxOperations: 1000,
      syncInterval: 30000, // 30 segundos
      retryInterval: 5000, // 5 segundos
      maxRetries: 3,
      conflictStrategy: ConflictStrategy.TIMESTAMP,
      enableBackgroundSync: true,
      enableConflictResolution: true,
      prioritizeOperations: true
    };

    this.stats = {
      isOnline: this.isOnline,
      pendingOperations: 0,
      failedOperations: 0,
      lastSyncTime: 0,
      totalSynced: 0,
      totalConflicts: 0,
      averageSyncTime: 0,
      storageUsed: 0
    };

    this.setupEventListeners();
    this.loadPendingOperations();
    this.startSyncTimer();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Configurar listeners de eventos
  private setupEventListeners(): void {
    // Listener para mudanças de conectividade
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });

    // Listener para visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.triggerSync();
      }
    });

    // Service Worker para background sync
    if ('serviceWorker' in navigator && this.config.enableBackgroundSync) {
      this.registerServiceWorker();
    }
  }

  // Registrar Service Worker
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      registration.addEventListener('message', (event) => {
        if (event.data.type === 'BACKGROUND_SYNC') {
          this.handleBackgroundSync();
        }
      });
      
      logger.info('Service Worker registered for background sync', 'OfflineService');
    } catch (error) {
      logger.warn('Failed to register Service Worker', 'OfflineService', { error });
    }
  }

  // Lidar com mudanças de status online/offline
  private handleOnlineStatusChange(isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    this.stats.isOnline = isOnline;

    logger.info(`Network status changed: ${isOnline ? 'online' : 'offline'}`, 'OfflineService');

    if (isOnline && !wasOnline) {
      // Ficou online - iniciar sincronização
      this.triggerSync();
      
      notificationService.createNotification({
        type: 'SYSTEM',
        title: 'Conexão Restaurada',
        message: 'Sincronizando dados pendentes...',
        priority: 'MEDIUM'
      });
    } else if (!isOnline && wasOnline) {
      // Ficou offline
      notificationService.createNotification({
        type: 'SYSTEM',
        title: 'Modo Offline',
        message: 'Trabalhando offline. Dados serão sincronizados quando a conexão for restaurada.',
        priority: 'MEDIUM'
      });
    }

    this.notifyListeners();
  }

  // Adicionar operação à fila
  async addOperation(
    table: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    options: {
      priority?: OperationPriority;
      dependencies?: string[];
      metadata?: Record<string, any>;
      originalData?: any;
    } = {}
  ): Promise<string> {
    if (!this.config.enableOfflineMode) {
      throw new Error('Offline mode is disabled');
    }

    const operationId = crypto.randomUUID();
    
    const operation: OfflineOperation = {
      id: operationId,
      type: OperationType.USER_ACTION,
      table,
      action,
      data,
      originalData: options.originalData,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority: options.priority || OperationPriority.NORMAL,
      dependencies: options.dependencies || [],
      metadata: options.metadata || {}
    };

    // Verificar limite de operações
    if (this.operationQueue.size >= this.config.maxOperations) {
      await this.cleanupOldOperations();
    }

    this.operationQueue.set(operationId, operation);
    this.stats.pendingOperations = this.operationQueue.size;
    
    // Persistir operação
    await this.persistOperation(operation);

    logger.debug('Operation added to queue', 'OfflineService', {
      operationId,
      table,
      action,
      priority: operation.priority
    });

    // Tentar sincronizar imediatamente se online
    if (this.isOnline) {
      this.triggerSync();
    }

    this.notifyListeners();
    return operationId;
  }

  // Executar operação imediatamente (se online) ou adicionar à fila
  async executeOperation(
    table: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    options: {
      priority?: OperationPriority;
      dependencies?: string[];
      metadata?: Record<string, any>;
      originalData?: any;
      forceOffline?: boolean;
    } = {}
  ): Promise<any> {
    if (this.isOnline && !options.forceOffline) {
      try {
        // Tentar executar diretamente
        const result = await this.executeDirectOperation(table, action, data, options.originalData);
        
        logger.debug('Operation executed directly', 'OfflineService', {
          table,
          action,
          success: true
        });
        
        return result;
      } catch (error) {
        logger.warn('Direct operation failed, adding to queue', 'OfflineService', {
          table,
          action,
          error
        });
        
        // Se falhar, adicionar à fila
        await this.addOperation(table, action, data, options);
        throw error;
      }
    } else {
      // Adicionar à fila para sincronização posterior
      await this.addOperation(table, action, data, options);
      
      // Retornar dados locais para operações de leitura
      if (action === 'INSERT') {
        return data;
      }
      
      throw new Error('Operation queued for offline sync');
    }
  }

  // Executar operação diretamente no servidor
  private async executeDirectOperation(
    table: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    originalData?: any
  ): Promise<any> {
    let query;
    
    switch (action) {
      case 'INSERT':
        query = supabase.from(table).insert(data).select();
        break;
      case 'UPDATE':
        query = supabase.from(table).update(data).eq('id', data.id).select();
        break;
      case 'DELETE':
        query = supabase.from(table).delete().eq('id', data.id);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    
    const { data: result, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return result;
  }

  // Iniciar timer de sincronização
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.operationQueue.size > 0) {
        this.triggerSync();
      }
    }, this.config.syncInterval);
  }

  // Disparar sincronização
  private async triggerSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.operationQueue.size === 0) {
      return;
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      await this.syncOperations();
      
      const duration = Date.now() - startTime;
      this.stats.lastSyncTime = Date.now();
      this.stats.averageSyncTime = (this.stats.averageSyncTime + duration) / 2;
      
      logger.info('Sync completed successfully', 'OfflineService', {
        duration,
        operationsSynced: this.stats.totalSynced
      });
      
    } catch (error) {
      logger.error('Sync failed', 'OfflineService', { error });
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  // Sincronizar operações
  private async syncOperations(): Promise<void> {
    const operations = this.getSortedOperations();
    const results: SyncResult[] = [];

    for (const operation of operations) {
      try {
        // Verificar dependências
        if (!this.areDependenciesSatisfied(operation)) {
          continue;
        }

        const result = await this.syncOperation(operation);
        results.push(result);

        if (result.success) {
          this.operationQueue.delete(operation.id);
          await this.removePersistentOperation(operation.id);
          this.stats.totalSynced++;
        } else {
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            this.operationQueue.delete(operation.id);
            await this.removePersistentOperation(operation.id);
            this.stats.failedOperations++;
            
            logger.error('Operation failed after max retries', 'OfflineService', {
              operationId: operation.id,
              error: result.error
            });
          }
        }
      } catch (error) {
        logger.error('Error syncing operation', 'OfflineService', {
          operationId: operation.id,
          error
        });
      }
    }

    this.stats.pendingOperations = this.operationQueue.size;
  }

  // Sincronizar operação individual
  private async syncOperation(operation: OfflineOperation): Promise<SyncResult> {
    try {
      // Verificar se há conflitos
      const conflict = await this.detectConflict(operation);
      
      if (conflict && this.config.enableConflictResolution) {
        const resolution = await this.resolveConflict(operation, conflict);
        
        if (resolution) {
          this.stats.totalConflicts++;
          
          // Executar operação com dados resolvidos
          const result = await this.executeDirectOperation(
            operation.table,
            operation.action,
            resolution.resolvedData,
            operation.originalData
          );
          
          return {
            success: true,
            operationId: operation.id,
            conflictResolution: resolution,
            serverData: result
          };
        }
      }
      
      // Executar operação normalmente
      const result = await this.executeDirectOperation(
        operation.table,
        operation.action,
        operation.data,
        operation.originalData
      );
      
      return {
        success: true,
        operationId: operation.id,
        serverData: result
      };
      
    } catch (error) {
      return {
        success: false,
        operationId: operation.id,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Detectar conflitos
  private async detectConflict(operation: OfflineOperation): Promise<any> {
    if (operation.action === 'INSERT') {
      return null; // INSERTs geralmente não têm conflitos
    }

    try {
      // Buscar dados atuais do servidor
      const { data: serverData, error } = await supabase
        .from(operation.table)
        .select('*')
        .eq('id', operation.data.id)
        .single();
      
      if (error || !serverData) {
        return null;
      }
      
      // Comparar com dados originais
      if (operation.originalData) {
        const hasConflict = this.compareData(operation.originalData, serverData);
        return hasConflict ? serverData : null;
      }
      
      return null;
    } catch (error) {
      logger.warn('Failed to detect conflict', 'OfflineService', {
        operationId: operation.id,
        error
      });
      return null;
    }
  }

  // Comparar dados para detectar conflitos
  private compareData(localData: any, serverData: any): boolean {
    const excludeFields = ['updated_at', 'last_modified'];
    
    for (const key in localData) {
      if (excludeFields.includes(key)) continue;
      
      if (localData[key] !== serverData[key]) {
        return true;
      }
    }
    
    return false;
  }

  // Resolver conflitos
  private async resolveConflict(
    operation: OfflineOperation,
    serverData: any
  ): Promise<ConflictResolution | null> {
    const conflictFields = this.getConflictFields(operation.originalData, serverData);
    
    let resolvedData: any;
    
    switch (this.config.conflictStrategy) {
      case ConflictStrategy.CLIENT_WINS:
        resolvedData = operation.data;
        break;
        
      case ConflictStrategy.SERVER_WINS:
        resolvedData = serverData;
        break;
        
      case ConflictStrategy.TIMESTAMP:
        const clientTime = operation.data.updated_at || operation.timestamp;
        const serverTime = new Date(serverData.updated_at).getTime();
        resolvedData = clientTime > serverTime ? operation.data : serverData;
        break;
        
      case ConflictStrategy.MERGE:
        resolvedData = this.mergeData(operation.data, serverData);
        break;
        
      case ConflictStrategy.MANUAL:
        // Para resolução manual, notificar usuário
        await this.notifyConflict(operation, serverData, conflictFields);
        return null;
        
      default:
        resolvedData = operation.data;
    }
    
    return {
      strategy: this.config.conflictStrategy,
      resolvedData,
      conflictDetails: {
        localData: operation.data,
        serverData,
        conflictFields
      }
    };
  }

  // Obter campos em conflito
  private getConflictFields(localData: any, serverData: any): string[] {
    const conflicts: string[] = [];
    const excludeFields = ['updated_at', 'last_modified'];
    
    for (const key in localData) {
      if (excludeFields.includes(key)) continue;
      
      if (localData[key] !== serverData[key]) {
        conflicts.push(key);
      }
    }
    
    return conflicts;
  }

  // Mesclar dados
  private mergeData(localData: any, serverData: any): any {
    const merged = { ...serverData };
    
    // Estratégia simples: manter campos não-nulos do cliente
    for (const key in localData) {
      if (localData[key] !== null && localData[key] !== undefined) {
        merged[key] = localData[key];
      }
    }
    
    return merged;
  }

  // Notificar conflito para resolução manual
  private async notifyConflict(
    operation: OfflineOperation,
    serverData: any,
    conflictFields: string[]
  ): Promise<void> {
    await notificationService.createNotification({
      type: 'SYSTEM',
      title: 'Conflito de Dados Detectado',
      message: `Conflito na tabela ${operation.table} nos campos: ${conflictFields.join(', ')}`,
      priority: 'HIGH',
      metadata: {
        operationId: operation.id,
        conflictFields,
        localData: operation.data,
        serverData
      }
    });
  }

  // Obter operações ordenadas por prioridade e dependências
  private getSortedOperations(): OfflineOperation[] {
    const operations = Array.from(this.operationQueue.values());
    
    if (!this.config.prioritizeOperations) {
      return operations.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // Ordenar por prioridade e depois por timestamp
    return operations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Prioridade maior primeiro
      }
      return a.timestamp - b.timestamp; // Mais antigo primeiro
    });
  }

  // Verificar se dependências estão satisfeitas
  private areDependenciesSatisfied(operation: OfflineOperation): boolean {
    return operation.dependencies.every(depId => !this.operationQueue.has(depId));
  }

  // Lidar com sincronização em background
  private async handleBackgroundSync(): Promise<void> {
    if (this.isOnline && this.operationQueue.size > 0) {
      await this.triggerSync();
    }
  }

  // Persistir operação no localStorage
  private async persistOperation(operation: OfflineOperation): Promise<void> {
    try {
      const key = `offline_op_${operation.id}`;
      localStorage.setItem(key, JSON.stringify(operation));
    } catch (error) {
      logger.error('Failed to persist operation', 'OfflineService', {
        operationId: operation.id,
        error
      });
    }
  }

  // Remover operação persistente
  private async removePersistentOperation(operationId: string): Promise<void> {
    try {
      localStorage.removeItem(`offline_op_${operationId}`);
    } catch (error) {
      logger.warn('Failed to remove persistent operation', 'OfflineService', {
        operationId,
        error
      });
    }
  }

  // Carregar operações pendentes do localStorage
  private async loadPendingOperations(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('offline_op_'));
      let loadedCount = 0;
      
      for (const key of keys) {
        try {
          const data = localStorage.getItem(key);
          if (!data) continue;
          
          const operation: OfflineOperation = JSON.parse(data);
          
          // Verificar se a operação não expirou (ex: 7 dias)
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
          if (Date.now() - operation.timestamp > maxAge) {
            localStorage.removeItem(key);
            continue;
          }
          
          this.operationQueue.set(operation.id, operation);
          loadedCount++;
          
        } catch (error) {
          logger.warn('Failed to load operation from storage', 'OfflineService', { key, error });
          localStorage.removeItem(key);
        }
      }
      
      this.stats.pendingOperations = this.operationQueue.size;
      
      if (loadedCount > 0) {
        logger.info('Loaded pending operations from storage', 'OfflineService', { loadedCount });
      }
      
    } catch (error) {
      logger.error('Failed to load pending operations', 'OfflineService', { error });
    }
  }

  // Limpar operações antigas
  private async cleanupOldOperations(): Promise<void> {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [id, operation] of this.operationQueue.entries()) {
      if (now - operation.timestamp > maxAge) {
        this.operationQueue.delete(id);
        await this.removePersistentOperation(id);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info('Cleaned up old operations', 'OfflineService', { cleanedCount });
    }
  }

  // Adicionar listener de mudanças
  addListener(listener: (stats: OfflineStats) => void): void {
    this.listeners.add(listener);
  }

  // Remover listener
  removeListener(listener: (stats: OfflineStats) => void): void {
    this.listeners.delete(listener);
  }

  // Notificar listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getStats());
      } catch (error) {
        logger.error('Error in offline service listener', 'OfflineService', { error });
      }
    });
  }

  // Obter estatísticas
  getStats(): OfflineStats {
    this.stats.storageUsed = this.calculateStorageUsed();
    return { ...this.stats };
  }

  // Calcular uso de armazenamento
  private calculateStorageUsed(): number {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('offline_op_'));
      let totalSize = 0;
      
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  // Obter operações pendentes
  getPendingOperations(): OfflineOperation[] {
    return Array.from(this.operationQueue.values());
  }

  // Cancelar operação
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.operationQueue.get(operationId);
    if (!operation) {
      return false;
    }
    
    this.operationQueue.delete(operationId);
    await this.removePersistentOperation(operationId);
    
    this.stats.pendingOperations = this.operationQueue.size;
    this.notifyListeners();
    
    logger.info('Operation cancelled', 'OfflineService', { operationId });
    return true;
  }

  // Forçar sincronização
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.triggerSync();
  }

  // Limpar todas as operações
  async clearAllOperations(): Promise<void> {
    const operationIds = Array.from(this.operationQueue.keys());
    
    this.operationQueue.clear();
    
    // Remover do localStorage
    for (const id of operationIds) {
      await this.removePersistentOperation(id);
    }
    
    this.stats.pendingOperations = 0;
    this.notifyListeners();
    
    logger.info('All operations cleared', 'OfflineService', { clearedCount: operationIds.length });
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar timer se necessário
    if (newConfig.syncInterval !== undefined) {
      this.startSyncTimer();
    }
    
    logger.info('Offline service config updated', 'OfflineService', { newConfig });
  }

  // Obter configuração
  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Verificar se está online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Destruir serviço
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }
    
    this.listeners.clear();
    
    logger.info('Offline service destroyed', 'OfflineService');
  }
}

// Instância singleton
export const offlineService = OfflineService.getInstance();

// Hook para usar o serviço offline em componentes React
export function useOfflineService() {
  return offlineService;
}

// Decorator para operações offline automáticas
export function withOfflineSupport(
  table: string,
  options: {
    priority?: OperationPriority;
    enableConflictResolution?: boolean;
  } = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      try {
        // Tentar executar normalmente
        return await method.apply(this, args);
      } catch (error) {
        // Se falhar e estivermos offline, adicionar à fila
        if (!offlineService.isOnlineStatus()) {
          const [action, data] = args;
          await offlineService.addOperation(table, action, data, {
            priority: options.priority,
            metadata: { method: propertyName, timestamp: Date.now() }
          });
        }
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default offlineService;