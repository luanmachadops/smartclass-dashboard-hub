-- Drop existing policies
DROP POLICY IF EXISTS "Visualizar perfis da escola" ON profiles;
DROP POLICY IF EXISTS "Atualizar próprio perfil" ON profiles;

-- Create new policies
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON profiles FOR SELECT
TO public
USING (
  id = auth.uid()
);

CREATE POLICY "Usuários podem ver perfis da mesma escola"
ON profiles FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM profiles self 
    WHERE self.id = auth.uid() 
    AND self.school_id = profiles.school_id
  )
);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
