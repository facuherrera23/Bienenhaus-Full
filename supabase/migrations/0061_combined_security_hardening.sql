-- 0061_combined_security_hardening.sql
-- BIENENHAUS — Combinación de hardening de seguridad:
--   1. RLS para tablas creadas después de 0008 que heredaron GRANT ALL pero sin RLS
--      (trash_retention_policies, site_settings_versions, ml_sync_dead_letter,
--       rate_limit_logs, property_drafts, property_valuations)
--   2. Limpieza de entidades inválidas en trash_retention_policies (de 0053)
--   3. Preservación de columnas de credenciales ML (client_id_encrypted, etc.) de 0060
--      si no existen, se crean; si ya existen (migración 0060 aplicada), solo RLS.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1) Asegurar columnas de credenciales ML en ml_connection (de 0060)
--    Solo se agregan si no existen (idempotente).
-- ---------------------------------------------------------------------------
alter table public.ml_connection
  add column if not exists client_id_encrypted text,
  add column if not exists client_id_iv text,
  add column if not exists client_secret_encrypted text,
  add column if not exists client_secret_iv text;

comment on column public.ml_connection.client_id_encrypted is 'Client ID de la app ML, encriptado AES-256-GCM';
comment on column public.ml_connection.client_id_iv is 'IV para desencriptar client_id';
comment on column public.ml_connection.client_secret_encrypted is 'Client Secret de la app ML, encriptado AES-256-GCM';
comment on column public.ml_connection.client_secret_iv is 'IV para desencriptar client_secret';

-- Helper: función para obtener credenciales encriptadas (usada por Edge Functions)
create or replace function public.get_ml_credentials()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_conn record;
begin
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;

  select id, client_id_encrypted, client_id_iv, client_secret_encrypted, client_secret_iv
    into v_conn
    from public.ml_connection
    where is_active = true
    order by updated_at desc
    limit 1;

  if v_conn is null or v_conn.client_id_encrypted is null or v_conn.client_secret_encrypted is null then
    return null;
  end if;

  return jsonb_build_object(
    'client_id_encrypted', v_conn.client_id_encrypted,
    'client_id_iv', v_conn.client_id_iv,
    'client_secret_encrypted', v_conn.client_secret_encrypted,
    'client_secret_iv', v_conn.client_secret_iv
  );
end;
$$;

revoke execute on function public.get_ml_credentials() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) trash_retention_policies
--    Solo staff puede consultar/modificar las políticas.
-- ---------------------------------------------------------------------------
alter table public.trash_retention_policies enable row level security;

drop policy if exists "trash_retention_staff_all" on public.trash_retention_policies;
create policy "trash_retention_staff_all"
    on public.trash_retention_policies
    for all
    to authenticated
    using (public.is_staff())
    with check (public.is_staff());

revoke all on table public.trash_retention_policies from anon;
grant select, insert, update, delete on table public.trash_retention_policies to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) site_settings_versions
--    Los administradores pueden consultar/crear versiones; no se permite borrar
--    desde el cliente. Service role conserva acceso completo.
-- ---------------------------------------------------------------------------
alter table public.site_settings_versions enable row level security;

drop policy if exists "site_settings_versions_staff_select" on public.site_settings_versions;
create policy "site_settings_versions_staff_select"
    on public.site_settings_versions
    for select
    to authenticated
    using (public.is_staff());

drop policy if exists "site_settings_versions_staff_insert" on public.site_settings_versions;
create policy "site_settings_versions_staff_insert"
    on public.site_settings_versions
    for insert
    to authenticated
    with check (
        public.is_staff()
        and changed_by = auth.uid()
    );

revoke all on table public.site_settings_versions from anon;
grant select, insert on table public.site_settings_versions to authenticated;
grant all on table public.site_settings_versions to service_role;

-- ---------------------------------------------------------------------------
-- 4) ml_sync_dead_letter
--    Datos potencialmente sensibles: solo staff puede inspeccionarlos/resolverlos.
--    Los inserts automáticos los realiza service_role desde ml-sync.
-- ---------------------------------------------------------------------------
alter table public.ml_sync_dead_letter enable row level security;

drop policy if exists "ml_dead_letter_staff_select" on public.ml_sync_dead_letter;
create policy "ml_dead_letter_staff_select"
    on public.ml_sync_dead_letter
    for select
    to authenticated
    using (public.is_staff());

drop policy if exists "ml_dead_letter_staff_update" on public.ml_sync_dead_letter;
create policy "ml_dead_letter_staff_update"
    on public.ml_sync_dead_letter
    for update
    to authenticated
    using (public.is_staff())
    with check (public.is_staff());

drop policy if exists "ml_dead_letter_staff_delete" on public.ml_sync_dead_letter;
create policy "ml_dead_letter_staff_delete"
    on public.ml_sync_dead_letter
    for delete
    to authenticated
    using (public.is_staff());

revoke all on table public.ml_sync_dead_letter from anon;
grant select, update, delete on table public.ml_sync_dead_letter to authenticated;
grant all on table public.ml_sync_dead_letter to service_role;

