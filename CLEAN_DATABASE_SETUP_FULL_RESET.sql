-- FULL RESET: DELETE ALL USERS AND RECREATE SCHEMA
-- WARNING: This WILL DELETE ALL AUTH USERS and ALL RELATED DATA.
-- Run ONLY if you explicitly want a completely fresh start.

-- 0) Recommended: backup any data you want to keep before running this script.

-- 1) Delete all auth users (this cascades to profiles/projects/logs if FK CASCADE is set)
-- Note: In Supabase, deleting from auth.users requires service_role key or running in SQL Editor with sufficient permissions.
DELETE FROM auth.users;

-- 2) Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3) Recreate schema
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

-- 4) Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- 5) Simplified policies (safe)
-- Profiles
CREATE POLICY profiles_allow_read_own
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY profiles_allow_update_own
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY profiles_allow_insert
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Projects
CREATE POLICY projects_allow_select_own_or_member
  ON public.projects FOR SELECT
  USING (
    auth.uid() = owner_id OR
    id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );

CREATE POLICY projects_allow_insert
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY projects_allow_update_owner
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY projects_allow_delete_owner
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- Project members
CREATE POLICY project_members_allow_select
  ON public.project_members FOR SELECT
  USING (
    user_id = auth.uid() OR project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY project_members_allow_insert
  ON public.project_members FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid()));

CREATE POLICY project_members_allow_delete
  ON public.project_members FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid()));

-- Logs
CREATE POLICY logs_allow_select
  ON public.logs FOR SELECT
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid()) OR
    project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );

CREATE POLICY logs_allow_insert
  ON public.logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid()) OR
      project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY logs_allow_update_own
  ON public.logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY logs_allow_delete_own
  ON public.logs FOR DELETE
  USING (auth.uid() = user_id);

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_group_id ON public.projects(group_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON public.logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs(date);

-- Done
COMMENT ON TABLE public.projects IS 'Projects table for app - group_id is nullable for private projects';
