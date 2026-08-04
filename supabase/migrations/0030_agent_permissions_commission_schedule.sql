-- 0030_agent_permissions_commission_schedule.sql
-- Add agent permissions, commission and schedule columns used by the admin CRM (agents.ts, AgentFormPage.tsx)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS commission jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb;