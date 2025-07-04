-- Migração para sistema de backup e recuperação
-- Criada em: 2025-01-18
-- Descrição: Tabelas e funções para gerenciamento de backups

-- Enum para tipos de backup
CREATE TYPE backup_type AS ENUM (
  'FULL',
  'INCREMENTAL', 
  'DIFFERENTIAL',
  'MANUAL',
  'SCHEDULED'
);

-- Enum para status do backup
CREATE TYPE backup_status AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'CORRUPTED'
);

-- Tabela principal de backups
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type backup_type NOT NULL DEFAULT 'MANUAL',
  status backup_status NOT NULL DEFAULT 'PENDING',
  size BIGINT DEFAULT 0,
  compressed BOOLEAN DEFAULT false,
  encrypted BOOLEAN DEFAULT false,
  checksum VARCHAR(64),
  tables TEXT[] DEFAULT '{}',
  file_path TEXT,
  storage_location VARCHAR(50) DEFAULT 'cloud',
  retention_days INTEGER DEFAULT 30,
  error_message TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  metadata JSONB DEFAULT '{}'
);

-- Tabela de configurações de backup
CREATE TABLE backup_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) UNIQUE,
  enable_auto_backup BOOLEAN DEFAULT true,
  backup_interval INTEGER DEFAULT 86400000, -- 24 horas em ms
  retention_days INTEGER DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  max_backup_size BIGINT DEFAULT 1073741824, -- 1GB
  include_tables TEXT[] DEFAULT '{}',
  exclude_tables TEXT[] DEFAULT '{"audit_logs", "notification_delivery_log"}',
  backup_location VARCHAR(50) DEFAULT 'cloud',
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de restauração
CREATE TABLE restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID REFERENCES backups(id) ON DELETE CASCADE,
  status backup_status NOT NULL DEFAULT 'PENDING',
  tables_restored TEXT[] DEFAULT '{}',
  overwrite_existing BOOLEAN DEFAULT false,
  validate_data BOOLEAN DEFAULT true,
  dry_run BOOLEAN DEFAULT false,
  pre_restore_backup_id UUID REFERENCES backups(id),
  error_message TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES schools(id),
  metadata JSONB DEFAULT '{}'
);

-- Índices para otimização
CREATE INDEX idx_backups_school_id ON backups(school_id);
CREATE INDEX idx_backups_status ON backups(status);
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX idx_backups_completed_at ON backups(completed_at DESC);
CREATE INDEX idx_backups_size ON backups(size);
CREATE INDEX idx_backups_retention ON backups(created_at, retention_days);

CREATE INDEX idx_backup_configs_school_id ON backup_configs(school_id);
CREATE INDEX idx_backup_configs_auto_backup ON backup_configs(enable_auto_backup);

