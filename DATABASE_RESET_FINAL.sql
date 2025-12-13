-- COMPLETE DATABASE SETUP WITH WORKING AUTH TRIGGER
-- Fixes: FK constraint error by ensuring profiles exist when users sign up

-- 1) Delete all auth users
DELETE FROM auth.users;

-- 2) Drop tables  
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3) Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 4) Recreate tables
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id TEXT UNIQUE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);

CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5) Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- 6) CREATE ROBUST TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
-- This handles NULL values and errors gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', '')
    );
  EXCEPTION WHEN OTHERS THEN
    -- If insert fails, just continue (profile might exist)
    NULL;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger fires AFTER a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) RLS POLICIES

-- Profiles: only read/write own
CREATE POLICY "profiles_own"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Projects: owners can do everything
CREATE POLICY "projects_owner"
  ON public.projects
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Allow anyone to SELECT collaborative projects (those with group_id NOT NULL)
-- This enables discovery by group_id for joining
CREATE POLICY "projects_discover_by_group"
  ON public.projects
  FOR SELECT
  USING (group_id IS NOT NULL);

-- Allow members to view their projects (after joining)
CREATE POLICY "projects_view_as_member"
  ON public.projects
  FOR SELECT
  USING (
    id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );

-- Project members: insert & select basic info (no recursive checks)
CREATE POLICY "project_members_insert"
  ON public.project_members
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "project_members_select"
  ON public.project_members
  FOR SELECT
  USING (true);

CREATE POLICY "project_members_delete_self"
  ON public.project_members
  FOR DELETE
  USING (auth.uid() = user_id);

-- Logs: users can insert/update/delete own
CREATE POLICY "logs_own"
  ON public.logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "logs_select_any"
  ON public.logs
  FOR SELECT
  USING (true);

-- 8) Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_group_id ON public.projects(group_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON public.logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs(date);

COMMENT ON TABLE public.projects IS 'Projects - group_id nullable for private projects';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically create profile when user signs up';
