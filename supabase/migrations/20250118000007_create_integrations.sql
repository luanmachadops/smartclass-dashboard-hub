-- Migração para sistema de integrações
-- Criada em: 2025-01-18
-- Descrição: Tabelas para gerenciar integrações com APIs externas

-- Enum para tipos de integração
CREATE TYPE integration_type AS ENUM (
  'PAYMENT',
  'EMAIL',
  'SMS',
  'CALENDAR',
  'VIDEO_CONFERENCE',
  'STORAGE',
  'ANALYTICS',
  'CRM',
  'ACCOUNTING',
  'SOCIAL_MEDIA',
  'MESSAGING',
  'AUTHENTICATION',
  'CUSTOM'
);

-- Enum para status de sincronização
CREATE TYPE sync_status AS ENUM (
  'IDLE',
  'SYNCING',
  'SUCCESS',
  'ERROR',
  'PAUSED'
);

-- Tabela principal de integrações
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type integration_type NOT NULL,
  provider VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}', -- Dados criptografados
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  last_sync TIMESTAMPTZ,
  last_error TEXT,
  sync_status sync_status DEFAULT 'IDLE',
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Tabela para logs de sincronização
CREATE TABLE integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  success BOOLEAN NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  duration INTEGER, -- em milissegundos
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para logs de webhooks
CREATE TABLE integration_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  payload JSONB NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  response_time INTEGER, -- em milissegundos
  ip_address INET,
  user_agent TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para mapeamento de campos
CREATE TABLE integration_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  internal_field VARCHAR(255) NOT NULL,
  external_field VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, date, object
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  transformation_rule TEXT, -- Regra de transformação (ex: JavaScript)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, internal_field)
);

-- Tabela para dados sincronizados
CREATE TABLE integration_sync_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  internal_id UUID,
  entity_type VARCHAR(100) NOT NULL, -- payment, student, class, etc.
  external_data JSONB NOT NULL,
  internal_data JSONB,
  sync_status VARCHAR(50) DEFAULT 'synced', -- synced, pending, error
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, external_id, entity_type)
);

-- Tabela para configurações de rate limiting por integração
CREATE TABLE integration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_per_day INTEGER DEFAULT 10000,
  burst_limit INTEGER DEFAULT 10,
  current_usage JSONB DEFAULT '{}',
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, endpoint)
);

-- Tabela para templates de transformação de dados
CREATE TABLE integration_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type integration_type NOT NULL,
  provider VARCHAR(100) NOT NULL,
  description TEXT,
  config_template JSONB NOT NULL,
  field_mappings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para alertas de integração
CREATE TABLE integration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- sync_failure, rate_limit, webhook_failure
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para métricas de integração
CREATE TABLE integration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  sync_count INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  records_processed INTEGER DEFAULT 0,
  average_sync_duration INTEGER DEFAULT 0, -- em milissegundos
  webhook_count INTEGER DEFAULT 0,
  successful_webhooks INTEGER DEFAULT 0,
  failed_webhooks INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  rate_limit_hits INTEGER DEFAULT 0,
  error_rate DECIMAL(5,4) DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(integration_id, date)
);

