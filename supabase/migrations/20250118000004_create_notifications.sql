-- Criação das tabelas para o sistema de notificações

-- Enum para tipos de notificação
CREATE TYPE notification_type AS ENUM (
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
  'PAYMENT',
  'ATTENDANCE',
  'GRADE',
  'SCHEDULE',
  'SYSTEM',
  'SECURITY',
  'REMINDER',
  'ANNOUNCEMENT'
);

-- Enum para prioridade de notificação
CREATE TYPE notification_priority AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- Enum para frequência de notificação
CREATE TYPE notification_frequency AS ENUM (
  'IMMEDIATE',
  'HOURLY',
  'DAILY',
  'WEEKLY'
);

-- Tabela principal de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'INFO',
  priority notification_priority NOT NULL DEFAULT 'NORMAL',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de preferências de notificação
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email BOOLEAN NOT NULL DEFAULT TRUE,
  push BOOLEAN NOT NULL DEFAULT TRUE,
  in_app BOOLEAN NOT NULL DEFAULT TRUE,
  sms BOOLEAN NOT NULL DEFAULT FALSE,
  types JSONB DEFAULT '{}', -- Preferências por tipo de notificação
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "08:00"}',
  frequency notification_frequency NOT NULL DEFAULT 'IMMEDIATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de templates de notificação
CREATE TABLE notification_templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL para templates globais
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de envio de notificações
CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'email', 'push', 'sms', 'in_app', 'realtime'
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ'
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Índices para otimização de performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_school_id ON notifications(school_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_enabled ON notification_templates(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_notification_templates_school_id ON notification_templates(school_id);

CREATE INDEX idx_notification_delivery_log_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX idx_notification_delivery_log_channel ON notification_delivery_log(channel);
CREATE INDEX idx_notification_delivery_log_status ON notification_delivery_log(status);
CREATE INDEX idx_notification_delivery_log_created_at ON notification_delivery_log(created_at DESC);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = TRUE;

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_delivery_log_updated_at
  BEFORE UPDATE ON notification_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar notificações expiradas
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO audit_logs (action, result, severity, details, metadata)
  VALUES (
    'SYSTEM_CLEANUP',
    'SUCCESS',
    'LOW',
    'Expired notifications cleanup completed',
    jsonb_build_object('deleted_count', deleted_count)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar logs de entrega antigos
CREATE OR REPLACE FUNCTION cleanup_old_delivery_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar logs de entrega antigos
  DELETE FROM notification_delivery_log 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO audit_logs (action, result, severity, details, metadata)
  VALUES (
    'SYSTEM_CLEANUP',
    'SUCCESS',
    'LOW',
    'Old delivery logs cleanup completed',
    jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days)
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de notificações
CREATE OR REPLACE FUNCTION get_notification_stats(
  p_user_id UUID DEFAULT NULL,
  p_school_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  base_query TEXT;
BEGIN
  -- Construir query base
  base_query := 'FROM notifications WHERE created_at BETWEEN $3 AND $4';
  
  IF p_user_id IS NOT NULL THEN
    base_query := base_query || ' AND user_id = $1';
  END IF;
  
  IF p_school_id IS NOT NULL THEN
    base_query := base_query || ' AND school_id = $2';
  END IF;
  
  -- Executar queries para estatísticas
  EXECUTE format('
    SELECT jsonb_build_object(
      ''total'', COUNT(*),
      ''unread'', COUNT(*) FILTER (WHERE read = FALSE),
      ''by_type'', jsonb_object_agg(type, type_count),
      ''by_priority'', jsonb_object_agg(priority, priority_count),
      ''delivery_rate'', ROUND(
        (COUNT(*) FILTER (WHERE id IN (
          SELECT notification_id FROM notification_delivery_log 
          WHERE status = ''DELIVERED''
        )) * 100.0 / NULLIF(COUNT(*), 0)), 2
      )
    )
    FROM (
      SELECT 
        type,
        priority,
        read,
        id,
        COUNT(*) OVER (PARTITION BY type) as type_count,
        COUNT(*) OVER (PARTITION BY priority) as priority_count
      %s
    ) stats', base_query)
  INTO result
  USING p_user_id, p_school_id, p_start_date, p_end_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar notificação em lote
CREATE OR REPLACE FUNCTION create_bulk_notifications(
  p_notifications JSONB
)
RETURNS JSONB AS $$
DECLARE
  notification JSONB;
  created_ids UUID[] := '{}';
  notification_id UUID;
BEGIN
  -- Iterar sobre as notificações
  FOR notification IN SELECT * FROM jsonb_array_elements(p_notifications)
  LOOP
    -- Inserir notificação
    INSERT INTO notifications (
      title,
      message,
      type,
      priority,
      user_id,
      school_id,
      data,
      actions,
      expires_at
    )
    VALUES (
      notification->>'title',
      notification->>'message',
      (notification->>'type')::notification_type,
      COALESCE((notification->>'priority')::notification_priority, 'NORMAL'),
      (notification->>'user_id')::UUID,
      (notification->>'school_id')::UUID,
      COALESCE(notification->'data', '{}'),
      COALESCE(notification->'actions', '[]'),
      (notification->>'expires_at')::TIMESTAMPTZ
    )
    RETURNING id INTO notification_id;
    
    created_ids := array_append(created_ids, notification_id);
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'created_count', array_length(created_ids, 1),
    'created_ids', to_jsonb(created_ids)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificações como lidas em lote
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Marcar todas as notificações do usuário como lidas
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = p_user_id AND read = FALSE;
  ELSE
    -- Marcar notificações específicas como lidas
    UPDATE notifications 
    SET read = TRUE 
    WHERE user_id = p_user_id 
      AND id = ANY(p_notification_ids) 
      AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM school_users 
      WHERE school_id = notifications.school_id 
        AND role IN ('DIRECTOR', 'ADMIN')
    )
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Controlado pela aplicação

CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM school_users 
      WHERE role = 'SUPER_ADMIN'
    )
  );

-- Políticas para notification_preferences
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para notification_templates
CREATE POLICY "Users can view templates" ON notification_templates
  FOR SELECT USING (
    school_id IS NULL OR
    auth.uid() IN (
      SELECT user_id FROM school_users 
      WHERE school_id = notification_templates.school_id
    )
  );

CREATE POLICY "Admins can manage templates" ON notification_templates
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM school_users 
      WHERE (school_id = notification_templates.school_id AND role IN ('DIRECTOR', 'ADMIN'))
        OR role = 'SUPER_ADMIN'
    )
  );

