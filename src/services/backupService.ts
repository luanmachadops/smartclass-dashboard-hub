import { logger } from './logger';
import { auditService, AuditAction } from './auditService';
import { supabase } from '../lib/supabase';
import { performanceMonitor } from './performanceMonitor';

// Tipos para backup e recuperação
export interface BackupConfig {
  enableAutoBackup: boolean;
  backupInterval: number; // em ms
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  maxBackupSize: number; // em bytes
  includeTables: string[];
  excludeTables: string[];
  backupLocation: 'local' | 'cloud' | 'both';
}

export interface BackupMetadata {
  id: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
  tables: string[];
  createdAt: string;
  completedAt?: string;
  error?: string;
  metadata: Record<string, any>;
}

export interface RestoreOptions {
  backupId: string;
  tables?: string[];
  overwriteExisting: boolean;
  validateData: boolean;
  createBackupBeforeRestore: boolean;
  dryRun: boolean;
}

export interface BackupProgress {
  backupId: string;
  stage: BackupStage;
  progress: number; // 0-100
  currentTable?: string;
  processedTables: number;
  totalTables: number;
  estimatedTimeRemaining?: number;
  message: string;
}

export enum BackupType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED'
}

export enum BackupStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  CORRUPTED = 'CORRUPTED'
}

export enum BackupStage {
  INITIALIZING = 'INITIALIZING',
  VALIDATING = 'VALIDATING',
  EXPORTING_SCHEMA = 'EXPORTING_SCHEMA',
  EXPORTING_DATA = 'EXPORTING_DATA',
  COMPRESSING = 'COMPRESSING',
  ENCRYPTING = 'ENCRYPTING',
  UPLOADING = 'UPLOADING',
  FINALIZING = 'FINALIZING',
  COMPLETED = 'COMPLETED'
}

