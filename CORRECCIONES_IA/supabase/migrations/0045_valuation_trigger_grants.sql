-- ============================================================================
-- 0045_valuation_trigger_grants.sql
-- BIENENHAUS — Endurecer grants de funciones de trigger de valuation.
-- Los triggers se disparan con privilegios del owner (security definer), así
-- que los usuarios NO necesitan EXECUTE. Patrón idéntico al de 0042/0043 con
-- audit_trigger(): revoke de authenticated también (defensa en profundidad).
-- ============================================================================
revoke execute on function public.valuation_prevent_locked_update() from authenticated;
revoke execute on function public.valuation_history_trigger() from authenticated;
