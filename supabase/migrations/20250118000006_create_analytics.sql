-- Migração para sistema de analytics
-- Criada em: 2025-01-18
-- Descrição: Tabelas para rastreamento de eventos, sessões e métricas de analytics

-- Enum para categorias de eventos
CREATE TYPE event_category AS ENUM (
  'PAGE_VIEW',
  'USER_ACTION',
  'SYSTEM_EVENT',
  'ERROR',
  'PERFORMANCE',
  'CONVERSION',
  'ENGAGEMENT',
  'CUSTOM'
);

-- Enum para tipos de dispositivo
CREATE TYPE device_type AS ENUM (
  'desktop',
  'mobile',
  'tablet'
);

-- Tabela para eventos de analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category event_category NOT NULL,
  action VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  value NUMERIC,
  properties JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip INET,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para sessões de usuário
CREATE TABLE analytics_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- em milissegundos
  page_views INTEGER DEFAULT 0,
  events INTEGER DEFAULT 0,
  device JSONB NOT NULL,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para métricas agregadas diárias
CREATE TABLE analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_page_views INTEGER DEFAULT 0,
  average_session_duration INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rates JSONB DEFAULT '{}',
  top_pages JSONB DEFAULT '[]',
  top_events JSONB DEFAULT '[]',
  device_breakdown JSONB DEFAULT '{}',
  traffic_sources JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, date)
);

-- Tabela para funis de conversão
CREATE TABLE analytics_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array de steps do funil
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para dados de funil por usuário
CREATE TABLE analytics_funnel_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID REFERENCES analytics_funnels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  step_index INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para configurações de analytics por escola
CREATE TABLE analytics_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE UNIQUE,
  enable_tracking BOOLEAN DEFAULT true,
  enable_user_tracking BOOLEAN DEFAULT true,
  enable_performance_tracking BOOLEAN DEFAULT true,
  enable_error_tracking BOOLEAN DEFAULT true,
  enable_heatmaps BOOLEAN DEFAULT false,
  enable_recordings BOOLEAN DEFAULT false,
  sample_rate DECIMAL(3,2) DEFAULT 1.0,
  batch_size INTEGER DEFAULT 50,
  flush_interval INTEGER DEFAULT 30000,
  enable_realtime BOOLEAN DEFAULT false,
  enable_offline_tracking BOOLEAN DEFAULT true,
  privacy_mode BOOLEAN DEFAULT false,
  retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para alertas de analytics
CREATE TABLE analytics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metric_name VARCHAR(255) NOT NULL,
  condition_type VARCHAR(50) NOT NULL, -- 'greater_than', 'less_than', 'equals', 'change_percent'
  threshold_value DECIMAL(10,2) NOT NULL,
  comparison_period INTEGER DEFAULT 24, -- em horas
  is_active BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '[]', -- ['email', 'push', 'slack']
  last_triggered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para histórico de alertas
