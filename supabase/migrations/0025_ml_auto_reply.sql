-- 0025_ml_auto_reply.sql
-- Plantillas de auto-respuesta para Mercado Libre

create table if not exists public.ml_auto_reply_templates (
  id bigserial primary key,
  name text not null,
  trigger text not null
    check (trigger in ('new_question', 'new_order', 'order_paid', 'order_shipped', 'order_delivered')),
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ml_auto_reply_templates_trigger
  on public.ml_auto_reply_templates (trigger);
create index if not exists idx_ml_auto_reply_templates_active
  on public.ml_auto_reply_templates (is_active);

alter table public.ml_auto_reply_templates enable row level security;

-- Los admins (y staff) pueden gestionar las plantillas desde el panel
create policy "Admins can manage auto reply templates" on public.ml_auto_reply_templates
  for all using (
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active and role in ('super_admin', 'admin', 'staff')
    )
  );

create trigger trg_ml_auto_reply_templates_updated_at
  before update on public.ml_auto_reply_templates
  for each row execute function public.set_updated_at();
