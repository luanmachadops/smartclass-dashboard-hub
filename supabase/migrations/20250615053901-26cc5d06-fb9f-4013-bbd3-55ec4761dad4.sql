
-- Criar tabela de conversas
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    is_group_chat BOOLEAN DEFAULT false,
    group_chat_class_id UUID REFERENCES turmas(id),
    school_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de participantes das conversas
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(conversation_id, profile_id)
);

-- Criar tabela de mensagens
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_profile_id UUID NOT NULL,
    text_content TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'document', 'audio', 'poll')),
    attachment_file_name TEXT,
    attachment_file_url TEXT,
    poll_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de enquetes
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    school_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de opções das enquetes
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de votos nas enquetes
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    voter_profile_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(poll_option_id, voter_profile_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversations they participate in" ON conversations
    FOR UPDATE USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE profile_id = auth.uid()
        )
    );

-- Políticas RLS para conversation_participants
CREATE POLICY "Users can view participants of conversations they're in" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own participation" ON conversation_participants
    FOR UPDATE USING (profile_id = auth.uid());

-- Políticas RLS para messages
CREATE POLICY "Users can view messages from conversations they participate in" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to conversations they participate in" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE profile_id = auth.uid()
        )
    );

-- Políticas RLS para polls
CREATE POLICY "Users can view polls from their school" ON polls
    FOR SELECT USING (true);

CREATE POLICY "Users can create polls" ON polls
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para poll_options
CREATE POLICY "Users can view poll options" ON poll_options
    FOR SELECT USING (true);

CREATE POLICY "Users can create poll options" ON poll_options
    FOR INSERT WITH CHECK (true);

-- Políticas RLS para poll_votes
CREATE POLICY "Users can view poll votes" ON poll_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote on polls" ON poll_votes
    FOR INSERT WITH CHECK (voter_profile_id = auth.uid());

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket de storage para anexos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true);

-- Política de storage para anexos
CREATE POLICY "Users can upload chat attachments" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Users can view chat attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their own chat attachments" ON storage.objects
    FOR DELETE USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
