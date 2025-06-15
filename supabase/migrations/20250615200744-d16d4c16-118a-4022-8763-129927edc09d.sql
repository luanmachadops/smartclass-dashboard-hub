
-- Remover políticas antigas e problemáticas
DROP POLICY IF EXISTS "Allow users to view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Allow users to update conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Allow users to view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow users to send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow users to view messages from their conversations" ON public.messages;

-- Recriar políticas usando a função 'user_can_access_conversation' para evitar recursão

-- Políticas para a tabela 'conversations'
CREATE POLICY "Allow users to view conversations they participate in" 
  ON public.conversations 
  FOR SELECT 
  TO authenticated
  USING (public.user_can_access_conversation(id));

CREATE POLICY "Allow users to update conversations they participate in" 
  ON public.conversations 
  FOR UPDATE 
  TO authenticated
  USING (public.user_can_access_conversation(id));

-- Política para a tabela 'conversation_participants'
CREATE POLICY "Allow users to view participants in their conversations" 
  ON public.conversation_participants 
  FOR SELECT 
  TO authenticated
  USING (public.user_can_access_conversation(conversation_id));

-- Políticas para a tabela 'messages'
CREATE POLICY "Allow users to send messages to their conversations" 
  ON public.messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (public.user_can_access_conversation(conversation_id));

CREATE POLICY "Allow users to view messages from their conversations" 
  ON public.messages 
  FOR SELECT 
  TO authenticated
  USING (public.user_can_access_conversation(conversation_id));
