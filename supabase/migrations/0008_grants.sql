-- ============================================================================
-- 0008_grants.sql
-- BIENENHAUS — Permisos a nivel de tabla para los roles de Supabase.
--
-- MODELO DE SEGURIDAD: grants + RLS son COMPLEMENTARIOS, no excluyentes.
--   - GRANT: habilita qué roles pueden tocar la tabla (acceso a nivel tabla).
--   - RLS:   filtra QUÉ filas ve/muta cada rol una vez dentro (acceso a filas).
-- Sin el GRANT a nivel tabla, PostgREST responde "permission denied" ANTES de
-- evaluar cualquier RLS policy → las policies quedan como código muerto.
--
-- ⚠️ HISTORIA (NO repetir): el commit 4753b72 eliminó estos grants y los
-- `alter default privileges`, asumiendo que eran "redundantes con RLS". Eso
-- rompió TODO reset fresco (`supabase db reset`): las tablas creadas DESPUÉS
-- de esta migración (visits=0020, chat=0021, valuaciones=0044, drafts=0058,
-- etc.) quedaban sin ningún grant y service_role/anon/authenticated recibían
-- "permission denied" (bug reportado por E2E en CI). La DB local no lo detectó
-- porque fue reseteada antes de ese commit (heredó los default privileges).
-- El endurecimiento puntual NO se hace acá: se hace con REVOKEs selectivos en
-- migraciones posteriores (0037, 0042, 0044, 0059, 0061), que corren DESPUÉS
-- y siguen aplicando sobre estos grants.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Default privileges: aplican a toda tabla/función creada DESPUÉS de esta
-- migración. Sin esto, las tablas nuevas quedan sin grants en un reset fresco.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;


