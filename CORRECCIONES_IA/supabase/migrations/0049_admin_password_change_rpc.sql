-- ============================================================================
-- 0049_admin_password_change_rpc.sql
-- BIENENHAUS - RPC para el flujo de cambio de contraseña
-- ============================================================================
-- Contexto:
--   0048 restringió INSERT/UPDATE/DELETE sobre admin_users a super_admin.
--   El flujo "Cambiar contraseña" (ChangePassword.tsx) limpia el flag
--   must_change_password de la propia fila; con el RLS super_admin-only,
--   un staff/admin/viewer no podría actualizar su propia fila y quedaría
--   atrapado en el loop de cambio de contraseña.
--
-- Decisión:
--   RPC SECURITY DEFINER que solo toca la fila de auth.uid() (el propio
--   usuario), sin exponer ningún vector de escalada de roles. Patrón
--   consistente con update_admin_last_login (0007).
-- ============================================================================

create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_users
  set must_change_password = false, updated_at = now()
  where id = auth.uid();
end;
$$;

-- Restringir ejecución: solo authenticated (el RPC hace UPDATE; anon no debe
-- poder invocar funciones de escritura, aunque auth.uid() = NULL la haría no-op).
revoke execute on function public.complete_password_change() from anon, public;
grant execute on function public.complete_password_change() to authenticated, service_role;