CREATE TABLE analytics_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES analytics_alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_value DECIMAL(10,2) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  message TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_school_id ON analytics_events(school_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_category ON analytics_events(category);
CREATE INDEX idx_analytics_events_name ON analytics_events(name);
CREATE INDEX idx_analytics_events_school_timestamp ON analytics_events(school_id, timestamp);
CREATE INDEX idx_analytics_events_properties ON analytics_events USING GIN(properties);

CREATE INDEX idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX idx_analytics_sessions_school_id ON analytics_sessions(school_id);
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_school_start ON analytics_sessions(school_id, start_time);

CREATE INDEX idx_analytics_daily_metrics_date ON analytics_daily_metrics(date);
CREATE INDEX idx_analytics_daily_metrics_school_id ON analytics_daily_metrics(school_id);
CREATE INDEX idx_analytics_daily_metrics_school_date ON analytics_daily_metrics(school_id, date);

CREATE INDEX idx_analytics_funnel_data_funnel_id ON analytics_funnel_data(funnel_id);
CREATE INDEX idx_analytics_funnel_data_user_id ON analytics_funnel_data(user_id);
CREATE INDEX idx_analytics_funnel_data_session_id ON analytics_funnel_data(session_id);
CREATE INDEX idx_analytics_funnel_data_completed_at ON analytics_funnel_data(completed_at);

CREATE INDEX idx_analytics_alerts_school_id ON analytics_alerts(school_id);
CREATE INDEX idx_analytics_alerts_is_active ON analytics_alerts(is_active);

CREATE INDEX idx_analytics_alert_history_alert_id ON analytics_alert_history(alert_id);
CREATE INDEX idx_analytics_alert_history_triggered_at ON analytics_alert_history(triggered_at);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analytics_events_updated_at BEFORE UPDATE ON analytics_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_sessions_updated_at BEFORE UPDATE ON analytics_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_daily_metrics_updated_at BEFORE UPDATE ON analytics_daily_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_funnels_updated_at BEFORE UPDATE ON analytics_funnels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_configs_updated_at BEFORE UPDATE ON analytics_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_alerts_updated_at BEFORE UPDATE ON analytics_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpeza de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
DECLARE
  config_record RECORD;
BEGIN
  -- Limpar dados baseado na configuração de retenção de cada escola
  FOR config_record IN 
    SELECT school_id, retention_days 
    FROM analytics_configs 
    WHERE retention_days IS NOT NULL
  LOOP
    -- Deletar eventos antigos
    DELETE FROM analytics_events 
    WHERE school_id = config_record.school_id 
      AND timestamp < NOW() - INTERVAL '1 day' * config_record.retention_days;
    
    -- Deletar sessões antigas
    DELETE FROM analytics_sessions 
    WHERE school_id = config_record.school_id 
      AND start_time < NOW() - INTERVAL '1 day' * config_record.retention_days;
    
    -- Manter métricas diárias por mais tempo (2x o período de retenção)
    DELETE FROM analytics_daily_metrics 
    WHERE school_id = config_record.school_id 
      AND date < CURRENT_DATE - INTERVAL '1 day' * (config_record.retention_days * 2);
  END LOOP;
  
  -- Limpar dados de escolas sem configuração (padrão 90 dias)
  DELETE FROM analytics_events 
  WHERE school_id NOT IN (SELECT school_id FROM analytics_configs)
    AND timestamp < NOW() - INTERVAL '90 days';
    
  DELETE FROM analytics_sessions 
  WHERE school_id NOT IN (SELECT school_id FROM analytics_configs)
    AND start_time < NOW() - INTERVAL '90 days';
    
  DELETE FROM analytics_daily_metrics 
  WHERE school_id NOT IN (SELECT school_id FROM analytics_configs)
    AND date < CURRENT_DATE - INTERVAL '180 days';
    
  -- Limpar histórico de alertas antigos (1 ano)
  DELETE FROM analytics_alert_history 
  WHERE triggered_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas diárias
CREATE OR REPLACE FUNCTION calculate_daily_metrics(
  target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day',
  target_school_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  school_record RECORD;
  metrics_record RECORD;
BEGIN
  -- Se school_id específico foi fornecido, processar apenas essa escola
  IF target_school_id IS NOT NULL THEN
    PERFORM calculate_school_daily_metrics(target_date, target_school_id);
    RETURN;
  END IF;
  
  -- Processar todas as escolas
  FOR school_record IN 
    SELECT DISTINCT school_id 
    FROM analytics_events 
    WHERE DATE(timestamp) = target_date
      AND school_id IS NOT NULL
  LOOP
    PERFORM calculate_school_daily_metrics(target_date, school_record.school_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para calcular métricas de uma escola específica
CREATE OR REPLACE FUNCTION calculate_school_daily_metrics(
  target_date DATE,
  target_school_id UUID
)
RETURNS void AS $$
DECLARE
  total_users_count INTEGER;
  active_users_count INTEGER;
  new_users_count INTEGER;
  sessions_count INTEGER;
  page_views_count INTEGER;
  unique_page_views_count INTEGER;
  avg_session_duration INTEGER;
  bounce_rate_value DECIMAL(5,4);
  top_pages_data JSONB;
  top_events_data JSONB;
  device_breakdown_data JSONB;
  traffic_sources_data JSONB;
BEGIN
  -- Calcular usuários totais (únicos no dia)
  SELECT COUNT(DISTINCT user_id) INTO total_users_count
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
    AND school_id = target_school_id
    AND user_id IS NOT NULL;
  
  -- Usuários ativos (com pelo menos 1 evento)
  active_users_count := total_users_count;
  
  -- Novos usuários (primeira vez que aparecem)
  SELECT COUNT(DISTINCT user_id) INTO new_users_count
  FROM analytics_events e1
  WHERE DATE(e1.timestamp) = target_date
    AND e1.school_id = target_school_id
    AND e1.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM analytics_events e2
      WHERE e2.user_id = e1.user_id
        AND e2.school_id = target_school_id
        AND DATE(e2.timestamp) < target_date
    );
  
  -- Sessões
  SELECT COUNT(DISTINCT session_id) INTO sessions_count
  FROM analytics_sessions
  WHERE DATE(start_time) = target_date
    AND school_id = target_school_id;
  
  -- Page views
  SELECT COUNT(*) INTO page_views_count
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
    AND school_id = target_school_id
    AND category = 'PAGE_VIEW';
  
  -- Unique page views
  SELECT COUNT(DISTINCT (properties->>'page')) INTO unique_page_views_count
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
    AND school_id = target_school_id
    AND category = 'PAGE_VIEW'
    AND properties->>'page' IS NOT NULL;
  
  -- Duração média da sessão
  SELECT COALESCE(AVG(duration), 0)::INTEGER INTO avg_session_duration
  FROM analytics_sessions
  WHERE DATE(start_time) = target_date
    AND school_id = target_school_id
    AND duration IS NOT NULL;
  
  -- Taxa de rejeição (sessões com apenas 1 page view)
  WITH session_page_views AS (
    SELECT session_id, COUNT(*) as pv_count
    FROM analytics_events
    WHERE DATE(timestamp) = target_date
      AND school_id = target_school_id
      AND category = 'PAGE_VIEW'
    GROUP BY session_id
  )
  SELECT COALESCE(
    COUNT(CASE WHEN pv_count = 1 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0),
    0
  ) INTO bounce_rate_value
  FROM session_page_views;
  
  -- Top páginas
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'page', page,
        'views', views
      ) ORDER BY views DESC
    ) FILTER (WHERE rn <= 10),
    '[]'::jsonb
  ) INTO top_pages_data
  FROM (
    SELECT 
      properties->>'page' as page,
      COUNT(*) as views,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
    FROM analytics_events
    WHERE DATE(timestamp) = target_date
      AND school_id = target_school_id
      AND category = 'PAGE_VIEW'
      AND properties->>'page' IS NOT NULL
    GROUP BY properties->>'page'
  ) ranked_pages;
  
  -- Top eventos
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'event', event_name,
        'count', event_count
      ) ORDER BY event_count DESC
    ) FILTER (WHERE rn <= 10),
    '[]'::jsonb
  ) INTO top_events_data
  FROM (
    SELECT 
      name as event_name,
      COUNT(*) as event_count,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
    FROM analytics_events
    WHERE DATE(timestamp) = target_date
      AND school_id = target_school_id
    GROUP BY name
  ) ranked_events;
  
  -- Breakdown por dispositivo
  SELECT COALESCE(
    jsonb_object_agg(
      device_type,
      device_count
    ),
    '{}'::jsonb
  ) INTO device_breakdown_data
  FROM (
    SELECT 
      device->>'type' as device_type,
      COUNT(DISTINCT session_id) as device_count
    FROM analytics_sessions
    WHERE DATE(start_time) = target_date
      AND school_id = target_school_id
      AND device->>'type' IS NOT NULL
    GROUP BY device->>'type'
  ) device_stats;
  
  -- Fontes de tráfego
  SELECT COALESCE(
    jsonb_object_agg(
      COALESCE(utm_source, 'direct'),
      source_count
    ),
    '{}'::jsonb
  ) INTO traffic_sources_data
  FROM (
    SELECT 
      COALESCE(utm_source, 'direct') as utm_source,
      COUNT(DISTINCT session_id) as source_count
    FROM analytics_sessions
    WHERE DATE(start_time) = target_date
      AND school_id = target_school_id
    GROUP BY utm_source
  ) traffic_stats;
  
  -- Inserir ou atualizar métricas
  INSERT INTO analytics_daily_metrics (
    school_id,
    date,
    total_users,
    active_users,
    new_users,
    sessions,
    page_views,
    unique_page_views,
    average_session_duration,
    bounce_rate,
    top_pages,
    top_events,
    device_breakdown,
    traffic_sources
  ) VALUES (
    target_school_id,
    target_date,
    total_users_count,
    active_users_count,
    new_users_count,
    sessions_count,
    page_views_count,
    unique_page_views_count,
    avg_session_duration,
    bounce_rate_value,
    top_pages_data,
    top_events_data,
    device_breakdown_data,
    traffic_sources_data
  )
  ON CONFLICT (school_id, date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    active_users = EXCLUDED.active_users,
    new_users = EXCLUDED.new_users,
    sessions = EXCLUDED.sessions,
    page_views = EXCLUDED.page_views,
    unique_page_views = EXCLUDED.unique_page_views,
    average_session_duration = EXCLUDED.average_session_duration,
    bounce_rate = EXCLUDED.bounce_rate,
    top_pages = EXCLUDED.top_pages,
    top_events = EXCLUDED.top_events,
    device_breakdown = EXCLUDED.device_breakdown,
    traffic_sources = EXCLUDED.traffic_sources,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para verificar alertas
CREATE OR REPLACE FUNCTION check_analytics_alerts()
RETURNS void AS $$
DECLARE
  alert_record RECORD;
  current_value DECIMAL(10,2);
  should_trigger BOOLEAN;
BEGIN
  FOR alert_record IN 
    SELECT * FROM analytics_alerts 
    WHERE is_active = true
  LOOP
    -- Calcular valor atual da métrica
    current_value := get_metric_value(
      alert_record.school_id,
      alert_record.metric_name,
      alert_record.comparison_period
    );
    
    -- Verificar se deve disparar alerta
    should_trigger := false;
    
    CASE alert_record.condition_type
      WHEN 'greater_than' THEN
        should_trigger := current_value > alert_record.threshold_value;
      WHEN 'less_than' THEN
        should_trigger := current_value < alert_record.threshold_value;
      WHEN 'equals' THEN
        should_trigger := current_value = alert_record.threshold_value;
      WHEN 'change_percent' THEN
        -- Implementar lógica de mudança percentual
        should_trigger := false; -- Placeholder
    END CASE;
    
    -- Se deve disparar e não foi disparado recentemente
    IF should_trigger AND (
      alert_record.last_triggered_at IS NULL OR
      alert_record.last_triggered_at < NOW() - INTERVAL '1 hour'
    ) THEN
      -- Registrar no histórico
      INSERT INTO analytics_alert_history (
        alert_id,
        metric_value,
        threshold_value,
        message
      ) VALUES (
        alert_record.id,
        current_value,
        alert_record.threshold_value,
        format('Alert "%s" triggered: %s %s %s (current: %s)',
          alert_record.name,
          alert_record.metric_name,
          alert_record.condition_type,
          alert_record.threshold_value,
          current_value
        )
      );
      
      -- Atualizar último disparo
      UPDATE analytics_alerts
      SET last_triggered_at = NOW()
      WHERE id = alert_record.id;
      
      -- Aqui seria enviada a notificação
      -- (integração com notification service)
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para obter valor de métrica
CREATE OR REPLACE FUNCTION get_metric_value(
  school_id UUID,
  metric_name VARCHAR(255),
  period_hours INTEGER
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  result DECIMAL(10,2) := 0;
BEGIN
  CASE metric_name
    WHEN 'active_users' THEN
      SELECT COUNT(DISTINCT user_id) INTO result
      FROM analytics_events
      WHERE analytics_events.school_id = get_metric_value.school_id
        AND timestamp >= NOW() - INTERVAL '1 hour' * period_hours
        AND user_id IS NOT NULL;
    
    WHEN 'page_views' THEN
      SELECT COUNT(*) INTO result
      FROM analytics_events
      WHERE analytics_events.school_id = get_metric_value.school_id
        AND timestamp >= NOW() - INTERVAL '1 hour' * period_hours
        AND category = 'PAGE_VIEW';
    
    WHEN 'error_rate' THEN
      WITH total_events AS (
        SELECT COUNT(*) as total
        FROM analytics_events
        WHERE analytics_events.school_id = get_metric_value.school_id
          AND timestamp >= NOW() - INTERVAL '1 hour' * period_hours
      ),
      error_events AS (
        SELECT COUNT(*) as errors
        FROM analytics_events
        WHERE analytics_events.school_id = get_metric_value.school_id
          AND timestamp >= NOW() - INTERVAL '1 hour' * period_hours
          AND category = 'ERROR'
      )
      SELECT CASE 
        WHEN total_events.total > 0 THEN 
          (error_events.errors::DECIMAL / total_events.total) * 100
        ELSE 0
      END INTO result
      FROM total_events, error_events;
    
    ELSE
      result := 0;
  END CASE;
  
  RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Função para criar configuração padrão de analytics
CREATE OR REPLACE FUNCTION create_default_analytics_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO analytics_configs (school_id)
  VALUES (NEW.id)
  ON CONFLICT (school_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar configuração padrão quando escola é criada
CREATE TRIGGER create_analytics_config_on_school_insert
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION create_default_analytics_config();

-- Políticas RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_alert_history ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics_events
CREATE POLICY "Users can view events from their school" ON analytics_events
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_schools 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Directors can view all events from their school" ON analytics_events
  FOR SELECT USING (
    school_id IN (
      SELECT us.school_id FROM user_schools us
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para analytics_sessions
CREATE POLICY "Users can view sessions from their school" ON analytics_sessions
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_schools 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sessions" ON analytics_sessions
  FOR ALL WITH CHECK (true);

-- Políticas para analytics_daily_metrics
CREATE POLICY "Users can view metrics from their school" ON analytics_daily_metrics
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_schools 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage metrics" ON analytics_daily_metrics
  FOR ALL WITH CHECK (true);

-- Políticas para analytics_funnels
CREATE POLICY "Users can view funnels from their school" ON analytics_funnels
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_schools 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage funnels" ON analytics_funnels
  FOR ALL USING (
    school_id IN (
      SELECT us.school_id FROM user_schools us
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para analytics_funnel_data
CREATE POLICY "Users can view funnel data from their school" ON analytics_funnel_data
  FOR SELECT USING (
    funnel_id IN (
      SELECT af.id FROM analytics_funnels af
      JOIN user_schools us ON us.school_id = af.school_id
      WHERE us.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert funnel data" ON analytics_funnel_data
  FOR INSERT WITH CHECK (true);

-- Políticas para analytics_configs
CREATE POLICY "Directors can manage analytics config" ON analytics_configs
  FOR ALL USING (
    school_id IN (
      SELECT us.school_id FROM user_schools us
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para analytics_alerts
CREATE POLICY "Users can view alerts from their school" ON analytics_alerts
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM user_schools 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directors can manage alerts" ON analytics_alerts
  FOR ALL USING (
    school_id IN (
      SELECT us.school_id FROM user_schools us
      JOIN users u ON u.id = us.user_id
      WHERE us.user_id = auth.uid() AND u.role = 'director'
    )
  );

-- Políticas para analytics_alert_history
CREATE POLICY "Users can view alert history from their school" ON analytics_alert_history
  FOR SELECT USING (
    alert_id IN (
      SELECT aa.id FROM analytics_alerts aa
      JOIN user_schools us ON us.school_id = aa.school_id
      WHERE us.user_id = auth.uid()
    )
  );

-- Comentários para documentação
COMMENT ON TABLE analytics_events IS 'Tabela para armazenar todos os eventos de analytics rastreados na aplicação';
COMMENT ON TABLE analytics_sessions IS 'Tabela para armazenar informações de sessões de usuário';
COMMENT ON TABLE analytics_daily_metrics IS 'Tabela para armazenar métricas agregadas diariamente';
COMMENT ON TABLE analytics_funnels IS 'Tabela para definir funis de conversão personalizados';
COMMENT ON TABLE analytics_funnel_data IS 'Tabela para armazenar dados de progresso dos usuários nos funis';
COMMENT ON TABLE analytics_configs IS 'Tabela para configurações de analytics por escola';
COMMENT ON TABLE analytics_alerts IS 'Tabela para definir alertas baseados em métricas';
COMMENT ON TABLE analytics_alert_history IS 'Tabela para histórico de alertas disparados';

COMMENT ON FUNCTION cleanup_old_analytics_data() IS 'Função para limpeza automática de dados antigos de analytics baseado na configuração de retenção';
COMMENT ON FUNCTION calculate_daily_metrics(DATE, UUID) IS 'Função para calcular e armazenar métricas diárias agregadas';
COMMENT ON FUNCTION check_analytics_alerts() IS 'Função para verificar e disparar alertas baseados em métricas';
COMMENT ON FUNCTION get_metric_value(UUID, VARCHAR, INTEGER) IS 'Função auxiliar para obter valor atual de uma métrica específica';