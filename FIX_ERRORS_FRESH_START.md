# 🔧 CLEAN START - Fix Database & Remove All Users

## ✅ Steps to Fix "Failed to create project" Error

### STEP 1: Reset Database (IMPORTANT!)

**Go to Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and run the ENTIRE content from: **`CLEAN_DATABASE_SETUP.sql`**

This will:
- ✓ Delete ALL users
- ✓ Delete ALL data
- ✓ Drop all tables
- ✓ Recreate with proper setup
- ✓ Fix RLS policies
- ✓ Add performance indexes

**Run it completely** - It takes 10 seconds.

---

### STEP 2: Clear App Data

**In your browser:**
```
F12 → Application tab → Storage
→ Local Storage
→ Delete all
→ Also clear any auth tokens
```

Or hard refresh:
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

---

### STEP 3: Restart App

```bash
# Stop current app (Ctrl + C)
npm run dev
```

---

### STEP 4: Create New Account

```
Sign Up page → Create NEW account
- Email: test1@example.com
- Password: Test123!
- Confirm
```

---

### STEP 5: Test Creating Project

```
Click "New Project"
Fill form:
- Name: "Test Project"
- Description: "Testing"
- Color: Blue
Check: "Make this project collaborative" ✓
Click: "Create Project"

Should show: ✅ "Project created! Group ID: ABC123"
```

---

## 🔍 If Still Getting Error - Debug Steps

### Check Browser Console (F12)

```
1. Open DevTools
2. Go to Console tab
3. Try creating project
4. Look for error messages
5. Screenshot and note the error
```

**Common errors:**
- "PGRST100" = RLS policy blocking
- "undefined field" = Schema mismatch
- "auth.uid() error" = Authentication issue

### Check Supabase Status

Go to **Supabase Dashboard** → **Status**:
- ✓ Database: Should be "Up"
- ✓ Auth: Should be "Up"
- ✓ API: Should be "Up"

### Verify RLS Policies

Go to **Supabase** → **Authentication** → **Policies**:

Should show:
```
✓ projects_allow_insert
✓ projects_allow_select_own_or_member
✓ projects_allow_update_owner
✓ projects_allow_delete_owner
```

If empty → Run CLEAN_DATABASE_SETUP.sql again

---

## 📋 What the Clean Setup Does

### 1. Deletes Everything
```sql
DELETE FROM auth.users;
-- Cascades to all related data
```

### 2. Creates Fresh Tables
```
✓ profiles
✓ projects (with nullable group_id)
✓ project_members
✓ logs
```

### 3. Enables RLS
```
✓ Row Level Security on all tables
✓ Simplified policies (less restrictive)
✓ Better error messages
```

### 4. Adds Indexes
```
✓ owner_id
✓ group_id
✓ user_id
✓ project_id
✓ Better performance
```

---

## 🚀 Complete Fresh Start Checklist

- [ ] Run CLEAN_DATABASE_SETUP.sql
- [ ] Clear browser local storage
- [ ] Hard refresh browser (Cmd/Ctrl + Shift + R)
- [ ] Stop and restart app (npm run dev)
- [ ] Create new account
- [ ] Create test project
- [ ] See Group ID in toast ✓
- [ ] Find Group ID in Team tab ✓
- [ ] Test with second account ✓

---

## 💡 Why This Fixes It

### Before (Error)
```
❌ Old RLS policies too restrictive
❌ Data inconsistency
❌ User auth issues
❌ Schema conflicts
```

### After (Works)
```
✓ Simplified RLS policies
✓ Clean tables
✓ Proper indexes
✓ Fresh auth
✓ No conflicts
```

---

## 🎯 If Something Doesn't Work

### "Still getting 'Failed to create project'"

1. **Check console (F12)** for exact error
2. **Verify** CLEAN_DATABASE_SETUP.sql ran completely
3. **Check** Supabase Dashboard for tables
4. **Verify** RLS policies exist
5. **Try** signing out and back in

### "Projects not loading"

1. **Refresh** the page
2. **Check** that you created the project (signed in?)
3. **Look in Supabase** → Tables → projects (should have 1 row)
4. **Verify** auth.uid() matches in console

### "Group ID not showing"

1. **Check** you selected "Make collaborative" checkbox
2. **Look in** Team tab (not just toast)
3. **Verify** RLS policy allows SELECT on projects

---

## 📞 Troubleshooting Checklist

```
[  ] CLEAN_DATABASE_SETUP.sql ran completely?
     → Check Supabase SQL Editor history
     
[  ] Browser cache cleared?
     → Cmd/Ctrl + Shift + R
     
[  ] Local storage cleared?
     → F12 → Application → Storage
     
[  ] New account created?
     → After cleanup
     
[  ] Supabase up?
     → Check status page
     
[  ] RLS policies exist?
     → Check policies in dashboard
     
[  ] Console errors?
     → F12 → Console → Look for red text
```

---

## 🎉 After Fresh Start

You'll have:
- ✅ Clean database
- ✅ No old data conflicts
- ✅ Working RLS policies
- ✅ No users (clean slate)
- ✅ Ready to test!

---

## 📝 Next Steps

1. **Run** CLEAN_DATABASE_SETUP.sql (complete file)
2. **Clear** browser data
3. **Restart** app
4. **Create** new account
5. **Test** project creation
6. **Celebrate!** 🎉

---

**This should completely fix the issue!**

If problems persist, check the console error message and share it.
