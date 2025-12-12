-- Remove a política antiga que limitava a atualização apenas ao próprio usuário
drop policy if exists "Users can update own profile." on profiles;
drop policy if exists "Usuários podem atualizar seu próprio perfil." on profiles;

-- Cria uma nova política que permite:
-- 1. O próprio usuário atualizar seu perfil
-- 2. OU um usuário com role 'admin' atualizar qualquer perfil
create policy "Admins podem atualizar qualquer perfil" on profiles
  for update using (
    auth.uid() = id 
    or 
    (select role from profiles where id = auth.uid()) = 'admin'
  );