-- Índices para performance
CREATE INDEX idx_integrations_school_id ON integrations(school_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_is_active ON integrations(is_active);
CREATE INDEX idx_integrations_sync_status ON integrations(sync_status);
CREATE INDEX idx_integrations_last_sync ON integrations(last_sync);

CREATE INDEX idx_integration_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX idx_integration_sync_logs_started_at ON integration_sync_logs(started_at);
CREATE INDEX idx_integration_sync_logs_success ON integration_sync_logs(success);

CREATE INDEX idx_integration_webhook_logs_integration_id ON integration_webhook_logs(integration_id);
CREATE INDEX idx_integration_webhook_logs_processed_at ON integration_webhook_logs(processed_at);
CREATE INDEX idx_integration_webhook_logs_success ON integration_webhook_logs(success);

CREATE INDEX idx_integration_field_mappings_integration_id ON integration_field_mappings(integration_id);

CREATE INDEX idx_integration_sync_data_integration_id ON integration_sync_data(integration_id);
CREATE INDEX idx_integration_sync_data_external_id ON integration_sync_data(external_id);
CREATE INDEX idx_integration_sync_data_entity_type ON integration_sync_data(entity_type);
CREATE INDEX idx_integration_sync_data_sync_status ON integration_sync_data(sync_status);
CREATE INDEX idx_integration_sync_data_last_synced ON integration_sync_data(last_synced_at);

CREATE INDEX idx_integration_rate_limits_integration_id ON integration_rate_limits(integration_id);
CREATE INDEX idx_integration_rate_limits_endpoint ON integration_rate_limits(endpoint);

CREATE INDEX idx_integration_templates_type ON integration_templates(type);
CREATE INDEX idx_integration_templates_provider ON integration_templates(provider);
CREATE INDEX idx_integration_templates_is_public ON integration_templates(is_public);

CREATE INDEX idx_integration_alerts_integration_id ON integration_alerts(integration_id);
CREATE INDEX idx_integration_alerts_alert_type ON integration_alerts(alert_type);
CREATE INDEX idx_integration_alerts_severity ON integration_alerts(severity);
CREATE INDEX idx_integration_alerts_is_resolved ON integration_alerts(is_resolved);
CREATE INDEX idx_integration_alerts_created_at ON integration_alerts(created_at);

CREATE INDEX idx_integration_metrics_integration_id ON integration_metrics(integration_id);
CREATE INDEX idx_integration_metrics_date ON integration_metrics(date);

-- Triggers para updated_at
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_field_mappings_updated_at BEFORE UPDATE ON integration_field_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_sync_data_updated_at BEFORE UPDATE ON integration_sync_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_rate_limits_updated_at BEFORE UPDATE ON integration_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_templates_updated_at BEFORE UPDATE ON integration_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_metrics_updated_at BEFORE UPDATE ON integration_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpeza de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_integration_logs()
RETURNS void AS $$
BEGIN
  -- Manter logs de sincronização por 90 dias
  DELETE FROM integration_sync_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Manter logs de webhook por 30 dias
  DELETE FROM integration_webhook_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Manter alertas resolvidos por 180 dias
  DELETE FROM integration_alerts 
  WHERE is_resolved = true 
    AND resolved_at < NOW() - INTERVAL '180 days';
  
  -- Manter métricas por 2 anos
  DELETE FROM integration_metrics 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Limpar dados de sincronização órfãos (sem integração)
  DELETE FROM integration_sync_data 
  WHERE integration_id NOT IN (SELECT id FROM integrations);
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas diárias de integração
CREATE OR REPLACE FUNCTION calculate_integration_daily_metrics(
  target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
)
RETURNS void AS $$
DECLARE
  integration_record RECORD;
BEGIN
  FOR integration_record IN 
    SELECT id FROM integrations WHERE is_active = true
  LOOP
    PERFORM calculate_integration_metrics(integration_record.id, target_date);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para calcular métricas de uma integração específica
CREATE OR REPLACE FUNCTION calculate_integration_metrics(
  target_integration_id UUID,
  target_date DATE
)
RETURNS void AS $$
DECLARE
  sync_count_val INTEGER;
  successful_syncs_val INTEGER;
  failed_syncs_val INTEGER;
  records_processed_val INTEGER;
  avg_sync_duration_val INTEGER;
  webhook_count_val INTEGER;
  successful_webhooks_val INTEGER;
  failed_webhooks_val INTEGER;
  error_rate_val DECIMAL(5,4);
BEGIN
  -- Contar sincronizações
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN success = true THEN 1 END),
    COUNT(CASE WHEN success = false THEN 1 END),
    COALESCE(SUM(records_processed), 0),
    COALESCE(AVG(duration), 0)::INTEGER
  INTO 
    sync_count_val,
    successful_syncs_val,
    failed_syncs_val,
    records_processed_val,
    avg_sync_duration_val
  FROM integration_sync_logs
  WHERE integration_id = target_integration_id
    AND DATE(started_at) = target_date;
  
  -- Contar webhooks
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN success = true THEN 1 END),
    COUNT(CASE WHEN success = false THEN 1 END)
  INTO 
    webhook_count_val,
    successful_webhooks_val,
    failed_webhooks_val
  FROM integration_webhook_logs
  WHERE integration_id = target_integration_id
    AND DATE(processed_at) = target_date;
  
  -- Calcular taxa de erro
  error_rate_val := CASE 
    WHEN (sync_count_val + webhook_count_val) > 0 THEN
      (failed_syncs_val + failed_webhooks_val)::DECIMAL / (sync_count_val + webhook_count_val)
    ELSE 0
  END;
  
  -- Inserir ou atualizar métricas
  INSERT INTO integration_metrics (
    integration_id,
    date,
    sync_count,
    successful_syncs,
    failed_syncs,
    records_processed,
    average_sync_duration,
    webhook_count,
    successful_webhooks,
    failed_webhooks,
    error_rate
  ) VALUES (
    target_integration_id,
    target_date,
    sync_count_val,
    successful_syncs_val,
    failed_syncs_val,
    records_processed_val,
    avg_sync_duration_val,
    webhook_count_val,
    successful_webhooks_val,
    failed_webhooks_val,
    error_rate_val
  )
  ON CONFLICT (integration_id, date)
  DO UPDATE SET
    sync_count = EXCLUDED.sync_count,
    successful_syncs = EXCLUDED.successful_syncs,
    failed_syncs = EXCLUDED.failed_syncs,
    records_processed = EXCLUDED.records_processed,
    average_sync_duration = EXCLUDED.average_sync_duration,
    webhook_count = EXCLUDED.webhook_count,
    successful_webhooks = EXCLUDED.successful_webhooks,
    failed_webhooks = EXCLUDED.failed_webhooks,
    error_rate = EXCLUDED.error_rate,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para verificar rate limits
