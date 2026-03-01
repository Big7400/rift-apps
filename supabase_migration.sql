-- ============================================================
-- RIFT APPS — Supabase SQL Migration
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── SHARED TABLES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  app TEXT NOT NULL CHECK (app IN ('selfcare-pup', 'fitforge')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app)
);

-- ── SELFCARE PUP TABLES ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.puppies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT NOT NULL DEFAULT 'corgi',
  color TEXT NOT NULL DEFAULT 'golden',
  pronouns TEXT DEFAULT 'they/them',
  accessories TEXT[] DEFAULT '{}',
  background TEXT DEFAULT 'meadow',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'health',
  is_custom BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  xp_reward INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.goal_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  xp_earned INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, goal_id, date)
);

CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER DEFAULT 15,
  note TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FITFORGE TABLES ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fitness_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  fitness_level TEXT NOT NULL DEFAULT 'beginner',
  goals TEXT[] DEFAULT '{}',
  equipment TEXT[] DEFAULT '{}',
  days_per_week INTEGER DEFAULT 3 CHECK (days_per_week BETWEEN 1 AND 7),
  age INTEGER,
  weight_kg FLOAT,
  height_cm FLOAT,
  preferred_workout_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  equipment TEXT[] DEFAULT '{}',
  muscle_groups TEXT[] DEFAULT '{}',
  instructions TEXT DEFAULT '',
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight_kg FLOAT NOT NULL,
  reps INTEGER NOT NULL,
  one_rep_max FLOAT NOT NULL,
  is_pr BOOLEAN DEFAULT TRUE,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generated_by_ai BOOLEAN DEFAULT TRUE,
  days_per_week INTEGER DEFAULT 3,
  plan_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  day_name TEXT,
  exercises JSONB DEFAULT '[]',
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_puppies_user_id ON public.puppies(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_goal_completions_user_date ON public.goal_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON public.personal_records(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_app ON public.push_tokens(user_id, app);

-- ── SEED: EXERCISE LIBRARY ────────────────────────────────────

INSERT INTO public.exercises (name, category, equipment, muscle_groups, instructions) VALUES
-- CHEST
('Barbell Bench Press', 'chest', ARRAY['barbell','bench'], ARRAY['chest','triceps','shoulders'], 'Lie flat on bench, grip bar shoulder-width apart, lower to chest, press up explosively.'),
('Dumbbell Bench Press', 'chest', ARRAY['dumbbells','bench'], ARRAY['chest','triceps','shoulders'], 'Hold dumbbells at chest level, press up and slightly inward, lower with control.'),
('Push-Up', 'chest', ARRAY['bodyweight'], ARRAY['chest','triceps','shoulders'], 'Hands shoulder-width, body straight, lower chest to floor, push back up.'),
('Incline Barbell Press', 'chest', ARRAY['barbell','bench'], ARRAY['upper chest','triceps'], 'Set bench to 30-45 degrees, press barbell from upper chest.'),
('Cable Fly', 'chest', ARRAY['cables'], ARRAY['chest'], 'Set cables at chest height, arms wide, bring hands together in front of chest.'),
('Dips', 'chest', ARRAY['bodyweight','dip bar'], ARRAY['chest','triceps','shoulders'], 'Lean slightly forward, lower until elbows at 90 degrees, push up.'),

-- BACK
('Pull-Up', 'back', ARRAY['bodyweight','pull-up bar'], ARRAY['lats','biceps','upper back'], 'Hang with palms facing away, pull chest to bar, lower with control.'),
('Barbell Row', 'back', ARRAY['barbell'], ARRAY['lats','middle back','biceps'], 'Hinge at hips, pull barbell to lower chest, squeeze shoulder blades.'),
('Dumbbell Row', 'back', ARRAY['dumbbells','bench'], ARRAY['lats','middle back'], 'One hand on bench, pull dumbbell to hip, keep back flat.'),
('Lat Pulldown', 'back', ARRAY['cables'], ARRAY['lats','biceps'], 'Grip bar wide, pull to upper chest, squeeze lats at bottom.'),
('Deadlift', 'back', ARRAY['barbell'], ARRAY['lower back','glutes','hamstrings','upper back'], 'Hip-hinge with neutral spine, drive through heels, lock out hips at top.'),
('Seated Cable Row', 'back', ARRAY['cables'], ARRAY['middle back','lats','biceps'], 'Sit upright, pull handle to abdomen, squeeze shoulder blades.'),
('Face Pull', 'back', ARRAY['cables'], ARRAY['rear delts','upper back'], 'Set cable at head height, pull to face with elbows high.'),

-- SHOULDERS
('Overhead Press', 'shoulders', ARRAY['barbell'], ARRAY['shoulders','triceps'], 'Press barbell from shoulders overhead to lockout. Core tight.'),
('Dumbbell Shoulder Press', 'shoulders', ARRAY['dumbbells'], ARRAY['shoulders','triceps'], 'Press dumbbells from ear level to overhead.'),
('Lateral Raise', 'shoulders', ARRAY['dumbbells'], ARRAY['lateral delts'], 'Raise dumbbells to shoulder height with slight elbow bend.'),
('Front Raise', 'shoulders', ARRAY['dumbbells'], ARRAY['front delts'], 'Raise dumbbells straight in front to shoulder height.'),
('Arnold Press', 'shoulders', ARRAY['dumbbells'], ARRAY['shoulders','triceps'], 'Start with palms facing you, rotate out as you press overhead.'),

-- ARMS
('Barbell Curl', 'arms', ARRAY['barbell'], ARRAY['biceps'], 'Curl barbell from hips to chest, elbows at sides.'),
('Dumbbell Curl', 'arms', ARRAY['dumbbells'], ARRAY['biceps'], 'Alternate curling dumbbells to shoulders, supinate wrist at top.'),
('Hammer Curl', 'arms', ARRAY['dumbbells'], ARRAY['biceps','brachialis'], 'Curl with neutral grip, thumbs pointing up throughout.'),
('Tricep Pushdown', 'arms', ARRAY['cables'], ARRAY['triceps'], 'Push cable down until arms straight, elbows at sides.'),
('Skull Crusher', 'arms', ARRAY['barbell','bench'], ARRAY['triceps'], 'Lie on bench, lower barbell to forehead, extend up.'),
('Close-Grip Bench Press', 'arms', ARRAY['barbell','bench'], ARRAY['triceps','chest'], 'Bench press with hands shoulder-width, emphasize triceps.'),

-- LEGS
('Barbell Squat', 'legs', ARRAY['barbell','squat rack'], ARRAY['quads','glutes','hamstrings'], 'Bar on traps, squat to parallel or below, drive through heels.'),
('Romanian Deadlift', 'legs', ARRAY['barbell'], ARRAY['hamstrings','glutes','lower back'], 'Hinge at hips, lower bar along legs, feel hamstring stretch, drive hips forward.'),
('Leg Press', 'legs', ARRAY['gym'], ARRAY['quads','glutes'], 'Press platform away, feet hip-width, lower until 90 degrees.'),
('Bulgarian Split Squat', 'legs', ARRAY['dumbbells','bench'], ARRAY['quads','glutes'], 'Rear foot elevated, lunge down until knee near floor.'),
('Leg Curl', 'legs', ARRAY['gym'], ARRAY['hamstrings'], 'Curl leg toward glutes, squeeze at top, lower with control.'),
('Calf Raise', 'legs', ARRAY['bodyweight'], ARRAY['calves'], 'Rise on toes, hold at top, lower fully.'),
('Hip Thrust', 'legs', ARRAY['barbell','bench'], ARRAY['glutes','hamstrings'], 'Shoulders on bench, drive hips up with barbell on lap.'),
('Goblet Squat', 'legs', ARRAY['dumbbells'], ARRAY['quads','glutes'], 'Hold dumbbell at chest, squat deep with upright torso.'),

-- CORE
('Plank', 'core', ARRAY['bodyweight'], ARRAY['core','shoulders'], 'Hold straight-body position on forearms or hands.'),
('Crunch', 'core', ARRAY['bodyweight'], ARRAY['abs'], 'Curl upper back off floor, squeeze abs at top.'),
('Hanging Leg Raise', 'core', ARRAY['pull-up bar'], ARRAY['abs','hip flexors'], 'Hang from bar, raise legs to 90 degrees or higher.'),
('Russian Twist', 'core', ARRAY['bodyweight'], ARRAY['obliques'], 'Sit at 45 degrees, rotate torso side to side.'),
('Ab Wheel Rollout', 'core', ARRAY['ab wheel'], ARRAY['abs','core'], 'Roll wheel out while keeping core braced, roll back.'),

-- CARDIO
('Running', 'cardio', ARRAY['bodyweight'], ARRAY['cardiovascular','legs'], 'Maintain comfortable pace, land midfoot.'),
('Cycling', 'cardio', ARRAY['bike'], ARRAY['cardiovascular','legs'], 'Maintain steady cadence, adjust resistance as needed.'),
('Jump Rope', 'cardio', ARRAY['jump rope'], ARRAY['cardiovascular','calves'], 'Keep elbows close, jump with both feet or alternate.'),
('Rowing Machine', 'cardio', ARRAY['gym'], ARRAY['cardiovascular','back','arms'], 'Drive with legs first, then lean back, then pull arms.')

ON CONFLICT (name) DO NOTHING;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Enable RLS on all user tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puppies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (our FastAPI uses service role key)
-- Frontend apps use anon key with JWT — add user-specific policies here if using direct Supabase client from app
