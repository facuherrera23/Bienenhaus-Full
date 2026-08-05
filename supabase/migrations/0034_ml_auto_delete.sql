-- ============================================================================
-- 0034_ml_auto_delete.sql
-- BIENENHAUS — Fase B: baja automática en Mercado Libre.
-- Cuando una propiedad publicada en ML sale del estado 'publicada'
-- (pausa, venta, cambio de estado) o se envía a la papelera (deleted_at),
-- se encola la operación 'delete' para cerrar el anuncio en ML.
-- Además, ml_auto_update deja de encolar 'update' en esas transiciones
-- (evita encolar update + delete para el mismo cambio).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ml_auto_delete: encola 'delete' cuando la propiedad deja de estar
-- publicada o se envía a la papelera, solo si tiene anuncio activo en ML.
-- ---------------------------------------------------------------------------
create or replace function public.ml_auto_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item_id bigint;
begin
  -- Solo interesa si el anuncio estaba publicado (activo en ML).
  if old.status <> 'publicada'::public.property_status then
    return new;
  end if;

  -- Sigue publicada y sin soft delete: no hay nada que bajar.
  if new.status = old.status and new.deleted_at is null then
    return new;
  end if;

  -- Solo encolar si tiene un item publicado en ML.
  select ml_item_id into v_item_id
    from public.property_ml_meta
    where property_id = new.id
      and ml_item_id is not null
    limit 1;

  if v_item_id is null then
    return new;
  end if;

  perform public.ml_enqueue(new.id, 'delete', true);
  return new;
end;
$$;

create trigger properties_ml_auto_delete
  after update of status, deleted_at on public.properties
  for each row
  execute function public.ml_auto_delete();

-- ---------------------------------------------------------------------------
-- ml_auto_update: no encolar 'update' cuando la propiedad sale de
-- 'publicada' o va a la papelera (eso lo gestiona ml_auto_delete).
-- ---------------------------------------------------------------------------
create or replace function public.ml_auto_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item_id bigint;
begin
  -- Salió de 'publicada' o fue a la papelera: lo maneja ml_auto_delete.
  if (old.status = 'publicada'::public.property_status
      and new.status is distinct from old.status)
     or new.deleted_at is not null
  then
    return new;
  end if;

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
