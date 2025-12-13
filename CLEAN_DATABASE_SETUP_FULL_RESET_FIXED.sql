-- FULL RESET WITH FIXED RLS (NO INFINITE RECURSION)
-- This uses PERMISSIVE (allow) policies that don't reference other tables
-- WARNING: Deletes all auth users.

-- 1) Delete all auth users
DELETE FROM auth.users;

-- 2) Drop tables if they exist
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3) Recreate tables
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

-- 4) Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- 5) SIMPLE (NON-RECURSIVE) RLS POLICIES

-- ========== PROFILES ==========
CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ========== PROJECTS ==========
-- Allow selecting own projects (owner only)
CREATE POLICY projects_select_own
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

-- Allow inserting projects (must set owner_id to current user)
CREATE POLICY projects_insert
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Allow updating own projects
CREATE POLICY projects_update
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

-- Allow deleting own projects
CREATE POLICY projects_delete
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- ========== PROJECT_MEMBERS ==========
-- Allow inserting members (owner only)
CREATE POLICY project_members_insert
  ON public.project_members FOR INSERT
  WITH CHECK (auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_id));

-- Allow selecting members (owner or member)
CREATE POLICY project_members_select_owner
  ON public.project_members FOR SELECT
  USING (auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_id));

CREATE POLICY project_members_select_member
  ON public.project_members FOR SELECT
  USING (auth.uid() = user_id);

-- Allow deleting members (owner only)
CREATE POLICY project_members_delete
  ON public.project_members FOR DELETE
  USING (auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_id));

-- ========== LOGS ==========
-- Allow inserting logs (owner or member of project)
CREATE POLICY logs_insert_owner
  ON public.logs FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_id)
    AND auth.uid() = user_id
  );

CREATE POLICY logs_insert_member
  ON public.logs FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.project_members WHERE project_id = logs.project_id AND user_id = auth.uid())
    AND auth.uid() = user_id
  );

-- Allow selecting logs (owner or member of project)
CREATE POLICY logs_select_owner
  ON public.logs FOR SELECT
  USING (auth.uid() = (SELECT owner_id FROM public.projects WHERE id = project_id));

CREATE POLICY logs_select_member
  ON public.logs FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.project_members WHERE project_id = logs.project_id AND user_id = auth.uid()));

-- Allow updating own logs
CREATE POLICY logs_update
  ON public.logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow deleting own logs
CREATE POLICY logs_delete
  ON public.logs FOR DELETE
  USING (auth.uid() = user_id);

-- 6) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_group_id ON public.projects(group_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON public.logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.logs(date);

-- Done
COMMENT ON TABLE public.projects IS 'Projects table for app - group_id is nullable for private projects';
