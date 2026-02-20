-- Create types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'PROFESSOR', 'ALUNO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('ACTIVE', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('FREE', 'INDIVIDUAL', 'ESCOLAR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan_type plan_type NOT NULL DEFAULT 'ESCOLAR',
  plan_price NUMERIC(10, 2) NOT NULL DEFAULT 399.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'ALUNO',
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  plan_type plan_type NOT NULL DEFAULT 'FREE',
  plan_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan_type plan_type NOT NULL DEFAULT 'ESCOLAR';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan_price NUMERIC(10, 2) NOT NULL DEFAULT 399.00;

ALTER TABLE users ALTER COLUMN school_id DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_school_id_fkey;
ALTER TABLE users
  ADD CONSTRAINT users_school_id_fkey
  FOREIGN KEY (school_id)
  REFERENCES schools(id)
  ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type plan_type NOT NULL DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classroom teachers (N:N)
CREATE TABLE IF NOT EXISTS classroom_teachers (
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (classroom_id, user_id)
);

-- Classroom students (N:N)
CREATE TABLE IF NOT EXISTS classroom_students (
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (classroom_id, user_id)
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_name VARCHAR(255) NOT NULL,
  profession_id VARCHAR(50) NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 1,
  money NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
  knowledge INTEGER NOT NULL DEFAULT 20,
  happiness INTEGER NOT NULL DEFAULT 70,
  energy INTEGER NOT NULL DEFAULT 100,
  health INTEGER NOT NULL DEFAULT 100,
  status game_status NOT NULL DEFAULT 'ACTIVE',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game day logs
CREATE TABLE IF NOT EXISTS game_day_logs (
  id SERIAL PRIMARY KEY,
  game_session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  choice_made VARCHAR(255),
  dice_result INTEGER,
  effects_applied JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_day_logs_session ON game_day_logs(game_session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_students_user ON classroom_students(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_teachers_user ON classroom_teachers(user_id);
