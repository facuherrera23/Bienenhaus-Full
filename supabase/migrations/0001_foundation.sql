-- ============================================================================
-- 0001_foundation.sql
-- BIENENHAUS — Extensiones, enums y tipos base.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Estado de una propiedad en el sistema (no confundir con el estado en ML).
create type property_status as enum (
  'borrador',
  'en_revision',
  'publicada',
  'pausada',
  'vendida',
  'alquilada',
  'archivada'
);

-- Tipo de operación / listado.
create type listing_type as enum (
  'venta',
  'alquiler',
  'venta_alquiler',
  'emprendimiento'
);

-- Moneda de precio.
create type currency as enum ('USD', 'ARS');

-- Rol de usuario admin dentro del panel.
create type admin_role as enum ('super_admin', 'admin', 'staff', 'viewer');

-- Estado de un lead en el CRM.
create type lead_status as enum (
  'nuevo',
  'contactado',
  'calificado',
  'en_proceso',
  'cerrado_ganado',
  'cerrado_perdido'
);

-- Intención declarada por el lead (idéntico al campo del formulario de la landing).
create type lead_intent as enum (
  'comprar',
  'vender',
  'alquilar',
  'invertir',
  'tasar',
  'desarrollador',
  'otro'
);

-- Fuente de captación del lead.
create type lead_source as enum (
  'landing_form',
  'whatsapp',
  'telefono',
  'email',
  'referido',
  'ml_contacto',
  'manual'
);

-- Operaciones de sincronización con Mercado Libre.
create type ml_operation as enum (
  'publish',
  'update',
  'delete'
);

-- Estado de una cola de sincronización con ML.
create type ml_sync_status as enum (
  'pending',
  'processing',
  'success',
  'failed',
  'cancelled'
);

-- Tipo de contenido del sitio (EAV).
create type content_section as enum (
  'hero',
  'catalogo',
  'servicios',
  'equipo',
  'estadisticas',
  'proceso',
  'contacto',
  'footer',
  'meta'
);

-- Acciones registradas en activity_log.
create type audit_action as enum (
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'login',
  'logout',
  'ml_publish',
  'ml_update',
  'ml_delete',
  'ml_sync',
  'status_change'
);

-- ============================================================================
-- FUNCIÓN GLOBAL updated_at
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
