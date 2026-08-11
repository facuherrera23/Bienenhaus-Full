-- 0020_visits_calendar.sql
-- Visits/Appointments calendar system

-- Visit status enum
CREATE TYPE visit_status AS ENUM (
  'programada',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_show'
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status visit_status NOT NULL DEFAULT 'programada',
  location text,
  meeting_type text, -- 'presencial', 'virtual', 'telefono'
  meeting_link text, -- zoom/meet link if virtual
  notes text,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS visits_agent_starts_idx ON visits (agent_id, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS visits_lead_idx ON visits (lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS visits_property_idx ON visits (property_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS visits_status_idx ON visits (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS visits_starts_at_idx ON visits (starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS visits_deleted_at_idx ON visits (deleted_at) WHERE deleted_at IS NOT NULL;

-- Agent availability/schedule
CREATE TABLE IF NOT EXISTS agent_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS agent_availability_agent_idx ON agent_availability (agent_id) WHERE is_active;

-- Visit reminders log
CREATE TABLE IF NOT EXISTS visit_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  type text NOT NULL, -- '24h', '1h', 'custom'
  sent_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL, -- 'whatsapp', 'email', 'sms'
  status text NOT NULL, -- 'sent', 'failed'
  error_message text
);

CREATE INDEX IF NOT EXISTS visit_reminders_visit_idx ON visit_reminders (visit_id);

-- RLS Policies
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_reminders ENABLE ROW LEVEL SECURITY;

-- Visits policies
CREATE POLICY "visits_staff_all" ON visits
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "visits_agent_own_select" ON visits
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

CREATE POLICY "visits_agent_own_insert" ON visits
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

CREATE POLICY "visits_agent_own_update" ON visits
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

-- Agent availability policies
CREATE POLICY "availability_staff_all" ON agent_availability
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "availability_agent_own_select" ON agent_availability
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

CREATE POLICY "availability_agent_own_insert" ON agent_availability
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

CREATE POLICY "availability_agent_own_update" ON agent_availability
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

CREATE POLICY "availability_agent_own_delete" ON agent_availability
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE id = agent_id AND is_active)
  );

-- Visit reminders policies
CREATE POLICY "reminders_staff_all" ON visit_reminders
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- Updated at trigger
CREATE TRIGGER visits_set_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER agent_availability_set_updated_at
  BEFORE UPDATE ON agent_availability
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();