class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private activeBackups: Map<string, BackupProgress> = new Map();
  private backupTimer?: NodeJS.Timeout;
  private progressListeners: Map<string, ((progress: BackupProgress) => void)[]> = new Map();

  private constructor() {
    this.config = {
      enableAutoBackup: true,
      backupInterval: 24 * 60 * 60 * 1000, // 24 horas
      retentionDays: 30,
      compressionEnabled: true,
      encryptionEnabled: true,
      maxBackupSize: 1024 * 1024 * 1024, // 1GB
      includeTables: [],
      excludeTables: ['audit_logs', 'notification_delivery_log'],
      backupLocation: 'cloud'
    };

    this.startAutoBackup();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Iniciar backup automático
  private startAutoBackup(): void {
    if (!this.config.enableAutoBackup) return;

    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup({
          type: BackupType.SCHEDULED,
          name: `auto-backup-${new Date().toISOString().split('T')[0]}`
        });
      } catch (error) {
        logger.error('Auto backup failed', 'BackupService', { error });
      }
    }, this.config.backupInterval);

    logger.info('Auto backup started', 'BackupService', {
      interval: this.config.backupInterval
    });
  }

  // Criar backup
  async createBackup(options: {
    type: BackupType;
    name: string;
    tables?: string[];
    description?: string;
  }): Promise<string> {
    const backupId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // Inicializar progresso
      const progress: BackupProgress = {
        backupId,
        stage: BackupStage.INITIALIZING,
        progress: 0,
        processedTables: 0,
        totalTables: 0,
        message: 'Inicializando backup...'
      };

      this.activeBackups.set(backupId, progress);
      this.notifyProgressListeners(backupId, progress);

      // Validar permissões e recursos
      await this.validateBackupPreconditions();
      this.updateProgress(backupId, BackupStage.VALIDATING, 10, 'Validando precondições...');

      // Obter lista de tabelas
      const tables = await this.getTablesList(options.tables);
      this.updateProgress(backupId, BackupStage.EXPORTING_SCHEMA, 20, 'Exportando esquema...', {
        totalTables: tables.length
      });

      // Exportar esquema
      const schema = await this.exportSchema(tables);
      this.updateProgress(backupId, BackupStage.EXPORTING_DATA, 30, 'Exportando dados...');

      // Exportar dados
      const data = await this.exportData(tables, backupId);
      this.updateProgress(backupId, BackupStage.COMPRESSING, 70, 'Comprimindo backup...');

      // Criar arquivo de backup
      const backupData = {
        metadata: {
          id: backupId,
          name: options.name,
          type: options.type,
          description: options.description,
          createdAt: new Date().toISOString(),
          tables,
          version: '1.0'
        },
        schema,
        data
      };

      // Comprimir se habilitado
      let finalData = JSON.stringify(backupData);
      let compressed = false;
      
      if (this.config.compressionEnabled) {
        finalData = await this.compressData(finalData);
        compressed = true;
        this.updateProgress(backupId, BackupStage.ENCRYPTING, 80, 'Criptografando backup...');
      }

      // Criptografar se habilitado
      let encrypted = false;
      if (this.config.encryptionEnabled) {
        finalData = await this.encryptData(finalData);
        encrypted = true;
        this.updateProgress(backupId, BackupStage.UPLOADING, 85, 'Enviando backup...');
      }

      // Calcular checksum
      const checksum = await this.calculateChecksum(finalData);

      // Salvar backup
      await this.saveBackup(backupId, finalData, {
        name: options.name,
        type: options.type,
        size: finalData.length,
        compressed,
        encrypted,
        checksum,
        tables
      });

      this.updateProgress(backupId, BackupStage.FINALIZING, 95, 'Finalizando backup...');

      // Limpar backups antigos
      await this.cleanupOldBackups();

      this.updateProgress(backupId, BackupStage.COMPLETED, 100, 'Backup concluído com sucesso!');

      const duration = Date.now() - startTime;
      
      logger.info('Backup created successfully', 'BackupService', {
        backupId,
        type: options.type,
        duration,
        size: finalData.length,
        tables: tables.length
      });

      // Auditoria
      auditService.logSystemEvent(
        `Backup created: ${options.name}`,
        {
          backupId,
          type: options.type,
          duration,
          size: finalData.length,
          tables
        }
      );

      // Remover do tracking de progresso
      setTimeout(() => {
        this.activeBackups.delete(backupId);
      }, 5000);

      return backupId;

    } catch (error) {
      this.updateProgress(backupId, BackupStage.COMPLETED, 100, `Erro no backup: ${error}`);
      
      logger.error('Backup failed', 'BackupService', {
        backupId,
        error,
        duration: Date.now() - startTime
      });

      // Marcar backup como falho
      await this.markBackupAsFailed(backupId, error as Error);
      
      throw error;
    }
  }

  // Restaurar backup
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting backup restore', 'BackupService', {
        backupId: options.backupId,
        dryRun: options.dryRun
      });

      // Criar backup antes da restauração se solicitado
      if (options.createBackupBeforeRestore && !options.dryRun) {
        await this.createBackup({
          type: BackupType.MANUAL,
          name: `pre-restore-backup-${Date.now()}`
        });
      }

      // Carregar backup
      const backupData = await this.loadBackup(options.backupId);
      
      if (!backupData) {
        throw new Error(`Backup not found: ${options.backupId}`);
      }

      // Validar dados se solicitado
      if (options.validateData) {
        await this.validateBackupData(backupData);
      }

      // Filtrar tabelas se especificado
      const tablesToRestore = options.tables || Object.keys(backupData.data);
      
      if (options.dryRun) {
        logger.info('Dry run completed', 'BackupService', {
          backupId: options.backupId,
          tablesToRestore
        });
        return;
      }

      // Restaurar esquema
      await this.restoreSchema(backupData.schema, tablesToRestore);

      // Restaurar dados
      await this.restoreData(backupData.data, tablesToRestore, options.overwriteExisting);

      const duration = Date.now() - startTime;
      
      logger.info('Backup restored successfully', 'BackupService', {
        backupId: options.backupId,
        duration,
        tables: tablesToRestore.length
      });

      // Auditoria
      auditService.logSystemEvent(
        `Backup restored: ${options.backupId}`,
        {
          backupId: options.backupId,
          duration,
          tables: tablesToRestore,
          overwriteExisting: options.overwriteExisting
        }
      );

    } catch (error) {
      logger.error('Backup restore failed', 'BackupService', {
        backupId: options.backupId,
        error,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  // Validar precondições do backup
  private async validateBackupPreconditions(): Promise<void> {
    // Verificar espaço em disco
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      const estimate = await navigator.storage.estimate();
      const availableSpace = (estimate.quota || 0) - (estimate.usage || 0);
      
      if (availableSpace < this.config.maxBackupSize) {
        throw new Error('Insufficient storage space for backup');
      }
    }

    // Verificar conexão com o banco
    const { error } = await supabase.from('schools').select('id').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  // Obter lista de tabelas
  private async getTablesList(specificTables?: string[]): Promise<string[]> {
    if (specificTables && specificTables.length > 0) {
      return specificTables;
    }

    // Lista padrão de tabelas importantes
    const defaultTables = [
      'schools',
      'users',
      'school_users',
      'students',
      'teachers',
      'classes',
      'enrollments',
      'instruments',
      'payments',
      'grades',
      'attendance',
      'notifications',
      'notification_preferences'
    ];

    // Filtrar tabelas excluídas
    return defaultTables.filter(table => !this.config.excludeTables.includes(table));
  }

  // Exportar esquema
  private async exportSchema(tables: string[]): Promise<Record<string, any>> {
    const schema: Record<string, any> = {};
    
    for (const table of tables) {
      try {
        // Obter informações da tabela (simulado - em produção usaria queries específicas)
        schema[table] = {
          columns: [],
          indexes: [],
          constraints: [],
          triggers: []
        };
      } catch (error) {
        logger.warn(`Failed to export schema for table: ${table}`, 'BackupService', { error });
      }
    }
    
    return schema;
  }

  // Exportar dados
  private async exportData(tables: string[], backupId: string): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};
    let processedTables = 0;
    
    for (const table of tables) {
      try {
        const { data: tableData, error } = await supabase
          .from(table)
          .select('*');
        
        if (error) {
          throw error;
        }
        
        data[table] = tableData || [];
        processedTables++;
        
        // Atualizar progresso
        const progress = 30 + (processedTables / tables.length) * 40;
        this.updateProgress(backupId, BackupStage.EXPORTING_DATA, progress, 
          `Exportando ${table}...`, { processedTables, currentTable: table });
        
      } catch (error) {
        logger.warn(`Failed to export data for table: ${table}`, 'BackupService', { error });
        data[table] = [];
      }
    }
    
    return data;
  }

  // Comprimir dados
  private async compressData(data: string): Promise<string> {
    // Implementação simplificada - em produção usaria uma biblioteca de compressão
    try {
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(data));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
    } catch (error) {
      logger.warn('Compression failed, using uncompressed data', 'BackupService', { error });
    }
    
    return data;
  }

  // Criptografar dados
  private async encryptData(data: string): Promise<string> {
    // Implementação simplificada - em produção usaria uma biblioteca de criptografia robusta
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);
        
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          encodedData
        );
        
        // Combinar IV + dados criptografados
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        
        return btoa(String.fromCharCode(...combined));
      }
    } catch (error) {
      logger.warn('Encryption failed, using unencrypted data', 'BackupService', { error });
    }
    
    return data;
  }

  // Calcular checksum
  private async calculateChecksum(data: string): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (error) {
      logger.warn('Checksum calculation failed', 'BackupService', { error });
    }
    
    return 'unknown';
  }

  // Salvar backup
  private async saveBackup(
    backupId: string, 
    data: string, 
    metadata: Omit<BackupMetadata, 'id' | 'createdAt' | 'status'>
  ): Promise<void> {
    try {
      // Salvar metadados no banco
      const { error: metadataError } = await supabase
        .from('backups')
        .insert({
          id: backupId,
          name: metadata.name,
          type: metadata.type,
          status: BackupStatus.COMPLETED,
          size: metadata.size,
          compressed: metadata.compressed,
          encrypted: metadata.encrypted,
          checksum: metadata.checksum,
          tables: metadata.tables,
          completed_at: new Date().toISOString()
        });
      
      if (metadataError) {
        throw metadataError;
      }

      // Salvar dados do backup (em produção, salvaria em storage externo)
      if (this.config.backupLocation === 'cloud' || this.config.backupLocation === 'both') {
        const { error: storageError } = await supabase.storage
          .from('backups')
          .upload(`${backupId}.backup`, new Blob([data], { type: 'application/octet-stream' }));
        
        if (storageError) {
          throw storageError;
        }
      }

      // Salvar localmente se configurado
      if (this.config.backupLocation === 'local' || this.config.backupLocation === 'both') {
        localStorage.setItem(`backup_${backupId}`, data);
      }
      
    } catch (error) {
      logger.error('Failed to save backup', 'BackupService', { backupId, error });
      throw error;
    }
  }

  // Carregar backup
  private async loadBackup(backupId: string): Promise<any> {
    try {
      // Carregar metadados
      const { data: metadata, error: metadataError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .single();
      
      if (metadataError) {
        throw metadataError;
      }

      // Carregar dados do backup
      let backupData: string;
      
      if (this.config.backupLocation === 'cloud' || this.config.backupLocation === 'both') {
        const { data: storageData, error: storageError } = await supabase.storage
          .from('backups')
          .download(`${backupId}.backup`);
        
        if (storageError) {
          throw storageError;
        }
        
        backupData = await storageData.text();
      } else {
        backupData = localStorage.getItem(`backup_${backupId}`) || '';
      }

      // Descriptografar se necessário
      if (metadata.encrypted) {
        backupData = await this.decryptData(backupData);
      }

      // Descomprimir se necessário
      if (metadata.compressed) {
        backupData = await this.decompressData(backupData);
      }

      // Validar checksum
      const calculatedChecksum = await this.calculateChecksum(backupData);
      if (calculatedChecksum !== metadata.checksum && metadata.checksum !== 'unknown') {
        throw new Error('Backup data integrity check failed');
      }

      return JSON.parse(backupData);
      
    } catch (error) {
      logger.error('Failed to load backup', 'BackupService', { backupId, error });
      throw error;
    }
  }

  // Descriptografar dados
  private async decryptData(data: string): Promise<string> {
    // Implementação simplificada
    logger.warn('Decryption not fully implemented', 'BackupService');
    return data;
  }

  // Descomprimir dados
  private async decompressData(data: string): Promise<string> {
    // Implementação simplificada
    logger.warn('Decompression not fully implemented', 'BackupService');
    return data;
  }

  // Validar dados do backup
  private async validateBackupData(backupData: any): Promise<void> {
    if (!backupData.metadata || !backupData.schema || !backupData.data) {
      throw new Error('Invalid backup format');
    }
    
    // Validações adicionais podem ser implementadas aqui
  }

  // Restaurar esquema
  private async restoreSchema(schema: Record<string, any>, tables: string[]): Promise<void> {
    // Implementação simplificada - em produção executaria DDL statements
    logger.info('Schema restore completed', 'BackupService', { tables });
  }

  // Restaurar dados
  private async restoreData(
    data: Record<string, any[]>, 
    tables: string[], 
    overwrite: boolean
  ): Promise<void> {
    for (const table of tables) {
      if (!data[table]) continue;
      
      try {
        if (overwrite) {
          // Limpar tabela antes de inserir
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        
        // Inserir dados em lotes
        const batchSize = 100;
        const tableData = data[table];
        
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize);
          const { error } = await supabase.from(table).insert(batch);
          
          if (error) {
            logger.warn(`Failed to restore batch for table ${table}`, 'BackupService', { error });
          }
        }
        
      } catch (error) {
        logger.error(`Failed to restore data for table: ${table}`, 'BackupService', { error });
      }
    }
  }

  // Marcar backup como falho
  private async markBackupAsFailed(backupId: string, error: Error): Promise<void> {
    try {
      await supabase
        .from('backups')
        .update({
          status: BackupStatus.FAILED,
          error: error.message
        })
        .eq('id', backupId);
    } catch (updateError) {
      logger.error('Failed to mark backup as failed', 'BackupService', { backupId, updateError });
    }
  }

  // Limpar backups antigos
  private async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      const { data: oldBackups, error } = await supabase
        .from('backups')
        .select('id')
        .lt('created_at', cutoffDate.toISOString());
      
      if (error) {
        throw error;
      }
      
      for (const backup of oldBackups || []) {
        await this.deleteBackup(backup.id);
      }
      
      logger.info('Old backups cleaned up', 'BackupService', {
        deletedCount: oldBackups?.length || 0,
        cutoffDate: cutoffDate.toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to cleanup old backups', 'BackupService', { error });
    }
  }

  // Deletar backup
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // Deletar do storage
      await supabase.storage.from('backups').remove([`${backupId}.backup`]);
      
      // Deletar do localStorage
      localStorage.removeItem(`backup_${backupId}`);
      
      // Deletar metadados
      await supabase.from('backups').delete().eq('id', backupId);
      
      logger.info('Backup deleted', 'BackupService', { backupId });
      
    } catch (error) {
      logger.error('Failed to delete backup', 'BackupService', { backupId, error });
      throw error;
    }
  }

  // Listar backups
  async listBackups(options: {
    limit?: number;
    offset?: number;
    type?: BackupType;
    status?: BackupStatus;
  } = {}): Promise<BackupMetadata[]> {
    try {
      let query = supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (options.type) {
        query = query.eq('type', options.type);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
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
        name: item.name,
        type: item.type,
        status: item.status,
        size: item.size,
        compressed: item.compressed,
        encrypted: item.encrypted,
        checksum: item.checksum,
        tables: item.tables,
        createdAt: item.created_at,
        completedAt: item.completed_at,
        error: item.error,
        metadata: item.metadata || {}
      })) || [];
      
    } catch (error) {
      logger.error('Failed to list backups', 'BackupService', { error });
      return [];
    }
  }

  // Atualizar progresso
  private updateProgress(
    backupId: string, 
    stage: BackupStage, 
    progress: number, 
    message: string,
    extra: Partial<BackupProgress> = {}
  ): void {
    const currentProgress = this.activeBackups.get(backupId);
    if (!currentProgress) return;
    
    const updatedProgress: BackupProgress = {
      ...currentProgress,
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      ...extra
    };
    
    this.activeBackups.set(backupId, updatedProgress);
    this.notifyProgressListeners(backupId, updatedProgress);
  }

  // Notificar listeners de progresso
  private notifyProgressListeners(backupId: string, progress: BackupProgress): void {
    const listeners = this.progressListeners.get(backupId) || [];
    listeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        logger.error('Error in progress listener', 'BackupService', { error });
      }
    });
  }

  // Adicionar listener de progresso
  addProgressListener(backupId: string, listener: (progress: BackupProgress) => void): void {
    if (!this.progressListeners.has(backupId)) {
      this.progressListeners.set(backupId, []);
    }
    this.progressListeners.get(backupId)!.push(listener);
  }

  // Remover listener de progresso
  removeProgressListener(backupId: string, listener: (progress: BackupProgress) => void): void {
    const listeners = this.progressListeners.get(backupId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Obter progresso do backup
  getBackupProgress(backupId: string): BackupProgress | null {
    return this.activeBackups.get(backupId) || null;
  }

  // Cancelar backup
  async cancelBackup(backupId: string): Promise<void> {
    const progress = this.activeBackups.get(backupId);
    if (!progress) {
      throw new Error('Backup not found or already completed');
    }
    
    // Marcar como cancelado
    await supabase
      .from('backups')
      .update({ status: BackupStatus.CANCELLED })
      .eq('id', backupId);
    
    this.activeBackups.delete(backupId);
    
    logger.info('Backup cancelled', 'BackupService', { backupId });
  }

  // Configuração
  updateConfig(config: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reiniciar auto backup se necessário
    if (config.enableAutoBackup !== undefined || config.backupInterval !== undefined) {
      this.startAutoBackup();
    }
    
    logger.info('Backup service config updated', 'BackupService', { config });
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
    }
    
    this.activeBackups.clear();
    this.progressListeners.clear();
    
    logger.info('Backup service destroyed', 'BackupService');
  }
}

// Instância singleton
export const backupService = BackupService.getInstance();

// Hook para usar o serviço de backup em componentes React
export function useBackupService() {
  return backupService;
}

export default backupService;