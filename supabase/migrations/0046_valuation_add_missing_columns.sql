-- ============================================================================
-- 0046_valuation_add_missing_columns.sql
-- BIENENHAUS — Módulo Tasar: columnas faltantes detectadas al implementar
-- valuationService.ts (paso 4 de architecture.md).
-- El contrato Zod (valuationSchemas.ts, source of truth) incluye dos inputs
-- que la migración 0044 no persistía:
--   - ac_dispersion  → input del Análisis Comparativo (% dispersión, default 10)
--   - observaciones  → texto libre de la sección Observaciones
-- Sin estas columnas, guardar una tasación perdía esos datos silenciosamente.
-- ============================================================================

alter table public.property_valuations
  add column ac_dispersion numeric default 10
    check (ac_dispersion >= 0 and ac_dispersion <= 100);

alter table public.property_valuations
  add column observaciones text;
