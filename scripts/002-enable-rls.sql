-- RLS policies for Supabase Auth usage
-- Safe to run multiple times

-- Helper functions to map Supabase JWT -> local app user
CREATE OR REPLACE FUNCTION public.current_auth_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() ->> 'email', ''),
    NULLIF(current_setting('request.jwt.claim.email', true), '')
  )
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT u.id
  FROM users u
  WHERE lower(u.email) = lower(public.current_auth_email())
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT u.role
  FROM users u
  WHERE u.id = public.current_app_user_id()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_app_school_id()
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT u.school_id
  FROM users u
  WHERE u.id = public.current_app_user_id()
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_auth_email() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_school_id() TO anon, authenticated;

-- Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_day_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to keep migration idempotent
DROP POLICY IF EXISTS schools_select_own ON schools;
DROP POLICY IF EXISTS schools_admin_update_own ON schools;

DROP POLICY IF EXISTS users_select_self ON users;
DROP POLICY IF EXISTS users_update_self ON users;
DROP POLICY IF EXISTS users_admin_select_school ON users;

DROP POLICY IF EXISTS classrooms_select_school_staff ON classrooms;
DROP POLICY IF EXISTS classrooms_admin_insert_school ON classrooms;
DROP POLICY IF EXISTS classrooms_admin_update_school ON classrooms;
DROP POLICY IF EXISTS classrooms_admin_delete_school ON classrooms;

DROP POLICY IF EXISTS classroom_teachers_select_school_staff ON classroom_teachers;
DROP POLICY IF EXISTS classroom_teachers_admin_manage_school ON classroom_teachers;

DROP POLICY IF EXISTS classroom_students_select_school_staff ON classroom_students;
DROP POLICY IF EXISTS classroom_students_admin_prof_manage_school ON classroom_students;

DROP POLICY IF EXISTS game_sessions_select_own ON game_sessions;
DROP POLICY IF EXISTS game_sessions_insert_own ON game_sessions;
DROP POLICY IF EXISTS game_sessions_update_own ON game_sessions;
DROP POLICY IF EXISTS game_sessions_delete_own ON game_sessions;

DROP POLICY IF EXISTS game_day_logs_select_own_session ON game_day_logs;
DROP POLICY IF EXISTS game_day_logs_insert_own_session ON game_day_logs;
DROP POLICY IF EXISTS game_day_logs_update_own_session ON game_day_logs;
DROP POLICY IF EXISTS game_day_logs_delete_own_session ON game_day_logs;

-- Schools
CREATE POLICY schools_select_own
ON schools FOR SELECT
TO authenticated
USING (id = public.current_app_school_id());

CREATE POLICY schools_admin_update_own
ON schools FOR UPDATE
TO authenticated
USING (
  id = public.current_app_school_id()
  AND public.current_app_user_role() = 'ADMIN'
)
WITH CHECK (
  id = public.current_app_school_id()
  AND public.current_app_user_role() = 'ADMIN'
);

-- Users
CREATE POLICY users_select_self
ON users FOR SELECT
TO authenticated
USING (id = public.current_app_user_id());

CREATE POLICY users_update_self
ON users FOR UPDATE
TO authenticated
USING (id = public.current_app_user_id())
WITH CHECK (id = public.current_app_user_id());

CREATE POLICY users_admin_select_school
ON users FOR SELECT
TO authenticated
USING (
  public.current_app_user_role() = 'ADMIN'
  AND school_id IS NOT DISTINCT FROM public.current_app_school_id()
);

-- Classrooms
CREATE POLICY classrooms_select_school_staff
ON classrooms FOR SELECT
TO authenticated
USING (
  school_id = public.current_app_school_id()
  AND public.current_app_user_role() IN ('ADMIN', 'PROFESSOR')
);

CREATE POLICY classrooms_admin_insert_school
ON classrooms FOR INSERT
TO authenticated
WITH CHECK (
  school_id = public.current_app_school_id()
  AND public.current_app_user_role() = 'ADMIN'
);

CREATE POLICY classrooms_admin_update_school
ON classrooms FOR UPDATE
TO authenticated
USING (
  school_id = public.current_app_school_id()
  AND public.current_app_user_role() = 'ADMIN'
)
WITH CHECK (
  school_id = public.current_app_school_id()
  AND public.current_app_user_role() = 'ADMIN'
);

CREATE POLICY classrooms_admin_delete_school
ON classrooms FOR DELETE
TO authenticated
USING (
  school_id = public.current_app_school_id()
  AND public.current_app_user_role() = 'ADMIN'
);

-- Classroom teachers
CREATE POLICY classroom_teachers_select_school_staff
ON classroom_teachers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE c.id = classroom_teachers.classroom_id
      AND c.school_id = public.current_app_school_id()
      AND public.current_app_user_role() IN ('ADMIN', 'PROFESSOR')
  )
);

CREATE POLICY classroom_teachers_admin_manage_school
ON classroom_teachers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE c.id = classroom_teachers.classroom_id
      AND c.school_id = public.current_app_school_id()
      AND public.current_app_user_role() = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE c.id = classroom_teachers.classroom_id
      AND c.school_id = public.current_app_school_id()
      AND public.current_app_user_role() = 'ADMIN'
  )
);

-- Classroom students
CREATE POLICY classroom_students_select_school_staff
ON classroom_students FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE c.id = classroom_students.classroom_id
      AND c.school_id = public.current_app_school_id()
      AND public.current_app_user_role() IN ('ADMIN', 'PROFESSOR')
  )
);

CREATE POLICY classroom_students_admin_prof_manage_school
ON classroom_students FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE c.id = classroom_students.classroom_id
      AND c.school_id = public.current_app_school_id()
      AND public.current_app_user_role() IN ('ADMIN', 'PROFESSOR')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM classrooms c
    WHERE c.id = classroom_students.classroom_id
      AND c.school_id = public.current_app_school_id()
      AND public.current_app_user_role() IN ('ADMIN', 'PROFESSOR')
  )
);

-- Game sessions
CREATE POLICY game_sessions_select_own
ON game_sessions FOR SELECT
TO authenticated
USING (user_id = public.current_app_user_id());

CREATE POLICY game_sessions_insert_own
ON game_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY game_sessions_update_own
ON game_sessions FOR UPDATE
TO authenticated
USING (user_id = public.current_app_user_id())
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY game_sessions_delete_own
ON game_sessions FOR DELETE
TO authenticated
USING (user_id = public.current_app_user_id());

-- Game day logs
CREATE POLICY game_day_logs_select_own_session
ON game_day_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_day_logs.game_session_id
      AND gs.user_id = public.current_app_user_id()
  )
);

CREATE POLICY game_day_logs_insert_own_session
ON game_day_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_day_logs.game_session_id
      AND gs.user_id = public.current_app_user_id()
  )
);

CREATE POLICY game_day_logs_update_own_session
ON game_day_logs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_day_logs.game_session_id
      AND gs.user_id = public.current_app_user_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_day_logs.game_session_id
      AND gs.user_id = public.current_app_user_id()
  )
);

CREATE POLICY game_day_logs_delete_own_session
ON game_day_logs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM game_sessions gs
    WHERE gs.id = game_day_logs.game_session_id
      AND gs.user_id = public.current_app_user_id()
  )
);
