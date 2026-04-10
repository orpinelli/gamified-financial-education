-- Migration v2: avatar customization, budget planning, credit/impulse scores
-- Apply after 004-game-cards.sql

-- Avatar customization columns
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS avatar_hair   TEXT NOT NULL DEFAULT 'curto',
  ADD COLUMN IF NOT EXISTS avatar_skin   TEXT NOT NULL DEFAULT 'medio',
  ADD COLUMN IF NOT EXISTS avatar_outfit TEXT NOT NULL DEFAULT 'casual';

-- Monthly household budget (filled at MonthStartModal)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS budget_income_expected   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS budget_fixed_expenses    NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS budget_emergency_reserve NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS budget_savings_goal      NUMERIC(12,2);

-- Lifestyle level 1-7 (chosen at start of each month)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS lifestyle_level INTEGER NOT NULL DEFAULT 3;

-- Credit score (0-1000, starts at 600)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS credit_score INTEGER NOT NULL DEFAULT 600;

-- Impulse purchase counter (used for end-of-month profile)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS impulse_score INTEGER NOT NULL DEFAULT 0;

-- Tutorial shown flag (show TutorialModal only on first game)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS tutorial_shown BOOLEAN NOT NULL DEFAULT false;

-- Track pending deferred card (compra impulsiva applied next turn)
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS pending_deferred_card_id INTEGER REFERENCES game_cards(id);

-- game_day_logs: record which card was drawn and roulette roll
ALTER TABLE game_day_logs
  ADD COLUMN IF NOT EXISTS card_id          INTEGER REFERENCES game_cards(id),
  ADD COLUMN IF NOT EXISTS roulette_result  INTEGER,
  ADD COLUMN IF NOT EXISTS choice_index     INTEGER;
