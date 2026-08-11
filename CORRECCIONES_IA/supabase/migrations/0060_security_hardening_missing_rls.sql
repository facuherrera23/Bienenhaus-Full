-- 0059_security_hardening_missing_rls.sql
-- Cierra tablas creadas después de 0008 que heredaron GRANT ALL para anon/authenticated
-- pero nunca recibieron RLS. También corrige el conjunto de entidades usado por
-- trash retention para que solo incluya tablas que realmente existen.

begin;

-- ---------------------------------------------------------------------------
-- 1) trash_retention_policies
-- Solo staff puede consultar/modificar las políticas.
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
-- 2) site_settings_versions
-- Los administradores pueden consultar/crear versiones; no se permite borrar
-- desde el cliente. Service role conserva acceso completo.
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
-- 3) ml_sync_dead_letter
-- Datos potencialmente sensibles: solo staff puede inspeccionarlos/resolverlos.
-- Los inserts automáticos los realiza service_role desde ml-sync.
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
-- 4) rate_limit_logs
-- Nunca debe estar expuesta al cliente: puede contener claves de rate limit
-- y datos operativos. Solo service_role escribe/lee.
-- ---------------------------------------------------------------------------
alter table public.rate_limit_logs enable row level security;

revoke all on table public.rate_limit_logs from anon, authenticated;
grant all on table public.rate_limit_logs to service_role;

-- ---------------------------------------------------------------------------
-- 5) property_drafts
-- Los borradores son privados por usuario. Staff puede gestionar los propios;
-- service_role conserva acceso completo para operaciones internas.
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
-- 6) 0053 tenía entidades inexistentes. Dejamos únicamente tablas con
-- deleted_at reales y compatibles con el proceso de retención actual.
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
