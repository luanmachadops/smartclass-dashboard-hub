-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'FAILURE', 'PARTIAL', 'BLOCKED')),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  target_id TEXT,
  target_type TEXT,
  description TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  duration INTEGER, -- em millisegundos
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_search ON audit_logs USING gin(to_tsvector('portuguese', description));

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school_timestamp ON audit_logs(school_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_timestamp ON audit_logs(severity, timestamp DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_updated_at();

-- Função para limpeza automática de logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days
    AND severity NOT IN ('HIGH', 'CRITICAL'); -- Manter logs críticos por mais tempo
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da operação de limpeza
  INSERT INTO audit_logs (action, result, severity, description, details)
  VALUES (
    'SYSTEM_MAINTENANCE',
    'SUCCESS',
    'LOW',
    'Automatic cleanup of old audit logs',
    jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para estatísticas de auditoria
CREATE OR REPLACE FUNCTION get_audit_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW(),
  school_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  total_entries BIGINT,
  success_rate NUMERIC,
  failure_rate NUMERIC,
  critical_incidents BIGINT,
  top_actions JSONB,
  top_users JSONB,
  hourly_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE result = 'SUCCESS') as successes,
      COUNT(*) FILTER (WHERE result = 'FAILURE') as failures,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count
    FROM audit_logs 
    WHERE timestamp BETWEEN start_date AND end_date
      AND (school_filter IS NULL OR school_id = school_filter)
  ),
  action_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'action', action,
        'count', count
      ) ORDER BY count DESC
    ) as actions
    FROM (
      SELECT action, COUNT(*) as count
      FROM audit_logs 
      WHERE timestamp BETWEEN start_date AND end_date
        AND (school_filter IS NULL OR school_id = school_filter)
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    ) t
  ),
  user_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', user_id,
        'count', count
      ) ORDER BY count DESC
    ) as users
    FROM (
      SELECT user_id, COUNT(*) as count
      FROM audit_logs 
      WHERE timestamp BETWEEN start_date AND end_date
        AND (school_filter IS NULL OR school_id = school_filter)
        AND user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    ) t
  ),
  hourly_stats AS (
    SELECT jsonb_object_agg(
      EXTRACT(hour FROM timestamp)::text,
      count
    ) as hourly
    FROM (
      SELECT 
        EXTRACT(hour FROM timestamp) as hour,
        COUNT(*) as count
      FROM audit_logs 
      WHERE timestamp BETWEEN start_date AND end_date
        AND (school_filter IS NULL OR school_id = school_filter)
      GROUP BY EXTRACT(hour FROM timestamp)
      ORDER BY hour
    ) t
  )
  SELECT 
    s.total,
    CASE WHEN s.total > 0 THEN ROUND((s.successes::NUMERIC / s.total) * 100, 2) ELSE 0 END,
    CASE WHEN s.total > 0 THEN ROUND((s.failures::NUMERIC / s.total) * 100, 2) ELSE 0 END,
    s.critical_count,
    COALESCE(a.actions, '[]'::jsonb),
    COALESCE(u.users, '[]'::jsonb),
    COALESCE(h.hourly, '{}'::jsonb)
  FROM stats s
  CROSS JOIN action_stats a
  CROSS JOIN user_stats u
  CROSS JOIN hourly_stats h;
END;
$$ LANGUAGE plpgsql;

-- Função para detectar atividades suspeitas
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE (
  user_id UUID,
  suspicious_patterns JSONB,
  risk_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH user_activity AS (
    SELECT 
      al.user_id,
      COUNT(*) as total_actions,
      COUNT(*) FILTER (WHERE result = 'FAILURE') as failures,
      COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_actions,
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(DISTINCT session_id) as unique_sessions,
      array_agg(DISTINCT action) as actions,
      MIN(timestamp) as first_action,
      MAX(timestamp) as last_action
    FROM audit_logs al
    WHERE al.timestamp > NOW() - INTERVAL '24 hours'
      AND al.user_id IS NOT NULL
    GROUP BY al.user_id
  )
  SELECT 
    ua.user_id,
    jsonb_build_object(
      'high_failure_rate', (ua.failures::FLOAT / ua.total_actions) > 0.5,
      'multiple_ips', ua.unique_ips > 3,
      'rapid_actions', ua.total_actions > 100,
      'critical_actions', ua.critical_actions > 0,
      'short_timespan', EXTRACT(EPOCH FROM (ua.last_action - ua.first_action)) < 300
    ) as patterns,
    (
      CASE WHEN (ua.failures::FLOAT / ua.total_actions) > 0.5 THEN 30 ELSE 0 END +
      CASE WHEN ua.unique_ips > 3 THEN 25 ELSE 0 END +
      CASE WHEN ua.total_actions > 100 THEN 20 ELSE 0 END +
      CASE WHEN ua.critical_actions > 0 THEN 40 ELSE 0 END +
      CASE WHEN EXTRACT(EPOCH FROM (ua.last_action - ua.first_action)) < 300 THEN 15 ELSE 0 END
    ) as score
  FROM user_activity ua
  WHERE (
    (ua.failures::FLOAT / ua.total_actions) > 0.3 OR
    ua.unique_ips > 2 OR
    ua.total_actions > 50 OR
    ua.critical_actions > 0
  )
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS para audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para administradores da escola verem apenas logs da sua escola
CREATE POLICY "Users can view audit logs from their school" ON audit_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'user_role' = 'diretor' AND
    school_id = (auth.jwt() ->> 'school_id')::UUID
  );

-- Política para inserção de logs (permitir para todos os usuários autenticados)
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política para super administradores verem todos os logs
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
  FOR ALL
  USING (auth.jwt() ->> 'user_role' = 'super_admin');

-- Função para registrar login/logout automaticamente
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log de login
  IF TG_OP = 'UPDATE' AND OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
    INSERT INTO audit_logs (action, result, severity, user_id, description)
    VALUES (
      'LOGIN',
      'SUCCESS',
      'LOW',
      NEW.id,
      'User logged in successfully'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para capturar eventos de autenticação
CREATE TRIGGER trigger_log_auth_events
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION log_auth_event();

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Tabela para armazenar logs de auditoria do sistema';
COMMENT ON COLUMN audit_logs.action IS 'Ação realizada (LOGIN, LOGOUT, USER_CREATE, etc.)';
COMMENT ON COLUMN audit_logs.result IS 'Resultado da ação (SUCCESS, FAILURE, PARTIAL, BLOCKED)';
COMMENT ON COLUMN audit_logs.severity IS 'Severidade do evento (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN audit_logs.target_id IS 'ID do recurso afetado pela ação';
COMMENT ON COLUMN audit_logs.target_type IS 'Tipo do recurso afetado (user, school, student, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes adicionais da ação em formato JSON';
COMMENT ON COLUMN audit_logs.duration IS 'Duração da operação em millisegundos';
COMMENT ON COLUMN audit_logs.metadata IS 'Metadados adicionais em formato JSON';

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Função para limpeza automática de logs antigos';
COMMENT ON FUNCTION get_audit_stats IS 'Função para obter estatísticas de auditoria';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Função para detectar atividades suspeitas';