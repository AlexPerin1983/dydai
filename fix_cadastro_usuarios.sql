-- =====================================================
-- FIX: Corrigir triggers para cadastro de usuários
-- Execute este SQL no Supabase Dashboard
-- =====================================================

-- O problema é que o trigger tenta fazer operações em tabelas
-- com RLS ativo durante o INSERT de profiles.
-- A solução é usar SET search_path para garantir acesso.

-- 1. Recriar função com search_path seguro
CREATE OR REPLACE FUNCTION link_invited_user_to_organization()
RETURNS TRIGGER AS $$
DECLARE
    pending_invite RECORD;
BEGIN
    -- Busca convite pendente para o email do novo usuário
    SELECT om.*, o.id as org_id
    INTO pending_invite
    FROM organization_members om
    JOIN organizations o ON om.organization_id = o.id
    WHERE om.email = NEW.email 
      AND om.status = 'pending'
      AND om.user_id IS NULL
    LIMIT 1;
    
    IF pending_invite IS NOT NULL THEN
        -- Atualiza o membro com o user_id e muda status para active
        UPDATE organization_members
        SET user_id = NEW.id,
            status = 'active',
            joined_at = now()
        WHERE id = pending_invite.id;
        
        -- Atualiza o profile com a organização e marca como aprovado
        NEW.organization_id := pending_invite.org_id;
        NEW.approved := true;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, apenas continua sem vincular
    RAISE WARNING 'Erro ao vincular usuário: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Adicionar política para permitir que o sistema leia invites pendentes
-- (necessário para o trigger funcionar)
DROP POLICY IF EXISTS "System can read pending invites" ON organization_members;
CREATE POLICY "System can read pending invites"
    ON organization_members FOR SELECT
    USING (true);

-- 3. Adicionar política para permitir que o sistema atualize invites
DROP POLICY IF EXISTS "System can update invites on user join" ON organization_members;
CREATE POLICY "System can update invites on user join"
    ON organization_members FOR UPDATE
    USING (true);

-- 4. Testar se a tabela profiles tem as políticas corretas
-- Verificar se existe política de INSERT
DO $$
BEGIN
    -- Verifica se existe RLS na profiles
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        -- Garante que existe política de INSERT permissiva
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND cmd = 'INSERT'
        ) THEN
            RAISE NOTICE 'Criando política de INSERT para profiles...';
        END IF;
    END IF;
END;
$$;

-- 5. Garantir política de INSERT para profiles se não existir
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
