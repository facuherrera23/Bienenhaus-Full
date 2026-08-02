-- 0022_ml_webhook.sql
-- Tablas para webhooks de Mercado Libre

-- Eventos de webhook recibidos
create table if not exists public.ml_webhook_events (
  id bigserial primary key,
  user_id bigint not null,
  resource text not null,
  topic text not null,
  application_id bigint not null,
  attempts int not null default 1,
  sent_at timestamptz not null,
  received_at timestamptz not null default now(),
  status text not null check (status in ('received', 'processed', 'failed')),
  error text,
  payload jsonb not null
);

create index if not exists idx_ml_webhook_events_user_id on public.ml_webhook_events (user_id);
create index if not exists idx_ml_webhook_events_topic on public.ml_webhook_events (topic);
create index if not exists idx_ml_webhook_events_status on public.ml_webhook_events (status);
create index if not exists idx_ml_webhook_events_received_at on public.ml_webhook_events (received_at desc);

-- Preguntas de Mercado Libre
create table if not exists public.ml_questions (
  id bigserial primary key,
  question_id text not null unique,
  property_id uuid references public.properties(id) on delete cascade,
  ml_item_id bigint not null,
  question_text text,
  answer_text text,
  status text not null check (status in ('unanswered', 'answered', 'deleted')) default 'unanswered',
  from_user_id bigint,
  from_user_nickname text,
  date_created timestamptz,
  date_updated timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists idx_ml_questions_property_id on public.ml_questions (property_id);
create index if not exists idx_ml_questions_ml_item_id on public.ml_questions (ml_item_id);
create index if not exists idx_ml_questions_status on public.ml_questions (status);

-- Órdenes/Ventas de Mercado Libre
create table if not exists public.ml_orders (
  id bigserial primary key,
  order_id text not null unique,
  property_id uuid references public.properties(id) on delete cascade,
  ml_item_id bigint not null,
  buyer_id bigint,
  buyer_nickname text,
  status text not null check (status in ('new', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled')) default 'new',
  total_amount numeric(12,2),
  currency text default 'ARS',
  date_created timestamptz,
  date_closed timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists idx_ml_orders_property_id on public.ml_orders (property_id);
create index if not exists idx_ml_orders_ml_item_id on public.ml_orders (ml_item_id);
create index if not exists idx_ml_orders_status on public.ml_orders (status);

-- Pagos de Mercado Libre
create table if not exists public.ml_payments (
  id bigserial primary key,
  payment_id text not null unique,
  order_id text,
  property_id uuid references public.properties(id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled')) default 'pending',
  amount numeric(12,2),
  currency text default 'ARS',
  payment_method_id text,
  payment_type text,
  date_created timestamptz,
  date_approved timestamptz,
  received_at timestamptz not null default now(),
  payload jsonb
);

create index if not exists idx_ml_payments_property_id on public.ml_payments (property_id);
create index if not exists idx_ml_payments_status on public.ml_payments (status);

-- Envíos de Mercado Libre
create table if not exists public.ml_shipments (
  id bigserial primary key,
  shipment_id text not null unique,
  order_id text,
  property_id uuid references public.properties(id) on delete cascade,
  status text not null check (status in ('pending', 'handling', 'ready_to_ship', 'shipped', 'delivered', 'cancelled')) default 'pending',
  tracking_number text,
  tracking_url text,
  logistics_type text,
  date_created timestamptz,
  date_delivered timestamptz,
  received_at timestamptz not null default now(),
  payload jsonb
);

create index if not exists idx_ml_shipments_property_id on public.ml_shipments (property_id);
create index if not exists idx_ml_shipments_status on public.ml_shipments (status);

-- RLS
alter table public.ml_webhook_events enable row level security;
alter table public.ml_questions enable row level security;
alter table public.ml_orders enable row level security;
alter table public.ml_payments enable row level security;
alter table public.ml_shipments enable row level security;

-- Solo admins pueden ver eventos de webhook
create policy "Admins can view webhook events" on public.ml_webhook_events
  for select using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Admins can view questions" on public.ml_questions
  for select using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Admins can view orders" on public.ml_orders
  for select using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Admins can view payments" on public.ml_payments
  for select using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create policy "Admins can view shipments" on public.ml_shipments
  for select using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

-- Triggers para updated_at
create trigger trg_ml_webhook_events_updated_at
  before update on public.ml_webhook_events
  for each row execute function public.set_updated_at();

create trigger trg_ml_questions_updated_at
  before update on public.ml_questions
  for each row execute function public.set_updated_at();

create trigger trg_ml_orders_updated_at
  before update on public.ml_orders
  for each row execute function public.set_updated_at();

create trigger trg_ml_payments_updated_at
  before update on public.ml_payments
  for each row execute function public.set_updated_at();

create trigger trg_ml_shipments_updated_at
  before update on public.ml_shipments
  for each row execute function public.set_updated_at();