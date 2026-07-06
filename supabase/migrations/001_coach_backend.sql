-- ============================================================
-- Coach Backend Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Coaches table (id matches Supabase auth.users.id)
CREATE TABLE IF NOT EXISTS coaches (
  id        UUID PRIMARY KEY,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE,
  is_admin  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Link members to coaches
ALTER TABLE members ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL;

-- 3. Coaching sessions logged by coaches
CREATE TABLE IF NOT EXISTS coach_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  member_id    UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT NOT NULL DEFAULT 'General Q&A',
  notes        TEXT,
  key_takeaway TEXT,
  next_steps   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Action items set by coaches for members
CREATE TABLE IF NOT EXISTS member_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  member_id    UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 5. Notifications for coaches
CREATE TABLE IF NOT EXISTS coach_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id   UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  member_id  UUID REFERENCES members(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_coach_id           ON members(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_coach       ON coach_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_member      ON coach_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_actions_coach       ON member_actions(coach_id);
CREATE INDEX IF NOT EXISTS idx_member_actions_member      ON member_actions(member_id);
CREATE INDEX IF NOT EXISTS idx_coach_notifications_unread ON coach_notifications(coach_id, read);
