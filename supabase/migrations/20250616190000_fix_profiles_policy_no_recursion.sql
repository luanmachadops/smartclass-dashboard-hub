-- Remove todas as policies de SELECT problemáticas
DROP POLICY IF EXISTS "Visualizar perfis da escola" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver perfis da mesma escola" ON profiles;

-- Permitir apenas SELECT do próprio perfil
CREATE POLICY "Usuário pode ver apenas seu próprio perfil"
ON profiles FOR SELECT
TO public
USING (id = auth.uid());

-- Permitir UPDATE apenas do próprio perfil
DROP POLICY IF EXISTS "Atualizar próprio perfil" ON profiles;
CREATE POLICY "Usuário pode atualizar apenas seu próprio perfil"
ON profiles FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
