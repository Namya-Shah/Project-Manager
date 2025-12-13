# Group ID Join Feature - Setup & Usage Guide

## ✨ What's New

The app now has a **Group ID system** for seamless team collaboration:

✅ Each project gets a unique 6-character **Group ID**  
✅ Users can **join any project** by entering the Group ID  
✅ **Copy & Share** the Group ID easily  
✅ No email invites needed - just share the code!  
✅ **Automatic role assignment** as "Editor" when joining  

---

## 🚀 Quick Setup

### Step 1: Update Supabase Database

If you haven't run DATABASE_SETUP.sql yet:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Create a **New Query**
3. Copy and paste the content from `DATABASE_SETUP.sql`
4. Click **Run**

**If you already have projects table**, run this to make group_id optional:

```sql
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_group_id_key;

ALTER TABLE public.projects 
ALTER COLUMN group_id SET DEFAULT NULL;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_group_id_unique UNIQUE (group_id) WHERE group_id IS NOT NULL;
```

### Step 2: Test the Feature

1. Start the app: `npm run dev`
2. Sign in with your account
3. Create a new project
4. Go to **Team** tab
5. See your **Group ID** at the top
6. Click the **Copy** button

---

## 💡 How It Works

### Creating a Project
```
1. You create a project
2. System generates a random 6-character Group ID (e.g., "ABC123")
3. Your Group ID appears in the Team tab
```

### Sharing with Team Members
```
1. Click "Copy" next to Group ID
2. Share the code with teammates (email, slack, etc.)
3. They don't need an account - but will need one before joining
```

### Joining a Project
```
1. Open the app home page
2. See "Join Project by Group ID" section at the top
3. Paste the 6-character code
4. Click "Join Group"
5. You're now a member with "Editor" role
```

---

## 🎯 User Workflows

### Owner's Workflow
```
Owner creates "Mobile App" project
    ↓
System generates Group ID: "MK7J9P"
    ↓
Owner copies and shares via email/Slack
    ↓
Team members join with the code
    ↓
Everyone can add daily logs
```

### Team Member's Workflow
```
Team member receives Group ID: "MK7J9P"
    ↓
Opens DevLog app
    ↓
Goes to home page
    ↓
Enters "MK7J9P" in "Join Project by Group ID"
    ↓
Clicks "Join Group"
    ↓
Project now appears in their dashboard
    ↓
Can add logs, view team activity
```

---

## 🔒 Security & Permissions

### Group ID Visibility
- Visible to all project members
- Shared via copying (not automatically sent)
- 6-character code is reasonably hard to guess

### Member Roles
When joining by Group ID:
- You automatically get **"Editor"** role
- You can **add logs**
- You can **delete your own logs only**
- Owner can change your role anytime

---

## 📍 UI Locations

### 1. Home Page - Join Section (Top)
```
┌─────────────────────────────┐
│  Join Project by Group ID   │
│                             │
│  [__ABC123___] [Join Group] │
│                             │
│  Paste a 6-char code here   │
└─────────────────────────────┘
```

### 2. Project Team Tab - Group ID Card
```
┌─────────────────────────────┐
│ 📤 Group ID                 │
│                             │
│ [__MK7J9P___] [📋 Copy]     │
│                             │
│ Share this code to invite   │
│ team members                │
└─────────────────────────────┘
```

---

## 🛠️ Technical Details

### Group ID Format
- **Length:** 6 characters
- **Case:** Automatically converted to UPPERCASE
- **Format:** Alphanumeric (A-Z, 0-9)
- **Uniqueness:** Each project has unique ID
- **Example:** ABC123, XYZ789, MK7J9P

### Database Changes
```sql
-- Added column to projects table
group_id TEXT UNIQUE NOT NULL 
DEFAULT substring(gen_random_uuid()::text, 1, 6)
```

### API Functions
- `generateGroupId()` - Creates random ID
- `joinProjectByGroupId()` - Join project with ID
- `getUserProjects()` - Loads all projects user belongs to

---

## ✅ Features

### ✅ Copy Group ID
- Click copy button
- ID saved to clipboard
- Toast confirmation

### ✅ Join by Group ID
- Enter 6-character code
- Automatic case conversion
- Instant project access

### ✅ View Group ID in Project
- See your project's Group ID
- In Team tab
- Easy to copy and share

### ✅ Error Handling
- "Group not found" - ID doesn't exist
- "Already a member" - You've joined already
- User feedback via toast notifications

---

## 🎓 Common Tasks

### Task: Invite a Team Member
1. Open your project
2. Click **Team** tab
3. Find **Group ID** card at top
4. Click **Copy** button
5. Share the code anywhere (email, Slack, etc.)
6. Tell them to paste it on the home page

### Task: Join Someone's Project
1. Receive a 6-character code from someone
2. Go to DevLog home page
3. Find **Join Project by Group ID** at top
4. Enter the code
5. Click **Join Group**
6. Done! Project now in your dashboard

### Task: Share Multiple Projects
1. Get Group ID for each project
2. Share different codes for different projects
3. Team members can join multiple projects

---

## 🔄 Example Scenarios

### Scenario 1: Freelance Team
```
Project: "Website Redesign"
Group ID: ABC123

Designer shares "ABC123" with developer
Developer shares "ABC123" with client
Everyone joins, adds daily logs
Automatic activity tracking
```

### Scenario 2: Class Project
```
Professor creates "Class Project 2024"
Group ID: CLS024

Shares code on syllabus
Students join during week 1
All can log contributions
Professor reviews activity
```

### Scenario 3: Startup Sprint
```
Founder creates "MVP Sprint"
Group ID: MVP001

Shares with 5 engineers via Slack
They all join immediately
Daily standup logs
Clear visibility into work
```

---

## 🐛 Troubleshooting

### "Group not found"
- Check the 6-character code is correct
- Ask the person who shared it to verify
- Make sure they're actually a member (have permissions to share)

### "You are already a member"
- You've already joined this project
- Check your projects list
- The project should appear there already

### Group ID not showing
- Make sure you're the owner or a member
- Refresh the page
- Go to Team tab to see it

### Can't copy Group ID
- Click the copy button (📋)
- Check your clipboard settings
- Try again

---

## 📊 Data Structure

```
projects table:
├── id (UUID)
├── name (TEXT)
├── group_id (TEXT) ← NEW! Unique 6-char code
├── owner_id (UUID)
├── ...other fields

When joining by group_id:
1. Find project by group_id
2. Create project_members entry
3. User gets "editor" role
4. User now sees project in dashboard
```

---

## 🎯 Next Steps

- [ ] Update DATABASE_SETUP.sql in Supabase (or add group_id column)
- [ ] Create a test project
- [ ] Copy the Group ID
- [ ] Create a second test account
- [ ] Join the project using the Group ID
- [ ] Test adding logs as both users
- [ ] View team activity

---

## 💾 What Gets Synced to Supabase

When you add a log in a group project:

```
✅ Log content
✅ Date
✅ Your user ID
✅ Project ID
✅ Timestamp
✅ Your email (from profile)

All visible to all group members
```

---

**Group ID system is ready to use!** 🎉

Share codes, invite teammates, and start collaborating!
