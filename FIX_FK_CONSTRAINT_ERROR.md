# 🔧 FIX: FK Constraint Error on Project Creation

## Problem
```
Failed to create project: insert or update on table "projects" violates 
foreign key constraint "projects_owner_id_fkey"
```

## Root Cause
When a user signs up, Supabase Auth creates a record in `auth.users`, but there was **no automatic profile creation** in `public.profiles`. This caused a FK constraint error when trying to create a project because the `owner_id` wasn't recognized.

## Solution
Added a **PostgreSQL trigger** that automatically creates a profile in `public.profiles` whenever a new user signs up via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Now:
- ✅ User signs up → auth.users record created
- ✅ Trigger fires automatically → public.profiles record created
- ✅ FK constraint is satisfied
- ✅ Project creation succeeds

---

## 🚀 How to Fix (3 minutes)

### Step 1: Run the Updated SQL
1. Go to **Supabase Dashboard → SQL Editor → New Query**
2. Copy entire content of: `DATABASE_RESET_FINAL.sql`
3. Paste and click **Run**

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
- Sign up with new account
- Create a project → ✅ Should work!
- Create collaborative project → Get Group ID
- Join from another account → ✅ Project appears!

---

## ✅ What Changed

### Before (FK Error)
```
User signs up
↓
auth.users record created ✓
↓
public.profiles record? ✗ MISSING
↓
Try to create project → FK constraint violated ✗
```

### After (Works)
```
User signs up
↓
auth.users record created ✓
↓
Trigger fires automatically
↓
public.profiles record created ✓
↓
Try to create project → FK satisfied ✓ SUCCESS
```

---

## 📋 Summary

| What | Before | After |
|------|--------|-------|
| Profile on signup | ❌ Manual | ✅ Automatic |
| FK constraint | ❌ Fails | ✅ Passes |
| Project creation | ❌ Error | ✅ Works |

---

**Start here:** Run the updated `DATABASE_RESET_FINAL.sql` in Supabase SQL Editor
