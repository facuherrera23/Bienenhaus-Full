-- 0023_visits_enhancements.sql
-- Tablas para funcionalidades avanzadas de visitas

-- Visitas recurrentes
create table if not exists public.recurring_visits (
  id bigserial primary key,
  base_visit_id uuid not null references public.visits(id) on delete cascade,
  rule jsonb not null,  -- { frequency, interval, days_of_week?, day_of_month?, end_date?, count?, exceptions? }
  next_occurrence timestamptz not null,
  occurrences_generated int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recurring_visits_base_visit on public.recurring_visits (base_visit_id);
create index if not exists idx_recurring_visits_next_occurrence on public.recurring_visits (next_occurrence);
create index if not exists idx_recurring_visits_is_active on public.recurring_visits (is_active);

-- Recordatorios de visitas
-- Reemplaza el esquema legacy creado en 0020 (channel/status/error_message)
-- por el diseño canónico con is_sent que usa el panel.
drop table if exists public.visit_reminders cascade;

create table if not exists public.visit_reminders (
  id bigserial primary key,
  visit_id uuid not null references public.visits(id) on delete cascade,
  type text not null check (type in ('email', 'sms', 'push')),
  trigger_minutes_before int not null,
  template text,
  is_sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_visit_reminders_visit on public.visit_reminders (visit_id);
create index if not exists idx_visit_reminders_pending on public.visit_reminders (is_sent, visit_id) where is_sent = false;

-- QR Check-in
create table if not exists public.qr_checkins (
  id bigserial primary key,
  visit_id uuid not null references public.visits(id) on delete cascade,
  code text not null unique,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_qr_checkins_visit on public.qr_checkins (visit_id);
create index if not exists idx_qr_checkins_code on public.qr_checkins (code);

-- RLS
alter table public.recurring_visits enable row level security;
alter table public.visit_reminders enable row level security;
alter table public.qr_checkins enable row level security;

-- Políticas para recurring_visits
create policy "Admins can manage recurring visits" on public.recurring_visits
  for all using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Agents can view own recurring visits" on public.recurring_visits
  for select using (
    exists (
      select 1 from public.visits v
      where v.id = base_visit_id and v.agent_id = auth.uid()
    )
  );

-- Políticas para visit_reminders
create policy "Admins can manage reminders" on public.visit_reminders
  for all using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Agents can view own reminders" on public.visit_reminders
  for select using (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and v.agent_id = auth.uid()
    )
  );

-- Políticas para qr_checkins
create policy "Admins can manage QR checkins" on public.qr_checkins
  for all using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Agents can view own QR checkins" on public.qr_checkins
  for select using (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and v.agent_id = auth.uid()
    )
  );

create policy "Agents can check-in own visits" on public.qr_checkins
  for update using (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and v.agent_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.visits v
      where v.id = visit_id and v.agent_id = auth.uid()
    )
  );

-- Triggers
create trigger trg_recurring_visits_updated_at
  before update on public.recurring_visits
  for each row execute function public.set_updated_at();

create trigger trg_visit_reminders_updated_at
  before update on public.visit_reminders
  for each row execute function public.set_updated_at();