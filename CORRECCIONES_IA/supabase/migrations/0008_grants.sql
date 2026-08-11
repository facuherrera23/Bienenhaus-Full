-- ============================================================================
-- 0008_grants.sql
-- BIENENHAUS — Permisos a nivel de tabla para los roles de Supabase.
-- RLS es la puerta de entrada; sin estos GRANT, anon/authenticated no pueden
-- ni consultar las tablas (PostgREST responde "permission denied").
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