CREATE OR REPLACE FUNCTION check_integration_rate_limit(
  target_integration_id UUID,
  endpoint_name VARCHAR(255),
  requests_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  rate_limit_record RECORD;
  current_minute INTEGER;
  current_hour INTEGER;
  current_day INTEGER;
  usage_data JSONB;
BEGIN
  -- Obter configuração de rate limit
  SELECT * INTO rate_limit_record
  FROM integration_rate_limits
  WHERE integration_id = target_integration_id
    AND endpoint = endpoint_name;
  
  -- Se não há configuração, permitir
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Obter timestamps atuais
  current_minute := EXTRACT(EPOCH FROM NOW())::INTEGER / 60;
  current_hour := EXTRACT(EPOCH FROM NOW())::INTEGER / 3600;
  current_day := EXTRACT(EPOCH FROM NOW())::INTEGER / 86400;
  
  -- Obter dados de uso atual
  usage_data := COALESCE(rate_limit_record.current_usage, '{}');
  
  -- Verificar limites
  IF (usage_data->>'minute_requests')::INTEGER + requests_count > rate_limit_record.requests_per_minute THEN
    RETURN false;
  END IF;
  
  IF (usage_data->>'hour_requests')::INTEGER + requests_count > rate_limit_record.requests_per_hour THEN
    RETURN false;
  END IF;
  
  IF (usage_data->>'day_requests')::INTEGER + requests_count > rate_limit_record.requests_per_day THEN
    RETURN false;
  END IF;
  
  -- Atualizar contadores
  usage_data := jsonb_set(usage_data, '{minute_requests}', 
    to_jsonb(COALESCE((usage_data->>'minute_requests')::INTEGER, 0) + requests_count));
  usage_data := jsonb_set(usage_data, '{hour_requests}', 
    to_jsonb(COALESCE((usage_data->>'hour_requests')::INTEGER, 0) + requests_count));
  usage_data := jsonb_set(usage_data, '{day_requests}', 
    to_jsonb(COALESCE((usage_data->>'day_requests')::INTEGER, 0) + requests_count));
  usage_data := jsonb_set(usage_data, '{last_minute}', to_jsonb(current_minute));
  usage_data := jsonb_set(usage_data, '{last_hour}', to_jsonb(current_hour));
  usage_data := jsonb_set(usage_data, '{last_day}', to_jsonb(current_day));
  
  -- Atualizar no banco
  UPDATE integration_rate_limits
  SET current_usage = usage_data,
      last_reset = NOW()
  WHERE integration_id = target_integration_id
    AND endpoint = endpoint_name;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para resetar rate limits
CREATE OR REPLACE FUNCTION reset_integration_rate_limits()
RETURNS void AS $$
DECLARE
  rate_limit_record RECORD;
  current_minute INTEGER;
  current_hour INTEGER;
  current_day INTEGER;
  usage_data JSONB;
  needs_update BOOLEAN;
BEGIN
  current_minute := EXTRACT(EPOCH FROM NOW())::INTEGER / 60;
  current_hour := EXTRACT(EPOCH FROM NOW())::INTEGER / 3600;
  current_day := EXTRACT(EPOCH FROM NOW())::INTEGER / 86400;
  
  FOR rate_limit_record IN 
    SELECT * FROM integration_rate_limits
  LOOP
    usage_data := COALESCE(rate_limit_record.current_usage, '{}');
    needs_update := false;
    
    -- Reset contador de minuto se necessário
    IF (usage_data->>'last_minute')::INTEGER < current_minute THEN
      usage_data := jsonb_set(usage_data, '{minute_requests}', '0');
      usage_data := jsonb_set(usage_data, '{last_minute}', to_jsonb(current_minute));
      needs_update := true;
    END IF;
    
    -- Reset contador de hora se necessário
    IF (usage_data->>'last_hour')::INTEGER < current_hour THEN
      usage_data := jsonb_set(usage_data, '{hour_requests}', '0');
      usage_data := jsonb_set(usage_data, '{last_hour}', to_jsonb(current_hour));
      needs_update := true;
    END IF;
    
    -- Reset contador de dia se necessário
    IF (usage_data->>'last_day')::INTEGER < current_day THEN
      usage_data := jsonb_set(usage_data, '{day_requests}', '0');
      usage_data := jsonb_set(usage_data, '{last_day}', to_jsonb(current_day));
      needs_update := true;
    END IF;
    
    -- Atualizar se necessário
    IF needs_update THEN
      UPDATE integration_rate_limits
      SET current_usage = usage_data,
          last_reset = NOW()
      WHERE id = rate_limit_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar alerta de integração
CREATE OR REPLACE FUNCTION create_integration_alert(
  target_integration_id UUID,
  alert_type_val VARCHAR(50),
  severity_val VARCHAR(20),
  message_val TEXT,
  details_val JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO integration_alerts (
    integration_id,
    alert_type,
    severity,
    message,
    details
  ) VALUES (
    target_integration_id,
    alert_type_val,
    severity_val,
    message_val,
    details_val
  ) RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de integração
CREATE OR REPLACE FUNCTION get_integration_stats(
  target_school_id UUID,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_integrations INTEGER,
  active_integrations INTEGER,
  total_syncs INTEGER,
  successful_syncs INTEGER,
  failed_syncs INTEGER,
  total_webhooks INTEGER,
  successful_webhooks INTEGER,
  failed_webhooks INTEGER,
  average_error_rate DECIMAL(5,4),
  most_used_provider VARCHAR(100),
  most_active_integration VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  WITH integration_stats AS (
    SELECT 
      i.id,
      i.name,
      i.provider,
      i.is_active,
      COALESCE(SUM(im.sync_count), 0) as sync_count,
      COALESCE(SUM(im.successful_syncs), 0) as successful_sync_count,
      COALESCE(SUM(im.failed_syncs), 0) as failed_sync_count,
      COALESCE(SUM(im.webhook_count), 0) as webhook_count,
      COALESCE(SUM(im.successful_webhooks), 0) as successful_webhook_count,
      COALESCE(SUM(im.failed_webhooks), 0) as failed_webhook_count,
      COALESCE(AVG(im.error_rate), 0) as avg_error_rate
    FROM integrations i
    LEFT JOIN integration_metrics im ON i.id = im.integration_id 
      AND im.date BETWEEN start_date AND end_date
    WHERE i.school_id = target_school_id
    GROUP BY i.id, i.name, i.provider, i.is_active
  ),
  provider_stats AS (
    SELECT provider, COUNT(*) as provider_count
    FROM integration_stats
    GROUP BY provider
    ORDER BY provider_count DESC
    LIMIT 1
  ),
  activity_stats AS (
    SELECT name, sync_count
    FROM integration_stats
    ORDER BY sync_count DESC
    LIMIT 1
  )
  SELECT 
    COUNT(*)::INTEGER as total_integrations,
    COUNT(CASE WHEN is_active THEN 1 END)::INTEGER as active_integrations,
    COALESCE(SUM(sync_count), 0)::INTEGER as total_syncs,
    COALESCE(SUM(successful_sync_count), 0)::INTEGER as successful_syncs,
    COALESCE(SUM(failed_sync_count), 0)::INTEGER as failed_syncs,
    COALESCE(SUM(webhook_count), 0)::INTEGER as total_webhooks,
    COALESCE(SUM(successful_webhook_count), 0)::INTEGER as successful_webhooks,
    COALESCE(SUM(failed_webhook_count), 0)::INTEGER as failed_webhooks,
    COALESCE(AVG(avg_error_rate), 0)::DECIMAL(5,4) as average_error_rate,
    COALESCE((SELECT provider FROM provider_stats), 'none')::VARCHAR(100) as most_used_provider,
    COALESCE((SELECT name FROM activity_stats), 'none')::VARCHAR(255) as most_active_integration
  FROM integration_stats;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para integrations
CREATE POLICY "Users can view integrations from their school" ON integrations
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_schools 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage integrations" ON integrations
  FOR ALL USING (
    school_id IN (
      SELECT us.school_id FROM user_schools us
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para integration_sync_logs
CREATE POLICY "Users can view sync logs from their school" ON integration_sync_logs
  FOR SELECT USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sync logs" ON integration_sync_logs
  FOR INSERT WITH CHECK (true);

-- Políticas para integration_webhook_logs
CREATE POLICY "Users can view webhook logs from their school" ON integration_webhook_logs
  FOR SELECT USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert webhook logs" ON integration_webhook_logs
  FOR INSERT WITH CHECK (true);

-- Políticas para integration_field_mappings
CREATE POLICY "Users can view field mappings from their school" ON integration_field_mappings
  FOR SELECT USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage field mappings" ON integration_field_mappings
  FOR ALL USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para integration_sync_data
CREATE POLICY "Users can view sync data from their school" ON integration_sync_data
  FOR SELECT USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sync data" ON integration_sync_data
  FOR ALL WITH CHECK (true);

-- Políticas para integration_rate_limits
CREATE POLICY "Directors can manage rate limits" ON integration_rate_limits
  FOR ALL USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para integration_templates
CREATE POLICY "Users can view public templates" ON integration_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON integration_templates
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can manage their own templates" ON integration_templates
  FOR ALL USING (created_by = auth.uid());

-- Políticas para integration_alerts
CREATE POLICY "Users can view alerts from their school" ON integration_alerts
  FOR SELECT USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage alerts" ON integration_alerts
  FOR ALL USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para integration_metrics
CREATE POLICY "Users can view metrics from their school" ON integration_metrics
  FOR SELECT USING (
    integration_id IN (
      SELECT i.id FROM integrations i
      JOIN user_schools us ON us.school_id = i.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage metrics" ON integration_metrics
  FOR ALL WITH CHECK (true);

-- Inserir templates padrão
INSERT INTO integration_templates (name, type, provider, description, config_template, field_mappings, is_public) VALUES
('Stripe Payments', 'PAYMENT', 'stripe', 'Template padrão para integração com Stripe', 
 '{
   "baseUrl": "https://api.stripe.com/v1",
   "apiVersion": "2023-10-16",
   "timeout": 30000,
   "retryAttempts": 3,
   "syncInterval": 60,
   "enableWebhooks": true
 }', 
 '{
   "amount": "amount",
   "currency": "currency",
   "status": "status",
   "customer_email": "billing_details.email",
   "created": "created"
 }', 
 true),

('SendGrid Email', 'EMAIL', 'sendgrid', 'Template padrão para integração com SendGrid',
 '{
   "baseUrl": "https://api.sendgrid.com/v3",
   "timeout": 30000,
   "retryAttempts": 3,
   "batchSize": 100
 }',
 '{
   "to": "personalizations[0].to[0].email",
   "subject": "subject",
   "content": "content[0].value",
   "from": "from.email"
 }',
 true),

('Twilio SMS', 'SMS', 'twilio', 'Template padrão para integração com Twilio SMS',
 '{
   "baseUrl": "https://api.twilio.com/2010-04-01",
   "timeout": 30000,
   "retryAttempts": 3
 }',
 '{
   "to": "to",
   "from": "from",
   "body": "body",
   "status": "status"
 }',
 true),

('Google Calendar', 'CALENDAR', 'google_calendar', 'Template padrão para integração com Google Calendar',
 '{
   "baseUrl": "https://www.googleapis.com/calendar/v3",
   "timeout": 30000,
   "retryAttempts": 3,
   "syncInterval": 30
 }',
 '{
   "title": "summary",
   "start_time": "start.dateTime",
   "end_time": "end.dateTime",
   "description": "description",
   "location": "location"
 }',
 true),

