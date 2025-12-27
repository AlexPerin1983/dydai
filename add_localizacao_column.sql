-- Adicionar coluna localizacao na tabela bobinas
ALTER TABLE bobinas ADD COLUMN IF NOT EXISTS localizacao TEXT;

-- Atualizar a view ou permissões se necessário (geralmente não precisa se for RLS padrão)
-- Mas para garantir que a coluna seja acessível publicamente se houver políticas específicas:
-- (Assumindo que a leitura pública já está configurada para a tabela, a nova coluna herdará)
