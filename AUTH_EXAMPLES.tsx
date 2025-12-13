// Example: Using Auth in Your Components

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

// Example 1: Get current user info
function UserProfile() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return (
    <div>
      <h2>Welcome, {user.email}</h2>
      <p>User ID: {user.id}</p>
      <p>Created: {user.created_at}</p>
    </div>
  )
}

// Example 2: Sign out user
function LogoutButton() {
  const { signOut } = useAuth()

  return (
    <Button onClick={signOut} variant="destructive">
      Sign Out
    </Button>
  )
}

// Example 3: Conditional rendering based on auth state
function Dashboard() {
  const { user, session } = useAuth()

  return (
    <div>
      {session ? (
        <div>
          <p>Logged in as: {user?.email}</p>
          {/* Your app content here */}
        </div>
      ) : (
        <div>
          <p>Please log in to see this content</p>
        </div>
      )}
    </div>
  )
}

// Example 4: Displaying loading state
function MyComponent() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return <div className="animate-pulse">Loading user data...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>
  }

  if (!user) {
    return <div>You must be logged in</div>
  }

  return (
    <div>
      <p>Hello {user.email}!</p>
    </div>
  )
}

export { UserProfile, LogoutButton, Dashboard, MyComponent }