-- Políticas para notification_delivery_log
CREATE POLICY "Users can view their delivery logs" ON notification_delivery_log
  FOR SELECT USING (
    notification_id IN (
      SELECT id FROM notifications WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage delivery logs" ON notification_delivery_log
  FOR ALL USING (true); -- Controlado pela aplicação

-- Políticas para push_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserir templates padrão
INSERT INTO notification_templates (id, name, type, title, message, variables) VALUES
('payment_due', 'Pagamento Vencendo', 'PAYMENT', 'Pagamento Vencendo', 'Sua mensalidade de {{month}} vence em {{days}} dias. Valor: R$ {{amount}}', ARRAY['month', 'days', 'amount']),
('payment_overdue', 'Pagamento em Atraso', 'PAYMENT', 'Pagamento em Atraso', 'Sua mensalidade de {{month}} está em atraso há {{days}} dias. Valor: R$ {{amount}}', ARRAY['month', 'days', 'amount']),
('class_reminder', 'Lembrete de Aula', 'REMINDER', 'Aula em {{time}}', 'Você tem aula de {{subject}} com {{teacher}} em {{time}}', ARRAY['time', 'subject', 'teacher']),
('grade_posted', 'Nova Nota', 'GRADE', 'Nova Nota Disponível', 'Nova nota em {{subject}}: {{grade}}. {{comment}}', ARRAY['subject', 'grade', 'comment']),
('attendance_alert', 'Alerta de Frequência', 'ATTENDANCE', 'Alerta de Frequência', 'Frequência baixa em {{subject}}: {{percentage}}%. Mínimo exigido: {{minimum}}%', ARRAY['subject', 'percentage', 'minimum']),
('system_maintenance', 'Manutenção do Sistema', 'SYSTEM', 'Manutenção Programada', 'O sistema estará em manutenção de {{start}} até {{end}}. {{details}}', ARRAY['start', 'end', 'details']),
('security_alert', 'Alerta de Segurança', 'SECURITY', 'Alerta de Segurança', 'Atividade suspeita detectada: {{activity}}. {{action}}', ARRAY['activity', 'action']),
('welcome', 'Boas-vindas', 'INFO', 'Bem-vindo ao SmartClass!', 'Olá {{name}}! Seja bem-vindo ao SmartClass Dashboard. Sua conta foi criada com sucesso.', ARRAY['name']),
('password_reset', 'Redefinição de Senha', 'SECURITY', 'Solicitação de Redefinição de Senha', 'Uma solicitação de redefinição de senha foi feita para sua conta. Se não foi você, ignore este email.', ARRAY[]),
('new_message', 'Nova Mensagem', 'INFO', 'Nova Mensagem de {{sender}}', 'Você recebeu uma nova mensagem de {{sender}}: {{preview}}', ARRAY['sender', 'preview']);

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Tabela principal para armazenar todas as notificações do sistema';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação por usuário';
COMMENT ON TABLE notification_templates IS 'Templates reutilizáveis para notificações';
COMMENT ON TABLE notification_delivery_log IS 'Log de entrega de notificações por canal';
COMMENT ON TABLE push_subscriptions IS 'Subscriptions para push notifications';

COMMENT ON FUNCTION cleanup_expired_notifications() IS 'Remove notificações expiradas automaticamente';
COMMENT ON FUNCTION cleanup_old_delivery_logs(INTEGER) IS 'Remove logs de entrega antigos baseado no período de retenção';
COMMENT ON FUNCTION get_notification_stats(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Retorna estatísticas detalhadas de notificações';
COMMENT ON FUNCTION create_bulk_notifications(JSONB) IS 'Cria múltiplas notificações em uma única operação';
COMMENT ON FUNCTION mark_notifications_read(UUID, UUID[]) IS 'Marca notificações como lidas em lote';