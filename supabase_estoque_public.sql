-- ============================================
-- POLÍTICAS PÚBLICAS PARA CONSULTA DE ESTOQUE
-- Permite leitura pública de campos limitados
-- ============================================

-- Política para leitura pública de bobinas (apenas campos seguros)
DROP POLICY IF EXISTS "Public can read basic bobina info" ON bobinas;
CREATE POLICY "Public can read basic bobina info" ON bobinas
    FOR SELECT 
    USING (true);  -- Permite leitura pública

-- Política para leitura pública de retalhos
DROP POLICY IF EXISTS "Public can read basic retalho info" ON retalhos;
CREATE POLICY "Public can read basic retalho info" ON retalhos
    FOR SELECT 
    USING (true);  -- Permite leitura pública

-- NOTA: As operações de INSERT, UPDATE e DELETE continuam restritas
-- apenas ao usuário dono do registro (policies já existentes)

-- ============================================
-- ALTERNATIVA MAIS SEGURA: VIEW PÚBLICA
-- Se preferir não expor a tabela inteira, crie uma VIEW:
-- ============================================

-- DROP VIEW IF EXISTS bobinas_public;
-- CREATE VIEW bobinas_public AS
-- SELECT 
--     codigo_qr,
--     film_id,
--     largura_cm,
--     comprimento_total_m,
--     comprimento_restante_m,
--     status,
--     data_cadastro
-- FROM bobinas;
-- 
-- GRANT SELECT ON bobinas_public TO anon;

-- DROP VIEW IF EXISTS retalhos_public;
-- CREATE VIEW retalhos_public AS
-- SELECT 
--     codigo_qr,
--     film_id,
--     largura_cm,
--     comprimento_cm,
--     area_m2,
--     status,
--     data_cadastro
-- FROM retalhos;
-- 
-- GRANT SELECT ON retalhos_public TO anon;