('Zoom Meetings', 'VIDEO_CONFERENCE', 'zoom', 'Template padrão para integração com Zoom',
 '{
   "baseUrl": "https://api.zoom.us/v2",
   "timeout": 30000,
   "retryAttempts": 3
 }',
 '{
   "title": "topic",
   "start_time": "start_time",
   "duration": "duration",
   "join_url": "join_url",
   "meeting_id": "id"
 }',
 true);

-- Comentários para documentação
COMMENT ON TABLE integrations IS 'Tabela principal para gerenciar integrações com APIs externas';
COMMENT ON TABLE integration_sync_logs IS 'Logs de sincronização de dados entre sistemas';
COMMENT ON TABLE integration_webhook_logs IS 'Logs de webhooks recebidos de sistemas externos';
COMMENT ON TABLE integration_field_mappings IS 'Mapeamento de campos entre sistemas interno e externo';
COMMENT ON TABLE integration_sync_data IS 'Dados sincronizados entre sistemas com rastreamento de estado';
COMMENT ON TABLE integration_rate_limits IS 'Configurações e controle de rate limiting por integração';
COMMENT ON TABLE integration_templates IS 'Templates pré-configurados para facilitar criação de integrações';
COMMENT ON TABLE integration_alerts IS 'Alertas e notificações relacionados a problemas nas integrações';
COMMENT ON TABLE integration_metrics IS 'Métricas agregadas de performance e uso das integrações';

COMMENT ON FUNCTION cleanup_old_integration_logs() IS 'Função para limpeza automática de logs antigos de integração';
COMMENT ON FUNCTION calculate_integration_daily_metrics(DATE) IS 'Função para calcular métricas diárias de todas as integrações';
COMMENT ON FUNCTION check_integration_rate_limit(UUID, VARCHAR, INTEGER) IS 'Função para verificar e aplicar rate limiting em integrações';
COMMENT ON FUNCTION get_integration_stats(UUID, DATE, DATE) IS 'Função para obter estatísticas consolidadas de integrações por escola';