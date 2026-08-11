-- ============================================================================
-- 0033_fix_ml_grants.sql
-- BIENENHAUS — Fix de seguridad (Fase A, B3).
-- ml_get_connection() expone datos de la conexión ML (nickname, email, user_id):
-- no debe ser ejecutable por el rol anon. Se revoca ese grant; queda solo
-- para authenticated.
-- ============================================================================

revoke execute on function public.ml_get_connection() from anon;
