-- 0064: ml_item_id bigint/int → text (C1)
--
-- Los IDs de items de Mercado Libre son strings ("MLA123456789"), no números.
-- ml-sync guardaba `Number(item.id)` = NaN → NULL y el webhook usaba
-- `mlItemId ?? 0` como fallback; con tipo text se persiste el ID real.
--
-- Se elimina NOT NULL en ml_questions/ml_orders: una pregunta/orden puede
-- llegar por webhook sin item resuelto (o con item inexistente en el sitio).

alter table public.ml_sync_queue
  alter column ml_item_id type text using ml_item_id::text;

alter table public.property_ml_meta
  alter column ml_item_id type text using ml_item_id::text;

alter table public.ml_questions
  alter column ml_item_id drop not null,
  alter column ml_item_id type text using ml_item_id::text;

alter table public.ml_orders
  alter column ml_item_id drop not null,
  alter column ml_item_id type text using ml_item_id::text;

alter table public.ml_sync_dead_letter
  alter column ml_item_id type text using ml_item_id::text;

-- Limpieza: fallbacks residuales '0' del webhook → NULL
update public.ml_sync_queue set ml_item_id = null where ml_item_id = '0';
update public.property_ml_meta set ml_item_id = null where ml_item_id = '0';
update public.ml_questions set ml_item_id = null where ml_item_id = '0';
update public.ml_orders set ml_item_id = null where ml_item_id = '0';
update public.ml_sync_dead_letter set ml_item_id = null where ml_item_id = '0';
