-- Add monthly_choices JSONB column to store player's lifestyle decisions per month
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS monthly_choices JSONB NOT NULL DEFAULT '{}';
