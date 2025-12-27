-- =====================================================
-- MIGRAÇÃO: Sistema de Gestão de Colaboradores
-- =====================================================

-- 1. Criar tabela de organizações (empresas)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de membros da organização
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
    invited_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ,
    UNIQUE(organization_id, email)
);

-- 3. Adicionar coluna organization_id na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para organizations
-- Donos podem ver e gerenciar suas organizações
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their organization"
    ON organizations FOR UPDATE
    USING (owner_id = auth.uid());

-- 6. Políticas RLS para organization_members
-- Donos podem gerenciar membros
CREATE POLICY "Owners can view organization members"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Owners can invite members"
    ON organization_members FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update member status"
    ON organization_members FOR UPDATE
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can remove members"
    ON organization_members FOR DELETE
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );

-- 7. Função para criar organização automaticamente para novos usuários aprovados
CREATE OR REPLACE FUNCTION create_organization_for_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Só cria organização se o usuário foi aprovado e não tem organização
    IF NEW.approved = true AND NEW.organization_id IS NULL THEN
        -- Cria a organização
        INSERT INTO organizations (name, owner_id)
        VALUES (COALESCE(NEW.email, 'Minha Empresa'), NEW.id)
        RETURNING id INTO new_org_id;
        
        -- Atualiza o profile com a organização
        NEW.organization_id := new_org_id;
        
        -- Cria o membro owner
        INSERT INTO organization_members (organization_id, user_id, email, role, status, joined_at)
        VALUES (new_org_id, NEW.id, NEW.email, 'owner', 'active', now());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para auto-criar organização
DROP TRIGGER IF EXISTS on_user_approved ON profiles;
CREATE TRIGGER on_user_approved
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.approved = false AND NEW.approved = true)
    EXECUTE FUNCTION create_organization_for_user();

-- 9. Função para vincular colaborador convidado à organização
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Trigger para vincular colaborador ao fazer cadastro
DROP TRIGGER IF EXISTS on_user_created_check_invite ON profiles;
CREATE TRIGGER on_user_created_check_invite
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION link_invited_user_to_organization();

-- 11. Criar organizações para usuários já aprovados que não têm
DO $$
DECLARE
    profile_record RECORD;
    new_org_id UUID;
BEGIN
    FOR profile_record IN 
        SELECT id, email FROM profiles 
        WHERE approved = true AND organization_id IS NULL
    LOOP
        -- Cria organização
        INSERT INTO organizations (name, owner_id)
        VALUES (COALESCE(profile_record.email, 'Minha Empresa'), profile_record.id)
        RETURNING id INTO new_org_id;
        
        -- Atualiza profile
        UPDATE profiles SET organization_id = new_org_id WHERE id = profile_record.id;
        
        -- Cria membro owner
        INSERT INTO organization_members (organization_id, user_id, email, role, status, joined_at)
        VALUES (new_org_id, profile_record.id, profile_record.email, 'owner', 'active', now());
    END LOOP;
END;
$$;
