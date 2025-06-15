
-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

-- Criar políticas mais simples e funcionais para conversations
CREATE POLICY "Allow authenticated users to create conversations" 
  ON public.conversations 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view conversations they participate in" 
  ON public.conversations 
  FOR SELECT 
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to update conversations they participate in" 
  ON public.conversations 
  FOR UPDATE 
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- Criar políticas para conversation_participants
CREATE POLICY "Allow authenticated users to create participants" 
  ON public.conversation_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view participants in their conversations" 
  ON public.conversation_participants 
  FOR SELECT 
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to update their own participation" 
  ON public.conversation_participants 
  FOR UPDATE 
  TO authenticated
  USING (profile_id = auth.uid());

-- Criar políticas para messages
CREATE POLICY "Allow users to send messages to their conversations" 
  ON public.messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to view messages from their conversations" 
  ON public.messages 
  FOR SELECT 
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE profile_id = auth.uid()
    )
  );

-- Criar políticas para polls
CREATE POLICY "Allow authenticated users to create polls" 
  ON public.polls 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view polls" 
  ON public.polls 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Criar políticas para poll_options
CREATE POLICY "Allow authenticated users to create poll options" 
  ON public.poll_options 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view poll options" 
  ON public.poll_options 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Criar políticas para poll_votes
CREATE POLICY "Allow authenticated users to vote" 
  ON public.poll_votes 
  FOR INSERT 
  TO authenticated
  WITH CHECK (voter_profile_id = auth.uid());

CREATE POLICY "Allow authenticated users to view votes" 
  ON public.poll_votes 
  FOR SELECT 
  TO authenticated
  USING (true);
