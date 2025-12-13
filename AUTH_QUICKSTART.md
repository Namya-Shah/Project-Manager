# Authentication System - Quick Start

## ✅ What's Set Up

Your app now has complete authentication with:
- **Sign Up** - Create new accounts with email/password
- **Login** - Sign in to existing accounts  
- **Protected Routes** - Main dashboard only accessible when logged in
- **Session Management** - Automatic session handling
- **Logout** - Sign out button in header

## 🚀 Getting Started (3 Steps)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up and create a new project
3. Give it a name (e.g., "devlog")

### Step 2: Get Your Credentials
1. In Supabase dashboard → **Settings > API**
2. Copy:
   - **Project URL** 
   - **Anon Key**

### Step 3: Add to `.env.local`
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🏃 Running the App

```bash
npm run dev
```

Then visit http://localhost:5173

## 📱 User Flow

```
First Time User:
  / → redirect to /login → click "Sign Up" → create account → confirm email → login

Returning User:
  / → redirect to /login → sign in → access dashboard
```

## 📁 Files Created

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client setup |
| `src/hooks/useAuth.tsx` | Auth context & hooks |
| `src/pages/Login.tsx` | Login page |
| `src/pages/SignUp.tsx` | Sign up page |
| `src/components/ProtectedRoute.tsx` | Route protection |
| `.env.local` | Environment variables |
| `AUTH_SETUP.md` | Detailed setup guide |

## 🔧 Using Auth in Your Components

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, signOut, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <p>Welcome {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## ❓ Need More Help?

See `AUTH_SETUP.md` for detailed configuration and troubleshooting.

---

**Next Steps:**
- Store projects per-user in database
- Add user profile management  
- Add password reset
- Deploy to production
