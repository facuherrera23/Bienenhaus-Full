-- ============================================================================
-- 0074_enable_rls_all_tables.sql
-- Enable Row Level Security on all tables that have RLS policies
-- Fix: Tables had RLS policies but lacked table-level ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Core tables with RLS policies (from 0007_rls_triggers_seed.sql, 0037_security_hardening.sql, etc.)
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ml_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ml_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ml_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_ml_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags ENABLE ROW LEVEL SECURITY;

-- Owners module (0032_owners_module.sql)
ALTER TABLE IF EXISTS public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_price_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.action_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owner_reports ENABLE ROW LEVEL SECURITY;

-- Valuation module (0044_valuation.sql)
ALTER TABLE IF EXISTS public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.valuation_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.valuation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.valuation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.geocode_cache ENABLE ROW LEVEL SECURITY;

-- Already have RLS enabled (from previous migrations):
-- visits, agent_availability, visit_reminders (0020_visits_calendar.sql)
-- chat_channels, chat_channel_participants, chat_messages, chat_message_reads (0021_internal_chat.sql)
-- agent_property_assignments (0068_agent_property_assignments.sql)

-- Verify RLS is enabled on key tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
            'properties', 'leads', 'agents', 'admin_users', 'newsletter_subscribers',
            'ml_connection', 'ml_sync_queue', 'ml_sync_history', 'property_ml_meta',
            'categories', 'property_types', 'locations', 'features',
            'property_images', 'property_videos', 'property_features', 'property_tags', 'tags',
            'owners', 'property_owners', 'property_price_analyses',
            'property_action_plans', 'action_plan_tasks', 'owner_communications', 'owner_reports',
            'property_valuations', 'valuation_comparables', 'valuation_images',
            'valuation_history', 'geocode_cache',
            'visits', 'agent_availability', 'visit_reminders',
            'chat_channels', 'chat_channel_participants', 'chat_messages', 'chat_message_reads',
            'agent_property_assignments'
        )
    LOOP
        IF r.rowsecurity THEN
            RAISE NOTICE 'RLS ENABLED: %', r.tablename;
        ELSE
            RAISE WARNING 'RLS DISABLED (unexpected): %', r.tablename;
        END IF;
    END LOOP;
END $$;