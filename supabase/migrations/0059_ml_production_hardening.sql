-- 0059_ml_production_hardening.sql
-- Mercado Libre production hardening: OAuth state/PKCE + webhook idempotency.

create table if not exists public.ml_oauth_states (
  nonce text primary key,
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  admin_url text not null,
  code_verifier text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ml_oauth_states_expires_at on public.ml_oauth_states(expires_at);
alter table public.ml_oauth_states enable row level security;

-- Solo las Edge Functions con service role acceden a esta tabla.
revoke all on public.ml_oauth_states from anon, authenticated;
grant all on public.ml_oauth_states to service_role;

-- Elimina el constraint anterior que impedía actualizar el mismo evento de webhook
-- de received -> processed/failed. Un evento se identifica por user/resource/topic/sent.
alter table public.ml_webhook_events drop constraint if exists uq_ml_webhook_event;
create unique index if not exists uq_ml_webhook_event_identity
  on public.ml_webhook_events(user_id, resource, topic, sent_at);

-- Limpieza segura de estados OAuth abandonados.
delete from public.ml_oauth_states where expires_at < now();


-- Remove duplicate active jobs before enforcing uniqueness.
with ranked as (
  select id, row_number() over (partition by property_id, operation order by created_at desc, id desc) as rn
  from public.ml_sync_queue
  where status in ('pending', 'processing')
)
delete from public.ml_sync_queue q
using ranked r
where q.id = r.id and r.rn > 1;

-- Reduce duplicate pending work for the same property/operation.
create unique index if not exists uq_ml_sync_active_job
  on public.ml_sync_queue(property_id, operation)
  where status in ('pending', 'processing');