-- 0021_internal_chat.sql
-- Internal chat system for agents

-- Chat channels/conversations
CREATE TYPE chat_channel_type AS ENUM ('direct', 'group', 'property', 'lead');

CREATE TABLE IF NOT EXISTS chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type chat_channel_type NOT NULL DEFAULT 'direct',
  name text, -- for group channels
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS chat_channels_type_idx ON chat_channels (type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chat_channels_property_idx ON chat_channels (property_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chat_channels_lead_idx ON chat_channels (lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chat_channels_deleted_at_idx ON chat_channels (deleted_at) WHERE deleted_at IS NOT NULL;

-- Channel participants (many-to-many)
CREATE TABLE IF NOT EXISTS chat_channel_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  notifications_enabled boolean DEFAULT true,
  UNIQUE (channel_id, agent_id)
);

CREATE INDEX IF NOT EXISTS chat_participants_agent_idx ON chat_channel_participants (agent_id);
CREATE INDEX IF NOT EXISTS chat_participants_channel_idx ON chat_channel_participants (channel_id);

-- Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text', -- 'text', 'system', 'file', 'image'
  file_url text,
  file_name text,
  file_size int,
  reply_to_id uuid REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS chat_messages_channel_created_idx ON chat_messages (channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chat_messages_sender_idx ON chat_messages (sender_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chat_messages_reply_idx ON chat_messages (reply_to_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS chat_messages_deleted_at_idx ON chat_messages (deleted_at) WHERE deleted_at IS NOT NULL;

-- Message read receipts
CREATE TABLE IF NOT EXISTS chat_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, agent_id)
);

CREATE INDEX IF NOT EXISTS chat_reads_agent_idx ON chat_message_reads (agent_id);
CREATE INDEX IF NOT EXISTS chat_reads_message_idx ON chat_message_reads (message_id);

-- RLS
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reads ENABLE ROW LEVEL SECURITY;

-- Chat channels policies
CREATE POLICY "chat_channels_staff_all" ON chat_channels
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "chat_channels_participant_select" ON chat_channels
  FOR SELECT USING (
    id IN (
      SELECT channel_id FROM chat_channel_participants
      WHERE agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
    )
  );

CREATE POLICY "chat_channels_participant_insert" ON chat_channels
  FOR INSERT WITH CHECK (
    created_by IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

-- Channel participants policies
CREATE POLICY "chat_participants_staff_all" ON chat_channel_participants
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "chat_participants_own_select" ON chat_channel_participants
  FOR SELECT USING (
    agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

CREATE POLICY "chat_participants_own_insert" ON chat_channel_participants
  FOR INSERT WITH CHECK (
    agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

-- Messages policies
CREATE POLICY "chat_messages_staff_all" ON chat_messages
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "chat_messages_participant_select" ON chat_messages
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM chat_channel_participants
      WHERE agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
    )
  );

CREATE POLICY "chat_messages_participant_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
    AND channel_id IN (
      SELECT channel_id FROM chat_channel_participants
      WHERE agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
    )
  );

CREATE POLICY "chat_messages_sender_update" ON chat_messages
  FOR UPDATE USING (
    sender_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  ) WITH CHECK (
    sender_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

CREATE POLICY "chat_messages_sender_delete" ON chat_messages
  FOR DELETE USING (
    sender_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

-- Message reads policies
CREATE POLICY "chat_reads_staff_all" ON chat_message_reads
  FOR ALL USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "chat_reads_own_select" ON chat_message_reads
  FOR SELECT USING (
    agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

CREATE POLICY "chat_reads_own_insert" ON chat_message_reads
  FOR INSERT WITH CHECK (
    agent_id IN (SELECT id FROM admin_users WHERE id = auth.uid() AND is_active)
  );

-- Triggers
CREATE TRIGGER chat_channels_set_updated_at
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER chat_messages_set_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();