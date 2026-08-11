-- ============================================================================
-- 0016_fix_ml_triggers.sql
-- BIENENHAUS �?" Fix: los triggers ML usan search_path = '' pero referenciaban
-- el tipo property_status sin calificar. Se recalifican a public.property_status.
-- ============================================================================

create or replace function public.ml_auto_publish()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'publicada'::public.property_status
     and old.status is distinct from new.status
  then
    perform public.ml_enqueue(new.id, 'publish', true);
  end if;
  return new;
end;
$$;

create or replace function public.ml_auto_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item_id bigint;
begin
  if old.status <> 'publicada'::public.property_status
     and new.status <> 'publicada'::public.property_status
  then
    return new;
  end if;

  select ml_item_id into v_item_id
    from public.property_ml_meta
    where property_id = new.id;

  if v_item_id is null then
    return new;
  end if;

  if new.title is distinct from old.title
     or new.description is distinct from old.description
     or new.price is distinct from old.price
     or new.currency is distinct from old.currency
     or new.listing_type is distinct from old.listing_type
     or new.area_total is distinct from old.area_total
     or new.area_covered is distinct from old.area_covered
     or new.bedrooms is distinct from old.bedrooms
     or new.bathrooms is distinct from old.bathrooms
     or new.garages is distinct from old.garages
  then
    perform public.ml_enqueue(new.id, 'update', true);
  end if;

  return new;
end;
$$;
