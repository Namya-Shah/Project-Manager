# 🎯 Quick Reference Card - Group Collaboration & Daily Logging

## 🚀 Getting Started (5 Minutes)

### Step 1: Database Setup
```
Supabase Dashboard → SQL Editor
↓
Copy content from DATABASE_SETUP.sql
↓
Click "Run"
↓
Done! ✅
```

### Step 2: Start App
```bash
npm run dev
# Opens at http://localhost:8080
```

### Step 3: Create & Share
```
1. Sign in → Create Project → Copy Group ID
2. Share the 6-char code with teammate
3. Teammate joins with code
4. Both can add logs!
```

---

## 📋 Main Features

| Feature | How to Use | User |
|---------|-----------|------|
| **Create Project** | Home → New Project | Owner |
| **Join Project** | Home → Paste Group ID → Join | Anyone |
| **Add Log** | Project → Logs → Add Log | Editor+ |
| **View Logs** | Project → Logs tab | Anyone |
| **See Activity** | Project → Activity tab | Anyone |
| **Manage Team** | Project → Team → Add Member | Owner |
| **Copy Group ID** | Project → Team → Copy button | Anyone |

---

## 🎮 User Journeys

### Create & Share (1 minute)
```
Create Project (name, description, color)
↓
Get Group ID (auto-generated, unique)
↓
Copy Group ID (click copy button)
↓
Share code (email, Slack, etc.)
↓
Teammate joins instantly
```

### Join Project (30 seconds)
```
See Group ID (6 characters)
↓
Go to home page
↓
Paste in "Join Project by Group ID"
↓
Click "Join Group"
↓
Project appears in dashboard!
```

### Add Daily Log (1 minute)
```
Open project
↓
Click "Logs" tab
↓
Click "Add Log"
↓
Type your entry
↓
Select date (default: today)
↓
Submit
↓
See your log + all team logs!
```

### View Team Contributions (2 minutes)
```
Open project
↓
Click "Activity" tab
↓
See contribution graph
↓
See each member's stats
↓
Click to view their recent logs
```

---

## 💻 Database Operations

```sql
-- View all projects with group IDs
SELECT id, name, group_id FROM projects;

-- See all project members
SELECT projects.name, profiles.email, project_members.role 
FROM project_members
JOIN projects ON project_members.project_id = projects.id
JOIN profiles ON project_members.user_id = profiles.id;

-- See all logs
SELECT projects.name, profiles.email, logs.content, logs.date
FROM logs
JOIN projects ON logs.project_id = projects.id
JOIN profiles ON logs.user_id = profiles.id
ORDER BY logs.date DESC;

-- Find project by group ID
SELECT * FROM projects WHERE group_id = 'ABC123';
```

---

## 🔑 Key Information

### Group ID Format
- **Length:** 6 characters
- **Format:** UPPERCASE alphanumeric (A-Z, 0-9)
- **Example:** ABC123, XYZ789, MK7J9P
- **Uniqueness:** One per project
- **Generated:** Automatically when project created

### Project Roles
- **Owner:** Created the project, full control
- **Editor:** Invited member, can add logs
- **Viewer:** Invited member, read-only

### Log Data
- **Content:** What you worked on
- **Date:** When you worked on it
- **Contributor:** Your email
- **Timestamp:** When logged
- **Visibility:** All team members

---

## ❌ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Group not found" | Check 6-char code is correct |
| "Already a member" | You've joined before, find in projects list |
| Can't add log | Must be editor role, ask owner to change |
| Logs not showing | Refresh page, check you're a member |
| Group ID not visible | Must be owner/member, go to Team tab |
| Can't delete other's log | Only owners can do that |
| User can't see project | They need to join with Group ID |
| Need to invite someone | Copy Group ID and share it |

---

## 🧠 Mental Model

```
Project
├── Group ID (6-char share code)
├── Owner (creator)
├── Members (people who joined)
│   ├── Name
│   ├── Email  
│   └── Role (editor/viewer)
└── Logs (daily entries)
    ├── Content
    ├── Date
    ├── Contributor
    └── Timestamp
```

