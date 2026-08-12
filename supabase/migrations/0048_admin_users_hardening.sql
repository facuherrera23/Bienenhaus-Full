-- ============================================================================
-- 0048_admin_users_hardening.sql
-- BIENENHAUS - Endurecimiento de la gestión de usuarios admin
-- (fix hallazgo de auditoría: escalada admin → super_admin)
-- ============================================================================
-- Contexto:
--   La policy admin_users_admin_all (for all using is_admin() with check
--   is_admin()) permitía a CUALQUIER admin (role 'admin') hacer INSERT/UPDATE/
--   DELETE sobre admin_users, incluido cambiarse su propio role a 'super_admin'
--   (escalada de privilegios) o crear otros super_admins vía PostgREST.
--
-- Decisión:
--   * INSERT/UPDATE/DELETE sobre admin_users pasa a ser EXCLUSIVO de super_admin.
--   * La lectura sigue disponible para staff (admin_users_staff_select).
--   * Los admins existentes se promueven a super_admin (grandfathering): como la
--     policy anterior les permitía auto-escalar, esto no otorga ningún poder
--     nuevo y evita lockout del panel.
-- ============================================================================

-- ============================================================================
-- Helper de rol: is_super_admin()
-- ============================================================================
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users au
    where au.id = auth.uid()
      and au.is_active = true
      and au.role = 'super_admin'
  );
$$;

-- ============================================================================
-- Reemplazar admin_users_admin_all por policies granulares super_admin-only
-- ============================================================================
drop policy if exists admin_users_admin_all on public.admin_users;

drop policy if exists admin_users_super_admin_insert on public.admin_users;
create policy admin_users_super_admin_insert on public.admin_users
  for insert with check (public.is_super_admin());

drop policy if exists admin_users_super_admin_update on public.admin_users;
create policy admin_users_super_admin_update on public.admin_users
  for update using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists admin_users_super_admin_delete on public.admin_users;
create policy admin_users_super_admin_delete on public.admin_users
  for delete using (public.is_super_admin());

-- ============================================================================
-- Grandfathering: promover admins existentes a super_admin (evita lockout)
-- ============================================================================
update public.admin_users
set role = 'super_admin'
where role = 'admin';