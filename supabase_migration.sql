-- =====================================================
-- MIGRAÇÃO DO BANCO DE DADOS - PELÍCULAS BR
-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/avlefzsipbqvollukgyt/sql/new
-- =====================================================

-- =====================================================
-- 1. TABELA CLIENTS - Adicionar colunas que faltam
-- =====================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS logradouro text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS uf text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_updated timestamptz DEFAULT now();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

-- Migrar dados antigos (se houver colunas nome/telefone)
UPDATE clients SET name = nome WHERE name IS NULL AND nome IS NOT NULL;
UPDATE clients SET phone = telefone WHERE phone IS NULL AND telefone IS NOT NULL;

-- =====================================================
-- 2. TABELA FILMS - Adicionar colunas que faltam
-- =====================================================
ALTER TABLE films ADD COLUMN IF NOT EXISTS preco_metro_linear numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS mao_de_obra numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS garantia_fabricante integer;
ALTER TABLE films ADD COLUMN IF NOT EXISTS garantia_mao_de_obra integer;
ALTER TABLE films ADD COLUMN IF NOT EXISTS uv numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS ir numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS vtl numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS espessura numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS tser numeric;
ALTER TABLE films ADD COLUMN IF NOT EXISTS imagens text[];
ALTER TABLE films ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE films ADD COLUMN IF NOT EXISTS pinned_at timestamptz;
ALTER TABLE films ADD COLUMN IF NOT EXISTS custom_fields jsonb;

-- =====================================================
-- 3. TABELA USER_INFO - Adicionar colunas que faltam
-- =====================================================
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS empresa text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS site text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS logo text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS assinatura text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS cores jsonb;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS payment_methods jsonb;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS proposal_validity_days integer;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS prazo_pagamento text;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS working_hours jsonb;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS employees jsonb;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS ai_config jsonb;
ALTER TABLE user_info ADD COLUMN IF NOT EXISTS last_selected_client_id integer;

-- =====================================================
-- 4. TABELA PROPOSAL_OPTIONS - Adicionar colunas que faltam
-- =====================================================
ALTER TABLE proposal_options ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE proposal_options ADD COLUMN IF NOT EXISTS measurements jsonb;
ALTER TABLE proposal_options ADD COLUMN IF NOT EXISTS general_discount jsonb;

-- =====================================================
-- 5. TABELA SAVED_PDFS - Adicionar colunas que faltam
-- =====================================================
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS date text;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS expiration_date text;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS total_preco numeric;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS total_m2 numeric;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS subtotal numeric;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS general_discount_amount numeric;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS general_discount jsonb;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS pdf_blob text;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS nome_arquivo text;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS measurements jsonb;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS agendamento_id integer;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS proposal_option_name text;
ALTER TABLE saved_pdfs ADD COLUMN IF NOT EXISTS proposal_option_id integer;

-- =====================================================
-- 6. TABELA AGENDAMENTOS - Adicionar colunas que faltam
-- =====================================================
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS pdf_id integer;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS start timestamptz;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS "end" timestamptz;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS notes text;

-- =====================================================
-- 7. ATUALIZAR POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Verificar se RLS está ativo nas tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas para CLIENTS
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Políticas para FILMS
DROP POLICY IF EXISTS "Users can view their own films" ON films;
DROP POLICY IF EXISTS "Users can insert their own films" ON films;
DROP POLICY IF EXISTS "Users can update their own films" ON films;
DROP POLICY IF EXISTS "Users can delete their own films" ON films;

CREATE POLICY "Users can view their own films" ON films FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own films" ON films FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own films" ON films FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own films" ON films FOR DELETE USING (auth.uid() = user_id);

-- Políticas para USER_INFO
DROP POLICY IF EXISTS "Users can view their own info" ON user_info;
DROP POLICY IF EXISTS "Users can insert their own info" ON user_info;
DROP POLICY IF EXISTS "Users can update their own info" ON user_info;

CREATE POLICY "Users can view their own info" ON user_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own info" ON user_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own info" ON user_info FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para PROPOSAL_OPTIONS
DROP POLICY IF EXISTS "Users can view their own proposal_options" ON proposal_options;
DROP POLICY IF EXISTS "Users can insert their own proposal_options" ON proposal_options;
DROP POLICY IF EXISTS "Users can update their own proposal_options" ON proposal_options;
DROP POLICY IF EXISTS "Users can delete their own proposal_options" ON proposal_options;

CREATE POLICY "Users can view their own proposal_options" ON proposal_options FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own proposal_options" ON proposal_options FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own proposal_options" ON proposal_options FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own proposal_options" ON proposal_options FOR DELETE USING (auth.uid() = user_id);

-- Políticas para SAVED_PDFS
DROP POLICY IF EXISTS "Users can view their own pdfs" ON saved_pdfs;
DROP POLICY IF EXISTS "Users can insert their own pdfs" ON saved_pdfs;
DROP POLICY IF EXISTS "Users can update their own pdfs" ON saved_pdfs;
DROP POLICY IF EXISTS "Users can delete their own pdfs" ON saved_pdfs;

CREATE POLICY "Users can view their own pdfs" ON saved_pdfs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pdfs" ON saved_pdfs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pdfs" ON saved_pdfs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pdfs" ON saved_pdfs FOR DELETE USING (auth.uid() = user_id);

-- Políticas para AGENDAMENTOS
DROP POLICY IF EXISTS "Users can view their own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can insert their own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can update their own agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Users can delete their own agendamentos" ON agendamentos;

CREATE POLICY "Users can view their own agendamentos" ON agendamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agendamentos" ON agendamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agendamentos" ON agendamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own agendamentos" ON agendamentos FOR DELETE USING (auth.uid() = user_id);
