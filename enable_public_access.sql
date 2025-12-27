-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE bobinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retalhos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (anon) na tabela bobinas
CREATE POLICY "Public read access" ON bobinas
FOR SELECT
TO anon
USING (true);

-- Política para permitir leitura pública (anon) na tabela retalhos
CREATE POLICY "Public read access" ON retalhos
FOR SELECT
TO anon
USING (true);

-- Garantir que a coluna localizacao existe (caso não tenha rodado antes)
ALTER TABLE bobinas ADD COLUMN IF NOT EXISTS localizacao TEXT;