CREATE INDEX idx_restore_logs_backup_id ON restore_logs(backup_id);
CREATE INDEX idx_restore_logs_school_id ON restore_logs(school_id);
CREATE INDEX idx_restore_logs_status ON restore_logs(status);
CREATE INDEX idx_restore_logs_created_at ON restore_logs(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_backups_updated_at
  BEFORE UPDATE ON backups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_configs_updated_at
  BEFORE UPDATE ON backup_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restore_logs_updated_at
  BEFORE UPDATE ON restore_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para limpeza automática de backups antigos
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  backup_record RECORD;
BEGIN
  -- Buscar backups expirados
  FOR backup_record IN
    SELECT id, file_path, storage_location
    FROM backups
    WHERE created_at < NOW() - INTERVAL '1 day' * retention_days
      AND status IN ('COMPLETED', 'FAILED', 'CANCELLED')
  LOOP
    -- Deletar arquivo do storage (seria implementado via função externa)
    -- Por enquanto apenas marca como deletado
    
    -- Deletar registro do banco
    DELETE FROM backups WHERE id = backup_record.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Log da limpeza
  INSERT INTO audit_logs (action, result, details, metadata)
  VALUES (
    'BACKUP_CLEANUP',
    'SUCCESS',
    format('Cleaned up %s expired backups', deleted_count),
    jsonb_build_object('deleted_count', deleted_count, 'timestamp', NOW())
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de backup
CREATE OR REPLACE FUNCTION get_backup_stats(
  p_school_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_backups INTEGER;
  successful_backups INTEGER;
  failed_backups INTEGER;
  total_size BIGINT;
  avg_size BIGINT;
  last_backup_date TIMESTAMPTZ;
  oldest_backup_date TIMESTAMPTZ;
BEGIN
  -- Contar backups por status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'COMPLETED'),
    COUNT(*) FILTER (WHERE status = 'FAILED'),
    COALESCE(SUM(size), 0),
    COALESCE(AVG(size), 0),
    MAX(completed_at),
    MIN(created_at)
  INTO 
    total_backups,
    successful_backups,
    failed_backups,
    total_size,
    avg_size,
    last_backup_date,
    oldest_backup_date
  FROM backups
  WHERE 
    (p_school_id IS NULL OR school_id = p_school_id)
    AND created_at >= NOW() - INTERVAL '1 day' * p_days;
  
  -- Construir resultado
  result := jsonb_build_object(
    'total_backups', total_backups,
    'successful_backups', successful_backups,
    'failed_backups', failed_backups,
    'success_rate', 
      CASE 
        WHEN total_backups > 0 THEN ROUND((successful_backups::DECIMAL / total_backups) * 100, 2)
        ELSE 0
      END,
    'total_size_bytes', total_size,
    'total_size_mb', ROUND(total_size / 1048576.0, 2),
    'avg_size_bytes', avg_size,
    'avg_size_mb', ROUND(avg_size / 1048576.0, 2),
    'last_backup_date', last_backup_date,
    'oldest_backup_date', oldest_backup_date,
    'period_days', p_days
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar integridade de backup
CREATE OR REPLACE FUNCTION validate_backup_integrity(
  p_backup_id UUID
)
RETURNS JSONB AS $$
DECLARE
  backup_record RECORD;
  validation_result JSONB;
  is_valid BOOLEAN := true;
  issues TEXT[] := '{}';
BEGIN
  -- Buscar backup
  SELECT * INTO backup_record
  FROM backups
  WHERE id = p_backup_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Backup not found'
    );
  END IF;
  
  -- Verificar se o backup foi completado
  IF backup_record.status != 'COMPLETED' THEN
    is_valid := false;
    issues := array_append(issues, 'Backup not completed successfully');
  END IF;
  
  -- Verificar se tem checksum
  IF backup_record.checksum IS NULL OR backup_record.checksum = '' THEN
    is_valid := false;
    issues := array_append(issues, 'Missing checksum');
  END IF;
  
  -- Verificar se tem tamanho válido
  IF backup_record.size <= 0 THEN
    is_valid := false;
    issues := array_append(issues, 'Invalid backup size');
  END IF;
  
  -- Verificar se tem tabelas
  IF array_length(backup_record.tables, 1) IS NULL OR array_length(backup_record.tables, 1) = 0 THEN
    is_valid := false;
    issues := array_append(issues, 'No tables included in backup');
  END IF;
  
  -- Verificar idade do backup
  IF backup_record.created_at < NOW() - INTERVAL '1 day' * backup_record.retention_days THEN
    is_valid := false;
    issues := array_append(issues, 'Backup has expired');
  END IF;
  
  validation_result := jsonb_build_object(
    'backup_id', p_backup_id,
    'valid', is_valid,
    'issues', issues,
    'backup_info', jsonb_build_object(
      'name', backup_record.name,
      'type', backup_record.type,
      'status', backup_record.status,
      'size', backup_record.size,
      'created_at', backup_record.created_at,
      'completed_at', backup_record.completed_at,
      'tables_count', array_length(backup_record.tables, 1)
    )
  );
  
  RETURN validation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar configuração padrão de backup para escola
CREATE OR REPLACE FUNCTION create_default_backup_config(
  p_school_id UUID
)
RETURNS UUID AS $$
DECLARE
  config_id UUID;
BEGIN
  INSERT INTO backup_configs (
    school_id,
    enable_auto_backup,
    backup_interval,
    retention_days,
    compression_enabled,
    encryption_enabled,
    max_backup_size,
    include_tables,
    exclude_tables,
    backup_location,
    notification_enabled
  ) VALUES (
    p_school_id,
    true,
    86400000, -- 24 horas
    30,
    true,
    true,
    1073741824, -- 1GB
    '{}', -- incluir todas por padrão
    '{"audit_logs", "notification_delivery_log"}',
    'cloud',
    true
  )
  ON CONFLICT (school_id) DO NOTHING
  RETURNING id INTO config_id;
  
  RETURN config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para agendar backup automático
CREATE OR REPLACE FUNCTION schedule_auto_backup(
  p_school_id UUID
)
RETURNS JSONB AS $$
DECLARE
  config_record RECORD;
  last_backup_date TIMESTAMPTZ;
  next_backup_due BOOLEAN := false;
  result JSONB;
BEGIN
  -- Buscar configuração da escola
  SELECT * INTO config_record
  FROM backup_configs
  WHERE school_id = p_school_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'scheduled', false,
      'error', 'Backup configuration not found for school'
    );
  END IF;
  
  -- Verificar se auto backup está habilitado
  IF NOT config_record.enable_auto_backup THEN
    RETURN jsonb_build_object(
      'scheduled', false,
      'reason', 'Auto backup is disabled'
    );
  END IF;
  
  -- Verificar último backup
  SELECT MAX(completed_at) INTO last_backup_date
  FROM backups
  WHERE school_id = p_school_id
    AND type = 'SCHEDULED'
    AND status = 'COMPLETED';
  
  -- Determinar se é hora do próximo backup
  IF last_backup_date IS NULL THEN
    next_backup_due := true;
  ELSE
    next_backup_due := last_backup_date < NOW() - INTERVAL '1 millisecond' * config_record.backup_interval;
  END IF;
  
  IF next_backup_due THEN
    -- Criar entrada de backup agendado
    INSERT INTO backups (
      name,
      description,
      type,
      status,
      school_id,
      retention_days,
      metadata
    ) VALUES (
      format('auto-backup-%s', TO_CHAR(NOW(), 'YYYY-MM-DD-HH24-MI-SS')),
      'Backup automático agendado',
      'SCHEDULED',
      'PENDING',
      p_school_id,
      config_record.retention_days,
      jsonb_build_object(
        'auto_scheduled', true,
        'config_id', config_record.id,
        'scheduled_at', NOW()
      )
    );
    
    result := jsonb_build_object(
      'scheduled', true,
      'next_backup_time', NOW(),
      'last_backup_date', last_backup_date
    );
  ELSE
    result := jsonb_build_object(
      'scheduled', false,
      'reason', 'Backup not due yet',
      'last_backup_date', last_backup_date,
      'next_backup_due', last_backup_date + INTERVAL '1 millisecond' * config_record.backup_interval
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de Row Level Security (RLS)
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para backups
CREATE POLICY "Users can view backups from their school" ON backups
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage backups from their school" ON backups
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_users 
      WHERE user_id = auth.uid() 
      AND role IN ('DIRECTOR', 'ADMIN')
    )
  );

