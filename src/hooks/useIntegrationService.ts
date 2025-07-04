// Hook para usar o serviço de integrações
// Criado em: 2025-01-18
// Descrição: Hook React para gerenciar integrações com APIs externas

import { useState, useEffect, useCallback } from 'react';
import { integrationService } from '../services/integrationService';
import {
  Integration,
  IntegrationType,
  SyncOptions,
  SyncResult,
  IntegrationStats,
  UseIntegrationServiceReturn
} from '../types/integration';
import { useAuth } from './useAuth';
import { logger } from '../services/logger';

export const useIntegrationService = (): UseIntegrationServiceReturn => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar integrações
  const loadIntegrations = useCallback(async () => {
    if (!user?.schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getIntegrationsBySchool(user.schoolId);
      setIntegrations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar integrações';
      setError(errorMessage);
      logger.error('Erro ao carregar integrações', { error: err, userId: user?.id });
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, user?.id]);

  // Criar integração
  const createIntegration = useCallback(async (
    integrationData: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Integration> => {
    if (!user?.schoolId) {
      throw new Error('Usuário não possui escola associada');
    }

    try {
      const newIntegration = await integrationService.createIntegration({
        ...integrationData,
        schoolId: user.schoolId,
        createdBy: user.id
      });
      
      setIntegrations(prev => [...prev, newIntegration]);
      logger.info('Integração criada', { integrationId: newIntegration.id, userId: user.id });
      
      return newIntegration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar integração';
      setError(errorMessage);
      logger.error('Erro ao criar integração', { error: err, userId: user.id });
      throw err;
    }
  }, [user?.schoolId, user?.id]);

  // Atualizar integração
  const updateIntegration = useCallback(async (
    id: string,
    updates: Partial<Integration>
  ): Promise<Integration> => {
    try {
      const updatedIntegration = await integrationService.updateIntegration(id, updates);
      
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? updatedIntegration : integration
        )
      );
      
      logger.info('Integração atualizada', { integrationId: id, userId: user?.id });
      
      return updatedIntegration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar integração';
      setError(errorMessage);
      logger.error('Erro ao atualizar integração', { error: err, integrationId: id, userId: user?.id });
      throw err;
    }
  }, [user?.id]);

  // Deletar integração
  const deleteIntegration = useCallback(async (id: string): Promise<void> => {
    try {
      await integrationService.deleteIntegration(id);
      
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
      logger.info('Integração deletada', { integrationId: id, userId: user?.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar integração';
      setError(errorMessage);
      logger.error('Erro ao deletar integração', { error: err, integrationId: id, userId: user?.id });
      throw err;
    }
  }, [user?.id]);

  // Testar conexão
  const testConnection = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await integrationService.testConnection(id);
      logger.info('Teste de conexão realizado', { integrationId: id, success: result, userId: user?.id });
      return result;
    } catch (err) {
      logger.error('Erro no teste de conexão', { error: err, integrationId: id, userId: user?.id });
      throw err;
    }
  }, [user?.id]);

  // Sincronizar integração
  const syncIntegration = useCallback(async (
    id: string,
    options?: SyncOptions
  ): Promise<SyncResult> => {
    try {
      // Atualizar status para sincronizando
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { ...integration, syncStatus: 'SYNCING' as any }
            : integration
        )
      );

      const result = await integrationService.syncIntegration(id, options);
      
      // Atualizar status baseado no resultado
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { 
                ...integration, 
                syncStatus: result.success ? 'SUCCESS' as any : 'ERROR' as any,
                lastSync: new Date(),
                lastError: result.success ? undefined : result.errors[0]?.message
              }
            : integration
        )
      );
      
      logger.info('Sincronização realizada', { 
        integrationId: id, 
        success: result.success, 
        recordsProcessed: result.recordsProcessed,
        userId: user?.id 
      });
      
      return result;
    } catch (err) {
      // Atualizar status para erro
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { 
                ...integration, 
                syncStatus: 'ERROR' as any,
                lastError: err instanceof Error ? err.message : 'Erro na sincronização'
              }
            : integration
        )
      );
      
      logger.error('Erro na sincronização', { error: err, integrationId: id, userId: user?.id });
      throw err;
    }
  }, [user?.id]);

  // Pausar integração
  const pauseIntegration = useCallback(async (id: string): Promise<void> => {
    try {
      await integrationService.pauseIntegration(id);
      
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { ...integration, isActive: false, syncStatus: 'PAUSED' as any }
            : integration
        )
      );
      
      logger.info('Integração pausada', { integrationId: id, userId: user?.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao pausar integração';
      setError(errorMessage);
      logger.error('Erro ao pausar integração', { error: err, integrationId: id, userId: user?.id });
      throw err;
    }
  }, [user?.id]);

  // Retomar integração
  const resumeIntegration = useCallback(async (id: string): Promise<void> => {
    try {
      await integrationService.resumeIntegration(id);
      
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { ...integration, isActive: true, syncStatus: 'IDLE' as any }
            : integration
        )
      );
      
      logger.info('Integração retomada', { integrationId: id, userId: user?.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao retomar integração';
      setError(errorMessage);
      logger.error('Erro ao retomar integração', { error: err, integrationId: id, userId: user?.id });
      throw err;
    }
  }, [user?.id]);

  // Obter estatísticas
  const getStats = useCallback(async (schoolId?: string): Promise<IntegrationStats> => {
    try {
      const targetSchoolId = schoolId || user?.schoolId;
      if (!targetSchoolId) {
        throw new Error('ID da escola não fornecido');
      }
      
      const stats = await integrationService.getStats(targetSchoolId);
      logger.info('Estatísticas obtidas', { schoolId: targetSchoolId, userId: user?.id });
      
      return stats;
    } catch (err) {
      logger.error('Erro ao obter estatísticas', { error: err, userId: user?.id });
      throw err;
    }
  }, [user?.schoolId, user?.id]);

  // Atualizar dados
  const refresh = useCallback(async (): Promise<void> => {
    await loadIntegrations();
  }, [loadIntegrations]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.schoolId) {
      loadIntegrations();
    }
  }, [loadIntegrations, user?.schoolId]);

  // Limpar erro após um tempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    integrations,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    syncIntegration,
    pauseIntegration,
    resumeIntegration,
    getStats,
    refresh
  };
};

