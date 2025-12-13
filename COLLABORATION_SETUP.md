# Collaborative Features Setup Guide

## ✨ What's New - Team Collaboration

Your DevLog app now supports full team collaboration! Here's what you can do:

### Features

✅ **Invite Team Members** - Share projects with colleagues via email  
✅ **Role-Based Access** - Editor (can add logs) or Viewer (read-only)  
✅ **Team Activity View** - See who contributed what and when  
✅ **Multi-User Logs** - Each log shows who created it  
✅ **Contribution Graph** - Visual activity tracking per contributor  
✅ **Member Management** - Add/remove/manage team members (owner only)

---

## 🗄️ Database Setup

### Step 1: Run SQL Migrations

1. Go to your Supabase dashboard → **SQL Editor**
2. Create a **New Query**
3. Copy the entire content from `DATABASE_SETUP.sql`
4. Click **Run**

This creates tables for:
- `projects` - Project data with owner info
- `project_members` - Team members and their roles
- `logs` - Activity logs with user attribution
- `profiles` - User information

### Step 2: Verify Tables Created

In SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see:
- projects
- project_members
- logs
- profiles

---

## 🎯 Using Collaborative Features

### Share a Project

1. **Open any project** → Click **Team** tab
2. Click **Add Member** button
3. Enter team member's email (must have account)
4. Select role:
   - **Editor** - Can add/edit/delete logs
   - **Viewer** - Can only view logs
5. Click **Add Member**

### View Team Activity

1. Open project → **Activity** tab
2. See:
   - Contribution count per team member
   - Recent logs from each person
   - Contribution graph

### Manage Members

Only **project owners** can:
- Add new members
- Change member roles (Editor ↔ Viewer)
- Remove members

---

## 🔐 Permissions

### Owner
- Create/edit project details
- Add/remove team members
- Change member roles
- Add/edit/delete any logs
- See all team activity

### Editor
- View project
- Add new logs
- Delete own logs (not others')
- See all team activity

### Viewer
- View project read-only
- See all logs and team activity
- Cannot make any changes

---

## 📋 Database Schema

```sql
-- Projects Table
projects (id, name, description, color, owner_id, created_at)

-- Team Members Table
project_members (id, project_id, user_id, role, joined_at)

-- Activity Logs Table
logs (id, project_id, user_id, content, date, created_at)

-- User Profiles Table
profiles (id, email, full_name, avatar_url, created_at)
```

---

## 🚀 How It Works

### Workflow

```
1. Owner creates a project
2. Owner adds team members by email
3. Team members can now:
   - See the project in their dashboard
   - View all logs and activity
   - Add new logs (if Editor role)
4. Activity is tracked with user attribution
5. Owner can view team contributions
```

### Data Flow

```
New Log Created
↓
Logged with current user ID
↓
Stored with timestamp
↓
Associated with project
↓
Visible to all team members
↓
Shown in Team Activity view
```

---

## 🔑 Key Components

### ProjectMembers Component
Manages team members (add/remove/change roles)
- Shows all project members
- Add member dialog
- Role selector
- Remove button (owner only)

### ContributorActivity Component
Shows team contributions
- Lists all team members
- Shows contribution count
- Recent entries from each member
- Filterable activity view

### Collaboration Service (`lib/collaboration.ts`)
Handles all backend operations:
- `addProjectMember()` - Invite team member
- `removeProjectMember()` - Remove member
- `updateMemberRole()` - Change role
- `getProjectActivity()` - Fetch team logs
- `getMemberRole()` - Check user permissions

---

## ✅ Testing Collaboration

### With Multiple Users

1. **Create account #1** with email `user1@example.com`
2. **Create account #2** with email `user2@example.com`
3. **Sign in as User #1**
4. **Create project** "Team Project"
5. **Go to Team tab** → Add Member
6. **Enter** `user2@example.com` with role "Editor"
7. **Sign out** and **sign in as User #2**
8. **See project** in dashboard
9. **Add a log** to the project
10. **Sign back to User #1**
11. **View Team Activity** to see User #2's contribution

---

## 🛠️ Troubleshooting

### "User with email not found"
- Ensure the person has created an account
- They must have verified their email
- Use exact email they signed up with

### "Cannot add member" error
- Only project owner can add members
- Make sure you're logged in as owner
- Check Supabase RLS policies are enabled

### Members not showing
- Refresh the page
- Check database in Supabase
- Verify RLS policies are correct

### Activity not appearing
- Make sure logs are added after member joined
- Check user has correct role
- Verify project_id matches

---

## 📝 Next Steps

- [ ] Run DATABASE_SETUP.sql in Supabase
- [ ] Create test accounts
- [ ] Invite team member to test project
- [ ] Add collaborative logs
- [ ] View team activity
- [ ] Deploy to production

---

## 📚 Related Files

- `src/lib/collaboration.ts` - Collaboration API
- `src/components/ProjectMembers.tsx` - Team management UI
- `src/components/ContributorActivity.tsx` - Activity viewer
- `src/components/ProjectDetail.tsx` - Updated with tabs
- `DATABASE_SETUP.sql` - SQL migrations

---

**Your app is now ready for team collaboration!** 🎉
