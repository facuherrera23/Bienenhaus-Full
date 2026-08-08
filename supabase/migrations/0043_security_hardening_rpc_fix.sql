-- ============================================================================
-- 0043_security_hardening_rpc_fix.sql
-- BIENENHAUS — Corrección de 0042: los revokes apuntaron a roles individuales
-- (anon, authenticated) pero los grants reales estaban a PUBLIC (=X/postgres),
-- el default de PostgreSQL. Verificado por ACL en cloud:
--
--   log_audit            {=X/postgres, postgres=X, service_role=X}   <- PUBLIC
--   cleanup_audit_logs   {=X/postgres, postgres=X, service_role=X}   <- PUBLIC
--   audit_trigger        {=X/postgres, postgres=X, service_role=X}   <- PUBLIC
--   ml_enqueue           {=X/postgres, postgres=X, anon=X,
--                         authenticated=X, service_role=X}           <- anon+PUBLIC
--   ml_get_connection    {=X/postgres, postgres=X, authenticated=X,
--                         service_role=X}                            <- PUBLIC
--
-- Este fix revoca los grants de PUBLIC/anon. Se conservan:
--   * service_role  -> edge functions (ml-webhook, etc.)
--   * postgres      -> owner (triggers SECURITY DEFINER: audit_trigger corre
--                      como postgres, que conserva su grant explícito)
--   * authenticated -> ml_get_connection (admin lo llama vía RPC, ml.ts:127)
--                      y ml_enqueue (defensa en profundidad; el body exige
--                      is_staff() o service_role de todos modos)
-- ============================================================================

revoke execute on function public.log_audit(text, text, uuid, text, jsonb, jsonb, text[], jsonb, text, text) from public;
revoke execute on function public.cleanup_audit_logs(integer) from public;
revoke execute on function public.audit_trigger() from public;
revoke execute on function public.ml_enqueue(uuid, ml_operation, boolean) from anon, public;
revoke execute on function public.ml_get_connection() from anon, public;