---

## 📊 Permissions Matrix

```
           | Create | Edit | Delete Own | Delete Other | Invite |
-----------|--------|------|------------|--------------|--------|
Owner      |   ✅   | All  |     ✅     |      ✅      |   ✅   |
Editor     |   ❌   | Own  |     ✅     |      ❌      |   ❌   |
Viewer     |   ❌   | ❌   |     ❌     |      ❌      |   ❌   |
```

---

## 🔐 Security Reminders

✅ Only project members can see project  
✅ Logs linked to user who created them  
✅ Roles enforce what you can do  
✅ RLS policies prevent data leakage  
✅ Each user account is separate  

---

## 📱 UI Locations

### Home Page
- **Top:** "Join Project by Group ID" input
- **Middle:** "New Project" button
- **Bottom:** List of your projects

### Project View
- **Tabs:** Activity | Logs | Team
- **Activity:** Graphs, contributions, stats
- **Logs:** All entries grouped by date
- **Team:** Members, Group ID, add member

---

## ⌨️ Keyboard Shortcuts

```
Ctrl/Cmd + C  - Copy Group ID
Enter         - Submit forms
Esc           - Close dialogs
```

---

## 🎯 Daily Workflow

```
Morning:
1. Open DevLog
2. Go to your projects
3. Click the project you're working on
4. Click "Logs" tab
5. Click "Add Log"
6. Type what you did yesterday (or today's plan)
7. Submit

Afternoon/Evening:
8. Update your log with progress
9. Check "Activity" tab to see team's work
10. See contribution graph update
```

---

## 🚀 Pro Tips

**Tip 1: Share Multiple Ways**
- Email the Group ID
- Post in Slack
- Add to project documentation
- Write in shared doc

**Tip 2: Use Descriptive Logs**
```
GOOD:  "Implemented JWT authentication for API"
BAD:   "Worked on auth"

GOOD:  "Fixed bug where users couldn't reset password"
BAD:   "Fixed bugs"

GOOD:  "Added unit tests for payment module (95% coverage)"
BAD:   "Added tests"
```

**Tip 3: Use Dates Wisely**
- Today's logs → Use "Today"
- Yesterday → Click calendar, select date
- Catching up? → Add past logs with actual date

**Tip 4: Regular Check-ins**
- Check Activity tab daily
- See what team's doing
- Notice patterns
- Celebrate wins together

---

## 📞 When Something Goes Wrong

### 1. Check Browser Console (F12)
- Any error messages?
- Red text indicates problems

### 2. Verify Environment
- Is `.env.local` correct?
- Is Supabase running?
- Is internet connected?

### 3. Try Refresh
- Hard refresh: Ctrl/Cmd + Shift + R
- Clear cache
- Try again

### 4. Check Supabase
- Go to Supabase Dashboard
- Verify tables exist
- Check RLS policies
- Look at database logs

### 5. Get Help
- Check COMPLETE_SETUP.md
- Check GROUP_ID_GUIDE.md
- Check LOGGING_FIXED.md

---

## 📚 Documentation Map

```
COMPLETE_SETUP.md
├─ Full step-by-step guide
├─ 5-minute quickstart
└─ All details

GROUP_ID_GUIDE.md
├─ Group ID feature
├─ How to use
└─ Workflows

LOGGING_FIXED.md
├─ What was fixed
├─ How it works now
└─ Test it

DATABASE_SETUP.sql
├─ SQL schema
├─ RLS policies
└─ Run in Supabase

IMPLEMENTATION_COMPLETE.md
├─ What was built
├─ How it works
└─ Full reference
```

---

## 🎉 You're All Set!

Everything is working:
- ✅ Logging fixed
- ✅ Group IDs created
- ✅ Team collaboration ready
- ✅ Multi-user support
- ✅ Real-time sync
- ✅ Production ready

**Start collaborating now!**

---

## 🚀 Launch Command

```bash
npm run dev
```

Then:
1. Create a project
2. Copy the Group ID  
3. Invite teammates
4. Start logging!

**Happy collaborating!** 🎊