CREATE POLICY "System can create scheduled backups" ON backups
  FOR INSERT
  WITH CHECK (type = 'SCHEDULED');

-- Políticas para configurações de backup
CREATE POLICY "Users can view backup config from their school" ON backup_configs
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage backup config from their school" ON backup_configs
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_users 
      WHERE user_id = auth.uid() 
      AND role IN ('DIRECTOR', 'ADMIN')
    )
  );

-- Políticas para logs de restauração
CREATE POLICY "Users can view restore logs from their school" ON restore_logs
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage restore logs from their school" ON restore_logs
  FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_users 
      WHERE user_id = auth.uid() 
      AND role IN ('DIRECTOR', 'ADMIN')
    )
  );

-- Trigger para criar configuração padrão quando uma escola é criada
CREATE OR REPLACE FUNCTION create_school_backup_config()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_backup_config(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_school_backup_config
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION create_school_backup_config();

-- Comentários para documentação
COMMENT ON TABLE backups IS 'Tabela para armazenar metadados de backups do sistema';
COMMENT ON TABLE backup_configs IS 'Configurações de backup por escola';
COMMENT ON TABLE restore_logs IS 'Logs de operações de restauração';

COMMENT ON FUNCTION cleanup_expired_backups() IS 'Remove backups expirados automaticamente';
COMMENT ON FUNCTION get_backup_stats(UUID, INTEGER) IS 'Retorna estatísticas de backup para uma escola';
COMMENT ON FUNCTION validate_backup_integrity(UUID) IS 'Valida a integridade de um backup específico';
COMMENT ON FUNCTION create_default_backup_config(UUID) IS 'Cria configuração padrão de backup para uma escola';
COMMENT ON FUNCTION schedule_auto_backup(UUID) IS 'Agenda backup automático para uma escola';