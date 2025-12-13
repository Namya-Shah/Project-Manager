-- Quick Reference: Delete All Users & Reset
-- Use CLEAN_DATABASE_SETUP.sql instead for complete fix
-- This is just if you want to delete users only

-- ============================================
-- OPTION 1: Delete All Users Only
-- ============================================
-- WARNING: This will delete all users and cascade to all related data
-- Use this ONLY if you want to keep table structure but clear data

DELETE FROM auth.users;

-- Note: This cascades to:
-- - All profiles
-- - All projects (because owner_id references users)
-- - All project_members
-- - All logs

-- ============================================
-- OPTION 2: Full Clean Reset (Recommended)
-- ============================================
-- Use: CLEAN_DATABASE_SETUP.sql file instead
-- It does everything properly in the right order

-- ============================================
-- Verification Queries
-- ============================================

-- Check how many users exist
SELECT COUNT(*) as user_count FROM auth.users;

-- Check how many projects exist
SELECT COUNT(*) as project_count FROM public.projects;

-- Check how many project members exist
SELECT COUNT(*) as member_count FROM public.project_members;

-- Check how many logs exist
SELECT COUNT(*) as log_count FROM public.logs;

-- List all current users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- List all current projects
SELECT id, name, owner_id, group_id, created_at FROM public.projects ORDER BY created_at DESC;
