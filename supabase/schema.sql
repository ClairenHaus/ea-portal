-- EA Portal Schema
-- Run this in Supabase SQL Editor for the EA Portal project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  business_name TEXT,
  phone TEXT,

  -- Onboarding
  pilot_start_date DATE,
  pilot_end_date DATE,
  onboarding_status TEXT DEFAULT 'pending'
    CHECK (onboarding_status IN ('pending', 'oauth_connected', 'telegram_connected', 'active', 'paused', 'completed')),

  -- Preferences
  timezone TEXT DEFAULT 'America/New_York',
  notification_channels TEXT[] DEFAULT ARRAY['email'],
  briefing_time_morning TEXT DEFAULT '07:00',
  briefing_time_evening TEXT DEFAULT '18:00',

  -- CRM
  hubspot_contact_id TEXT,
  stripe_customer_id TEXT,
  google_drive_folder_id TEXT,

  -- Auth
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- OAUTH TOKENS (client Gmail + Calendar)
-- ─────────────────────────────────────────
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  provider TEXT NOT NULL DEFAULT 'google'
    CHECK (provider IN ('google', 'microsoft')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  scopes TEXT[],
  connected_email TEXT
);

-- ─────────────────────────────────────────
-- TELEGRAM SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE telegram_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  bot_token TEXT NOT NULL,
  bot_username TEXT NOT NULL,
  chat_id BIGINT,
  connected BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- ACTIVITY LOG
-- ─────────────────────────────────────────
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  action_type TEXT NOT NULL
    CHECK (action_type IN (
      'email_triaged', 'email_drafted', 'email_sent',
      'calendar_checked', 'meeting_prepped',
      'morning_briefing', 'evening_debrief', 'weekly_recap',
      'client_message', 'ea_response',
      'crm_updated', 'hubspot_logged'
    )),
  summary TEXT NOT NULL,
  detail JSONB,
  source TEXT DEFAULT 'system'
    CHECK (source IN ('system', 'client', 'operator'))
);

-- ─────────────────────────────────────────
-- BRIEFINGS (stored for dashboard history)
-- ─────────────────────────────────────────
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  type TEXT NOT NULL
    CHECK (type IN ('morning', 'evening', 'weekly')),
  content TEXT NOT NULL,
  delivered_via TEXT[],
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- OPERATOR (Miche's account)
-- ─────────────────────────────────────────
CREATE TABLE operator_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_user_id UUID REFERENCES auth.users(id),
  telegram_alert_chat_id BIGINT,
  notification_email TEXT DEFAULT 'michelle@clairenhaus.com'
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_settings ENABLE ROW LEVEL SECURITY;

-- Clients can only see their own data
CREATE POLICY "client_own_data" ON clients
  FOR ALL USING (auth.uid() = supabase_user_id);

CREATE POLICY "client_own_tokens" ON oauth_tokens
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "client_own_telegram" ON telegram_sessions
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "client_own_activity" ON activity_log
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE supabase_user_id = auth.uid())
  );

CREATE POLICY "client_own_briefings" ON briefings
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE supabase_user_id = auth.uid())
  );

-- Service role bypass (for n8n and Hetzner agents)
CREATE POLICY "service_role_all_clients" ON clients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_tokens" ON oauth_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_telegram" ON telegram_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_activity" ON activity_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_briefings" ON briefings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_operator" ON operator_settings
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

