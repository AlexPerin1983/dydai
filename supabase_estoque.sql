-- =====================================================
-- CONTROLE DE ESTOQUE - PELÍCULAS BR
-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/avlefzsipbqvollukgyt/sql/new
-- =====================================================

-- =====================================================
-- 1. TABELA BOBINAS
-- =====================================================
CREATE TABLE IF NOT EXISTS bobinas (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    film_id text NOT NULL, -- Nome da película (referência)
    codigo_qr text UNIQUE NOT NULL, -- Código único para QR Code
    largura_cm numeric NOT NULL, -- Largura da bobina em cm
    comprimento_total_m numeric NOT NULL, -- Comprimento total em metros
    comprimento_restante_m numeric NOT NULL, -- Comprimento restante em metros
    custo_total numeric, -- Custo total da bobina
    fornecedor text,
    lote text, -- Lote do fabricante
    data_cadastro timestamptz DEFAULT now(),
    data_ultima_atualizacao timestamptz DEFAULT now(),
    status text DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada', 'descartada')),
    observacao text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bobinas_user_id ON bobinas(user_id);
CREATE INDEX IF NOT EXISTS idx_bobinas_film_id ON bobinas(film_id);
CREATE INDEX IF NOT EXISTS idx_bobinas_codigo_qr ON bobinas(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_bobinas_status ON bobinas(status);

-- =====================================================
-- 2. TABELA RETALHOS
-- =====================================================
CREATE TABLE IF NOT EXISTS retalhos (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bobina_id bigint REFERENCES bobinas(id) ON DELETE SET NULL, -- Pode ser null se retalho avulso
    film_id text NOT NULL, -- Nome da película
    codigo_qr text UNIQUE NOT NULL, -- Código único para QR Code
    largura_cm numeric NOT NULL, -- Largura em cm
    comprimento_cm numeric NOT NULL, -- Comprimento em cm
    area_m2 numeric GENERATED ALWAYS AS ((largura_cm * comprimento_cm) / 10000) STORED, -- Área calculada
    data_cadastro timestamptz DEFAULT now(),
    data_utilizacao timestamptz, -- Data em que foi usado
    status text DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'usado', 'descartado')),
    localizacao text, -- Onde está armazenado
    observacao text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_retalhos_user_id ON retalhos(user_id);
CREATE INDEX IF NOT EXISTS idx_retalhos_bobina_id ON retalhos(bobina_id);
CREATE INDEX IF NOT EXISTS idx_retalhos_film_id ON retalhos(film_id);
CREATE INDEX IF NOT EXISTS idx_retalhos_codigo_qr ON retalhos(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_retalhos_status ON retalhos(status);

-- =====================================================
-- 3. TABELA CONSUMOS (Histórico de uso)
-- =====================================================
CREATE TABLE IF NOT EXISTS consumos (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bobina_id bigint REFERENCES bobinas(id) ON DELETE SET NULL,
    retalho_id bigint REFERENCES retalhos(id) ON DELETE SET NULL,
    client_id bigint, -- ID do cliente (opcional)
    client_name text, -- Nome do cliente
    pdf_id bigint, -- ID do PDF/proposta (opcional)
    metros_consumidos numeric NOT NULL,
    largura_corte_cm numeric, -- Largura do corte
    comprimento_corte_cm numeric, -- Comprimento do corte
    area_m2 numeric, -- Área consumida
    data_consumo timestamptz DEFAULT now(),
    tipo text DEFAULT 'corte' CHECK (tipo IN ('corte', 'perda', 'amostra', 'descarte')),
    observacao text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_consumos_user_id ON consumos(user_id);
CREATE INDEX IF NOT EXISTS idx_consumos_bobina_id ON consumos(bobina_id);
CREATE INDEX IF NOT EXISTS idx_consumos_client_id ON consumos(client_id);
CREATE INDEX IF NOT EXISTS idx_consumos_data ON consumos(data_consumo);

-- =====================================================
-- 4. HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE bobinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retalhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. POLÍTICAS RLS PARA BOBINAS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own bobinas" ON bobinas;
DROP POLICY IF EXISTS "Users can insert their own bobinas" ON bobinas;
DROP POLICY IF EXISTS "Users can update their own bobinas" ON bobinas;
DROP POLICY IF EXISTS "Users can delete their own bobinas" ON bobinas;

CREATE POLICY "Users can view their own bobinas" ON bobinas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bobinas" ON bobinas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bobinas" ON bobinas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bobinas" ON bobinas FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. POLÍTICAS RLS PARA RETALHOS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own retalhos" ON retalhos;
DROP POLICY IF EXISTS "Users can insert their own retalhos" ON retalhos;
DROP POLICY IF EXISTS "Users can update their own retalhos" ON retalhos;
DROP POLICY IF EXISTS "Users can delete their own retalhos" ON retalhos;

CREATE POLICY "Users can view their own retalhos" ON retalhos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own retalhos" ON retalhos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own retalhos" ON retalhos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own retalhos" ON retalhos FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. POLÍTICAS RLS PARA CONSUMOS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own consumos" ON consumos;
DROP POLICY IF EXISTS "Users can insert their own consumos" ON consumos;
DROP POLICY IF EXISTS "Users can update their own consumos" ON consumos;
DROP POLICY IF EXISTS "Users can delete their own consumos" ON consumos;

CREATE POLICY "Users can view their own consumos" ON consumos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own consumos" ON consumos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consumos" ON consumos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own consumos" ON consumos FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. FUNÇÃO PARA ATUALIZAR ESTOQUE AO REGISTRAR CONSUMO
-- =====================================================
CREATE OR REPLACE FUNCTION atualizar_estoque_bobina()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza o comprimento restante da bobina
    IF NEW.bobina_id IS NOT NULL THEN
        UPDATE bobinas 
        SET 
            comprimento_restante_m = comprimento_restante_m - NEW.metros_consumidos,
            data_ultima_atualizacao = now(),
            status = CASE 
                WHEN comprimento_restante_m - NEW.metros_consumidos <= 0 THEN 'finalizada'
                ELSE status
            END
        WHERE id = NEW.bobina_id;
    END IF;
    
    -- Se usou um retalho, marca como usado
    IF NEW.retalho_id IS NOT NULL THEN
        UPDATE retalhos
        SET 
            status = 'usado',
            data_utilizacao = now()
        WHERE id = NEW.retalho_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_estoque ON consumos;
CREATE TRIGGER trigger_atualizar_estoque
    AFTER INSERT ON consumos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_estoque_bobina();
