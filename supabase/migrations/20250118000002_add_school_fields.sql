-- Adiciona campos extras à tabela schools para dados completos da escola
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Adiciona comentários para documentar os campos
COMMENT ON COLUMN public.schools.cnpj IS 'CNPJ da escola no formato 00.000.000/0000-00';
COMMENT ON COLUMN public.schools.telefone IS 'Telefone de contato da escola';
COMMENT ON COLUMN public.schools.cep IS 'CEP da escola no formato 00000-000';
COMMENT ON COLUMN public.schools.logradouro IS 'Endereço da escola (rua, avenida, etc.)';
COMMENT ON COLUMN public.schools.numero IS 'Número do endereço da escola';
COMMENT ON COLUMN public.schools.bairro IS 'Bairro da escola';
COMMENT ON COLUMN public.schools.cidade IS 'Cidade da escola';
COMMENT ON COLUMN public.schools.estado IS 'Estado da escola (sigla de 2 letras)';