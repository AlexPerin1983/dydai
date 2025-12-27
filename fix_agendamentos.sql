-- CORREÇÃO DA TABELA AGENDAMENTOS
-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/avlefzsipbqvollukgyt/sql/new

-- Renomear colunas antigas para o novo padrão (se existirem)
DO $$
BEGIN
    -- Renomear start_time para start (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'start_time') THEN
        ALTER TABLE agendamentos RENAME COLUMN start_time TO start;
    END IF;
    
    -- Renomear end_time para end (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'end_time') THEN
        ALTER TABLE agendamentos RENAME COLUMN end_time TO "end";
    END IF;
END $$;

-- Garantir que as colunas existam
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS start timestamptz;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS "end" timestamptz;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS pdf_id integer;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS client_id integer;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS notes text;

-- Remover constraint NOT NULL das colunas antigas se existirem
ALTER TABLE agendamentos ALTER COLUMN start DROP NOT NULL;
ALTER TABLE agendamentos ALTER COLUMN "end" DROP NOT NULL;
