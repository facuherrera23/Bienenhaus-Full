-- 0027_ml_orders_auto_reply.sql
-- Trazabilidad de auto-respuestas enviadas para órdenes.

alter table public.ml_orders
  add column if not exists auto_reply_sent timestamptz;
