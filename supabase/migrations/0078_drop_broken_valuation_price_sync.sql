-- ============================================================================
-- 0078_drop_broken_valuation_price_sync.sql
-- Drop the broken trigger/function from 0069.
--
-- sync_property_price_from_valuation() references NEW.status,
-- NEW.estimated_value, and NEW.property_id — none of which exist on
-- property_valuations.  The function compiles (PL/pgSQL is lazy) but
-- crashes at runtime, causing every UPDATE on property_valuations to fail.
--
-- The concept (sync valuation price -> property) also needs a property_id
-- FK that was never added to the table.  Drop for now; re-implement when
-- the valuation<->property link is designed.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_sync_valuation_price ON public.property_valuations;
DROP FUNCTION IF EXISTS public.sync_property_price_from_valuation();
