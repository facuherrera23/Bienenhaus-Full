-- ============================================================================
-- 0066_ml_sync_robustness
-- Fase 0 del plan de robustez de la ingestion ML (docs/features/ml-ingestion-robustness.md)
--
-- F0.4: Consolidar indice de unicidad (uq_ml_sync_active_job era duplicado de
--       uq_ml_sync_queue_active; ON CONFLICT resuelve por predicado, no por nombre).
-- F0.3: Tabla ml_sync_cooldown — circuit breaker ante rate limits (429) de la API ML.
-- F0.2: RPC ml_claim_jobs — claim atomico con FOR UPDATE SKIP LOCKED + incremento de attempts.
-- F0.5: RPC ml_retry_dead_letter — reintento transaccional de dead letters.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- F0.4: DROP INDEX uq_ml_sync_active_job (duplicado de uq_ml_sync_queue_active)
-- ----------------------------------------------------------------------------
drop index if exists public.uq_ml_sync_active_job;

-- ----------------------------------------------------------------------------
-- F0.3: ml_sync_cooldown
-- ----------------------------------------------------------------------------
create table if not exists public.ml_sync_cooldown (
    connection_id  uuid primary key references public.ml_connection (id) on delete cascade,
    cooldown_until timestamptz not null,
    reason         text        not null default '',
    updated_at     timestamptz not null default now()
);

create trigger ml_sync_cooldown_set_updated_at
    before update on public.ml_sync_cooldown
    for each row execute function public.set_updated_at();

alter table public.ml_sync_cooldown enable row level security;

create policy "ml_sync_cooldown_select_staff"
    on public.ml_sync_cooldown
    for select
    to authenticated
    using (public.is_staff());

-- El service_role (edge functions) escribe el cooldown; los admins solo lo leen.
grant select, insert, update on public.ml_sync_cooldown to service_role;
grant select on public.ml_sync_cooldown to authenticated;

-- ----------------------------------------------------------------------------
-- F0.2: ml_claim_jobs
-- Claim atomico de jobs pendientes: reserva con SKIP LOCKED, marca 'processing',
-- incrementa attempts y devuelve el job reclamado (con el nuevo attempts).
-- Solo el service_role (ml-sync edge function) puede invocarlo.
-- ----------------------------------------------------------------------------
create or replace function public.ml_claim_jobs(p_batch_size int default 10)
returns table (
    id          bigint,
    property_id uuid,
    operation   ml_operation,
    ml_item_id  text,
    attempts    int,
    max_attempts int
)
language sql
security definer
set search_path = 'public'
as $$
    with candidates as (
        select q.id
        from public.ml_sync_queue q
        where q.status = 'pending'
          and q.locked_by is null
          and q.next_attempt_at <= now()
        order by q.created_at asc
        limit p_batch_size
        for update skip locked
    )
    update public.ml_sync_queue q
    set status        = 'processing',
        attempts      = q.attempts + 1,
        locked_by     = gen_random_uuid(),
        locked_at     = now(),
        last_error    = null
    from candidates c
    where q.id = c.id
    returning q.id, q.property_id, q.operation, q.ml_item_id, q.attempts, q.max_attempts;
$$;

revoke all on function public.ml_claim_jobs(int) from public, anon;
grant execute on function public.ml_claim_jobs(int) to service_role;

-- ----------------------------------------------------------------------------
-- F0.5: ml_retry_dead_letter
-- Reintenta una dead letter: reinserta el job en la cola (pending, attempts 0)
-- y marca la dead letter como resuelta. Devuelve jsonb para que el cliente pueda
-- distinguir 'ya existe job activo' (no reinsertado) de 'reintentado'.
-- ----------------------------------------------------------------------------
create or replace function public.ml_retry_dead_letter(p_dead_letter_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
    v_dl       public.ml_sync_dead_letter%rowtype;
    v_queue_id bigint;
begin
    if auth.role() <> 'service_role' and not public.is_staff() then
        raise exception 'No autorizado';
    end if;

    select *
    into v_dl
    from public.ml_sync_dead_letter
    where id = p_dead_letter_id;

    if not found then
        raise exception 'Dead letter % no encontrada', p_dead_letter_id;
    end if;

    if v_dl.resolved_at is not null then
        return jsonb_build_object('retried', false, 'reason', 'already_resolved');
    end if;

    insert into public.ml_sync_queue (
        property_id,
        operation,
        status,
        attempts,
        max_attempts,
        next_attempt_at,
        ml_item_id,
        payload
    )
    values (
        v_dl.property_id,
        v_dl.operation,
        'pending',
        0,
        v_dl.max_attempts,
        now(),
        v_dl.ml_item_id,
        v_dl.payload
    )
    on conflict (property_id, operation) where status in ('pending', 'processing')
    do nothing
    returning id into v_queue_id;

    if v_queue_id is null then
        return jsonb_build_object('retried', false, 'reason', 'active_job_exists');
    end if;

    update public.ml_sync_dead_letter
    set resolved_at     = now(),
        resolved_by     = auth.uid(),
        resolution_notes = 'Reintentado via ml_retry_dead_letter (job ' || v_queue_id || ')'
    where id = p_dead_letter_id;

    return jsonb_build_object('retried', true, 'queue_id', v_queue_id);
end;
$$;

revoke all on function public.ml_retry_dead_letter(bigint) from public, anon;
grant execute on function public.ml_retry_dead_letter(bigint) to authenticated, service_role;
