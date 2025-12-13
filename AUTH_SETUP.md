# Authentication Setup Guide

## What's Included

- Email/Password authentication
- Sign up and Login pages
- Protected routes (only authenticated users can access the main app)
- User session management
- Logout functionality

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in
4. Create a new project:
   - Project name: `devlog` (or your choice)
   - Password: Create a strong password
   - Region: Choose the closest to you
5. Wait for the project to initialize

### 2. Get Your Credentials

1. In Supabase dashboard, go to **Settings > API**
2. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

### 3. Update Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholders with your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Configure Email Authentication

1. In Supabase dashboard, go to **Authentication > Providers**
2. Make sure "Email" is enabled
3. Go to **Email Templates** to customize sign-up/confirmation emails (optional)

### 5. Enable Automatic Migrations (Optional)

To automatically create the users table:

1. Go to **SQL Editor** in Supabase
2. Create a new query and run:

```sql
-- This creates a public profile table (optional)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy so users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
```

## How It Works

### User Flow

1. **New User** → Sign up page → Creates account in Supabase → Receives confirmation email → Can log in
2. **Existing User** → Login page → Signs in → Redirected to main app
3. **Logout** → Click logout in header → Redirected to login page

### Protected Routes

The main dashboard (`/`) is now protected. Unauthenticated users are redirected to `/login`

### User Info

The `useAuth()` hook provides:
- `user` - Current user object
- `session` - Current session
- `loading` - Loading state
- `error` - Any auth errors
- `signUp(email, password)` - Register new user
- `signIn(email, password)` - Login user
- `signOut()` - Logout user

## Project Structure

```
src/
├── hooks/
│   └── useAuth.ts          # Auth context & hooks
├── components/
│   ├── ProtectedRoute.tsx  # Route protection wrapper
│   └── Header.tsx          # Updated with logout button
├── lib/
│   └── supabase.ts         # Supabase client initialization
├── pages/
│   ├── Login.tsx           # Login page
│   ├── SignUp.tsx          # Sign up page
│   └── Index.tsx           # Protected dashboard
└── App.tsx                 # Updated with auth routes
```

## Testing

1. Start the dev server: `npm run dev`
2. Go to http://localhost:5173
3. You'll be redirected to `/login`
4. Click "Sign Up" to create a new account
5. Enter your email and password
6. After signing up, sign in with your credentials
7. You should see the main dashboard
8. Click the logout button in the header to sign out

## Common Issues

**"Cannot find module '@/hooks/useAuth'"**
- Make sure you saved all files
- Restart the dev server: `npm run dev`

**"Supabase URL or Key is missing"**
- Check `.env.local` file has the correct values
- Restart dev server after updating `.env.local`

**"Email confirmation not working"**
- In Supabase, go to **Email Templates**
- Make sure confirmation email is enabled
- Check spam folder

## Next Steps

- Add user profile management
- Store user preferences in a database
- Add password reset functionality
- Add multi-factor authentication (MFA)
