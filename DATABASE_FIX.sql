-- COMPREHENSIVE FIX SCRIPT
-- Run this in Supabase SQL Editor

-- 1. Fix Profiles Schema (Missing Columns)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_status text DEFAULT 'offline';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Update defaults
UPDATE public.profiles SET activity_status = 'offline' WHERE activity_status IS NULL;
UPDATE public.profiles SET last_active_at = now() WHERE last_active_at IS NULL;

-- 2. ENABLE REALTIME REPLICATION (Critical for Logs/Members updates)
-- Checking if publication exists, then adding tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 3. Fix RLS Policies (Ensure data is accessible)
-- Profiles: Allow read for everyone
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Profiles: Allow update for own profile
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Reload Schema Cache (Must be last)
NOTIFY pgrst, 'reload config';
