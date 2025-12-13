# 🔧 FIX: Infinite Recursion in RLS Policies

**Error:** "infinite recursion detected in policy for relation 'projects'"

**Root Cause:** RLS policies had circular dependencies.

---

## ✅ Solution: Use the NEW SQL File

**Use THIS file:**
```
DATABASE_RESET_FINAL.sql
```

**DO NOT use:**
- ❌ CLEAN_DATABASE_SETUP_FULL_RESET.sql
- ❌ CLEAN_DATABASE_SETUP_SAFE.sql

---

## 🚀 Steps (3 minutes)

### Step 1: Run the Fixed SQL
1. Supabase Dashboard → SQL Editor → New Query
2. Open: `DATABASE_RESET_FINAL.sql`
3. Copy entire content
4. Paste into SQL Editor
5. Click Run

### Step 2: Clear Browser
```
F12 → Application → Storage → Delete all
Cmd+Shift+R (refresh)
```

### Step 3: Restart App
```bash
npm run dev
```

### Step 4: Test
- Sign up: test@example.com
- Create project
- Check F12 console for ✅ logs

---

**Done!**
