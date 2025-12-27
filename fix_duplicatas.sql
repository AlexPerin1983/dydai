-- =====================================================
-- FIX V2: Remover duplicatas e simplificar lógica
-- Execute este SQL no Supabase Dashboard
-- =====================================================

-- 1. LIMPAR DUPLICATAS EXISTENTES
-- Mantém apenas o registro mais antigo (owner tem prioridade)
DELETE FROM organization_members a
USING organization_members b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.organization_id = b.organization_id
  AND a.user_id IS NOT NULL;

-- 2. REMOVER TRIGGERS PROBLEMÁTICOS
-- Esses triggers estão causando conflitos
DROP TRIGGER IF EXISTS on_user_approved ON profiles;
DROP TRIGGER IF EXISTS on_user_created_check_invite ON profiles;

-- 3. REMOVER FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS create_organization_for_user();
DROP FUNCTION IF EXISTS link_invited_user_to_organization();

-- 4. CRIAR FUNÇÃO ÚNICA E SIMPLIFICADA
-- Esta função lida com TODAS as situações de forma limpa
CREATE OR REPLACE FUNCTION handle_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
    pending_invite RECORD;
    existing_org_id UUID;
BEGIN
    -- CASO 1: INSERT (novo usuário se cadastrando)
    IF TG_OP = 'INSERT' THEN
        -- Verifica se existe convite pendente para este email
        SELECT om.*, o.id as org_id
        INTO pending_invite
        FROM organization_members om
        JOIN organizations o ON om.organization_id = o.id
        WHERE om.email = NEW.email 
          AND om.status = 'pending'
          AND om.user_id IS NULL
        LIMIT 1;
        
        IF pending_invite IS NOT NULL THEN
            -- Vincula o convite ao usuário
            UPDATE organization_members
            SET user_id = NEW.id,
                status = 'active',
                joined_at = now()
            WHERE id = pending_invite.id;
            
            -- Atualiza profile com organização e já aprova
            NEW.organization_id := pending_invite.org_id;
            NEW.approved := true;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- CASO 2: UPDATE (usuário sendo aprovado pelo admin)
    IF TG_OP = 'UPDATE' THEN
        -- Só age se está sendo aprovado agora e não tem organização
        IF NEW.approved = true AND OLD.approved = false AND NEW.organization_id IS NULL THEN
            -- Verifica novamente se existe convite (pode ter sido criado após cadastro)
            SELECT om.organization_id
            INTO existing_org_id
            FROM organization_members om
            WHERE om.user_id = NEW.id
              AND om.status = 'active'
            LIMIT 1;
            
            IF existing_org_id IS NOT NULL THEN
                -- Já tem organização via convite, só vincula
                NEW.organization_id := existing_org_id;
            ELSE
                -- Não tem organização, cria uma nova
                INSERT INTO organizations (name, owner_id)
                VALUES (COALESCE(NEW.email, 'Minha Empresa'), NEW.id)
                RETURNING id INTO existing_org_id;
                
                NEW.organization_id := existing_org_id;
                
                -- Cria registro de membro owner
                INSERT INTO organization_members (organization_id, user_id, email, role, status, joined_at)
                VALUES (existing_org_id, NEW.id, NEW.email, 'owner', 'active', now());
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro em handle_profile_changes: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. CRIAR TRIGGER ÚNICO PARA INSERT E UPDATE
DROP TRIGGER IF EXISTS on_profile_changes ON profiles;
CREATE TRIGGER on_profile_changes
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_profile_changes();

-- 6. POLÍTICAS RLS SIMPLIFICADAS
-- Remover políticas muito permissivas e criar uma equilibrada
DROP POLICY IF EXISTS "System can read pending invites" ON organization_members;
DROP POLICY IF EXISTS "System can update invites on user join" ON organization_members;

-- Política que permite leitura para membros da organização ou convites pendentes do próprio email
DROP POLICY IF EXISTS "Members can view their organization" ON organization_members;
CREATE POLICY "Members can view their organization"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- 7. VERIFICAR E CORRIGIR INCONSISTÊNCIAS
-- Usuários aprovados sem organização
UPDATE profiles p
SET organization_id = om.organization_id
FROM organization_members om
WHERE p.id = om.user_id
  AND p.organization_id IS NULL
  AND om.status = 'active';

-- 8. MOSTRAR ESTADO ATUAL (para debug)
SELECT 
    'organization_members' as tabela,
    count(*) as total,
    count(DISTINCT user_id) as usuarios_unicos
FROM organization_members
WHERE user_id IS NOT NULL;
