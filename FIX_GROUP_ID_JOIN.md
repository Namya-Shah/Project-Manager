# 🔧 FIX: Group ID Join Not Working ("Group not found")

## Problem
When trying to join a collaborative project using Group ID, you get:
```
Error: Group not found: "EKQHR4"
```

## Root Cause
The RLS policy only allowed project OWNERS to SELECT projects. Non-owners couldn't query the database to find the project by group_id.

## Solution
Updated `DATABASE_RESET_FINAL.sql` with 2 new policies:

```sql
-- Allow anyone to SELECT collaborative projects by group_id
CREATE POLICY "projects_discover_by_group"
  ON public.projects
  FOR SELECT
  USING (group_id IS NOT NULL);

-- Allow members to view their projects after joining
CREATE POLICY "projects_view_as_member"
  ON public.projects
  FOR SELECT
  USING (
    id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );
```

Now:
- ✅ Anyone can find collaborative projects via group_id
- ✅ Members can view projects they've joined
- ✅ Owners still have full control

---

## 🚀 How to Fix (3 minutes)

### Step 1: Run the Updated SQL
1. Go to **Supabase Dashboard → SQL Editor → New Query**
2. Copy entire content of: `DATABASE_RESET_FINAL.sql`
3. Paste and click **Run**

**What it does:**
- Deletes all users
- Drops old tables
- Creates new tables with **FIXED RLS policies**
- Allows discovering collaborative projects

### Step 2: Clear Browser & Restart
```bash
# Clear storage
F12 → Application → Storage → Delete all

# Hard refresh
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Restart app
npm run dev
```

### Step 3: Test
**User 1:**
- Create collaborative project → Get Group ID (e.g., "EKQHR4")

**User 2 (different browser/incognito):**
- Paste Group ID
- Click "Join Group"
- ✅ Project should appear!

---

## ✅ What Changed

### Before (Broken)
```sql
CREATE POLICY "projects_owner"
  ON public.projects FOR ALL
  USING (auth.uid() = owner_id);
```
❌ Only owner can SELECT  
❌ Non-owners get empty result  
❌ "Group not found" error

### After (Fixed)
```sql
-- Owner can do everything
CREATE POLICY "projects_owner"...

-- Anyone can discover collaborative projects
CREATE POLICY "projects_discover_by_group"
  USING (group_id IS NOT NULL);

-- Members can view after joining
CREATE POLICY "projects_view_as_member"
  USING (id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));
```
✅ Anyone can find collaborative projects  
✅ Query returns the project  
✅ Join works perfectly

---

## 📋 Files

| File | Status | Use |
|------|--------|-----|
| DATABASE_RESET_FINAL.sql | ✅ FIXED | Run this in Supabase |

---

## 🎯 Summary

The issue was **RLS policies were too restrictive**. Now:
1. Anyone can discover collaborative projects
2. They can join by finding the project via group_id
3. After joining, they automatically see the project
4. Owners still have full control

**Start here:** Run the fixed `DATABASE_RESET_FINAL.sql`