-- ---------------------------------------------------------------------------
-- 5) rate_limit_logs
--    Nunca debe estar expuesta al cliente: puede contener claves de rate limit
--    y datos operativos. Solo service_role escribe/lee.
-- ---------------------------------------------------------------------------
alter table public.rate_limit_logs enable row level security;

revoke all on table public.rate_limit_logs from anon, authenticated;
grant all on table public.rate_limit_logs to service_role;

-- ---------------------------------------------------------------------------
-- 6) property_drafts
--    Los borradores son privados por usuario. Staff puede gestionar los propios;
--    service_role conserva acceso completo para operaciones internas.
-- ---------------------------------------------------------------------------
alter table public.property_drafts enable row level security;

drop policy if exists "property_drafts_owner_select" on public.property_drafts;
create policy "property_drafts_owner_select"
    on public.property_drafts
    for select
    to authenticated
    using (
        admin_user_id = auth.uid()
        and public.is_staff()
    );

drop policy if exists "property_drafts_owner_insert" on public.property_drafts;
create policy "property_drafts_owner_insert"
    on public.property_drafts
    for insert
    to authenticated
    with check (
        admin_user_id = auth.uid()
        and public.is_staff()
    );

drop policy if exists "property_drafts_owner_update" on public.property_drafts;
create policy "property_drafts_owner_update"
    on public.property_drafts
    for update
    to authenticated
    using (
        admin_user_id = auth.uid()
        and public.is_staff()
    )
    with check (
        admin_user_id = auth.uid()
        and public.is_staff()
    );

drop policy if exists "property_drafts_owner_delete" on public.property_drafts;
create policy "property_drafts_owner_delete"
    on public.property_drafts
    for delete
    to authenticated
    using (
        admin_user_id = auth.uid()
        and public.is_staff()
    );

revoke all on table public.property_drafts from anon;
grant select, insert, update, delete on table public.property_drafts to authenticated;
grant all on table public.property_drafts to service_role;

-- ---------------------------------------------------------------------------
-- 7) property_valuations (Tasar) - asegurar RLS staff-only + owner read
--    (Si 0044 ya se aplicó, esto es idempotente/refuerzo)
-- ---------------------------------------------------------------------------
alter table public.property_valuations enable row level security;

drop policy if exists valuation_staff_all on public.property_valuations;
create policy valuation_staff_all on public.property_valuations
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists valuation_owner_read on public.property_valuations;
create policy valuation_owner_read on public.property_valuations
  for select using (created_by = auth.uid());

-- valuation_comparables
alter table public.valuation_comparables enable row level security;
drop policy if exists valuation_comparables_staff_all on public.valuation_comparables;
create policy valuation_comparables_staff_all on public.valuation_comparables
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists valuation_comparables_owner_read on public.valuation_comparables;
create policy valuation_comparables_owner_read on public.valuation_comparables
  for select using (
    exists (
      select 1 from public.property_valuations pv
      where pv.id = valuation_id and pv.created_by = auth.uid()
    )
  );

-- valuation_images
alter table public.valuation_images enable row level security;
drop policy if exists valuation_images_staff_all on public.valuation_images;
create policy valuation_images_staff_all on public.valuation_images
  for all using (public.is_staff()) with check (public.is_staff());
drop policy if exists valuation_images_owner_read on public.valuation_images;
create policy valuation_images_owner_read on public.valuation_images
  for select using (
    exists (
      select 1 from public.property_valuations pv
      where pv.id = valuation_id and pv.created_by = auth.uid()
    )
  );

-- valuation_history
alter table public.valuation_history enable row level security;
drop policy if exists valuation_history_staff_read on public.valuation_history;
create policy valuation_history_staff_read on public.valuation_history
  for select using (public.is_staff());
drop policy if exists valuation_history_owner_read on public.valuation_history;
create policy valuation_history_owner_read on public.valuation_history
  for select using (
    exists (
      select 1 from public.property_valuations pv
      where pv.id = valuation_id and pv.created_by = auth.uid()
    )
  );

-- geocode_cache
alter table public.geocode_cache enable row level security;
drop policy if exists geocode_cache_staff_all on public.geocode_cache;
create policy geocode_cache_staff_all on public.geocode_cache
  for all using (public.is_staff()) with check (public.is_staff());

-- Revocar anon en tablas de tasaciones (defensa en profundidad)
revoke all on table public.property_valuations from anon;
revoke all on table public.valuation_comparables from anon;
revoke all on table public.valuation_images from anon;
revoke all on table public.valuation_history from anon;
revoke all on table public.geocode_cache from anon;

-- ---------------------------------------------------------------------------
-- 8) 0053 tenía entidades inexistentes. Dejamos únicamente tablas con
--    deleted_at reales y compatibles con el proceso de retención actual.
-- ---------------------------------------------------------------------------
delete from public.trash_retention_policies
where entity not in (
    'properties',
    'leads',
    'owners',
    'agents',
    'visits',
    'property_valuations'
);

insert into public.trash_retention_policies (
    entity,
    retention_days,
    notify_before_days,
    auto_delete_enabled
)
values
    ('property_valuations', 365, 7, true)
on conflict (entity) do nothing;

commit;