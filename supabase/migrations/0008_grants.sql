-- ============================================================================
-- 0008_grants.sql
-- BIENENHAUS — Permisos a nivel de tabla para los roles de Supabase.
-- RLS es la puerta de entrada; sin estos GRANT, anon/authenticated no pueden
-- ni consultar las tablas (PostgREST responde "permission denied").
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

/* RLS policies handle access control; these grants are redundant and dangerous
   combined with RLS. Only service_role needs broad CRUD for admin operations. */
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;


