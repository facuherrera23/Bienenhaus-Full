-- ============================================================================
-- 0009_audit_write_policies.sql
-- BIENENHAUS — Permite a los triggers de auditoría (security invoker) escribir
-- activity_log y properties_history para staff/admin.
-- ============================================================================

create policy activity_log_staff_insert on public.activity_log
  for insert with check (public.is_staff());

create policy properties_history_staff_insert on public.properties_history
  for insert with check (public.is_staff());
