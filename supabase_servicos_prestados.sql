-- ============================================
-- TABELA: servicos_prestados
-- Sistema de QR Code para serviços de película
-- ============================================

-- Criar tabela de serviços prestados
CREATE TABLE IF NOT EXISTS servicos_prestados (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo_qr TEXT NOT NULL UNIQUE,
    
    -- Dados do cliente/local
    cliente_nome TEXT NOT NULL,
    endereco TEXT,
    cidade TEXT,
    uf TEXT,
    tipo_local TEXT, -- 'residencial', 'comercial', 'condominio', 'empresa', 'outros'
    
    -- Dados do serviço
    filme_aplicado TEXT NOT NULL,
    filme_detalhes JSONB, -- { uv, ir, garantiaFabricante, garantiaMaoDeObra, espessura, etc }
    metros_aplicados NUMERIC(10,2),
    data_servico TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observacoes TEXT,
    
    -- Dados da empresa (snapshot no momento do cadastro)
    empresa_nome TEXT NOT NULL,
    empresa_telefone TEXT,
    empresa_email TEXT,
    empresa_site TEXT,
    empresa_endereco TEXT,
    empresa_logo TEXT, -- Base64
    empresa_cores JSONB, -- { primaria, secundaria }
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_servicos_prestados_user_id ON servicos_prestados(user_id);
CREATE INDEX IF NOT EXISTS idx_servicos_prestados_codigo_qr ON servicos_prestados(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_servicos_prestados_data_servico ON servicos_prestados(data_servico DESC);

-- Habilitar RLS
ALTER TABLE servicos_prestados ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver/editar apenas seus próprios serviços
CREATE POLICY "servicos_prestados_user_policy" ON servicos_prestados
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: LEITURA PÚBLICA para o QR Code funcionar
-- Qualquer pessoa pode ler serviços pelo codigo_qr
CREATE POLICY "servicos_prestados_public_read" ON servicos_prestados
    FOR SELECT
    USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_servicos_prestados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_servicos_prestados_updated_at
    BEFORE UPDATE ON servicos_prestados
    FOR EACH ROW
    EXECUTE FUNCTION update_servicos_prestados_updated_at();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Após rodar este script, verifique se a tabela foi criada:
-- SELECT * FROM servicos_prestados LIMIT 1;