// Hook para integração específica
export const useIntegration = (integrationId: string) => {
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntegration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getIntegration(integrationId);
      setIntegration(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar integração';
      setError(errorMessage);
      logger.error('Erro ao carregar integração', { error: err, integrationId });
    } finally {
      setLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    if (integrationId) {
      loadIntegration();
    }
  }, [loadIntegration, integrationId]);

  return {
    integration,
    loading,
    error,
    refresh: loadIntegration
  };
};

// Hook para templates de integração
export const useIntegrationTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getTemplates();
      setTemplates(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar templates';
      setError(errorMessage);
      logger.error('Erro ao carregar templates', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    refresh: loadTemplates
  };
};

// Hook para provedores disponíveis
export const useIntegrationProviders = (type?: IntegrationType) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getProviders(type);
      setProviders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar provedores';
      setError(errorMessage);
      logger.error('Erro ao carregar provedores', { error: err, type });
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    providers,
    loading,
    error,
    refresh: loadProviders
  };
};

// Hook para monitorar sincronizações em tempo real
export const useSyncMonitor = () => {
  const [activeSyncs, setActiveSyncs] = useState<Map<string, SyncResult>>(new Map());
  const [recentSyncs, setRecentSyncs] = useState<SyncResult[]>([]);

  const addActiveSync = useCallback((integrationId: string, result: SyncResult) => {
    setActiveSyncs(prev => new Map(prev).set(integrationId, result));
  }, []);

  const removeActiveSync = useCallback((integrationId: string) => {
    setActiveSyncs(prev => {
      const newMap = new Map(prev);
      const result = newMap.get(integrationId);
      newMap.delete(integrationId);
      
      if (result) {
        setRecentSyncs(prevRecent => [result, ...prevRecent.slice(0, 9)]); // Manter últimas 10
      }
      
      return newMap;
    });
  }, []);

  const clearRecentSyncs = useCallback(() => {
    setRecentSyncs([]);
  }, []);

  return {
    activeSyncs: Array.from(activeSyncs.entries()),
    recentSyncs,
    addActiveSync,
    removeActiveSync,
    clearRecentSyncs
  };
};

export default useIntegrationService;