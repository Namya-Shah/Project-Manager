import { useEffect, useState } from 'react'
import { getProjectActivity } from '@/lib/collaboration'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Loader2 } from 'lucide-react'

interface ActivityLog {
  id: string
  content: string
  date: string
  created_at: string
  user_id: string
  profiles?: {
    email: string
    full_name: string | null
  }
}

interface ContributorActivityProps {
  projectId: string
}

export function ContributorActivity({ projectId }: ContributorActivityProps) {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivity()
  }, [projectId])

  const loadActivity = async () => {
    try {
      setLoading(true)
      const data = await getProjectActivity(projectId)
      setActivity(data)
    } catch (error) {
      console.error('Failed to load activity:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group activity by contributor
  const contributorStats = activity.reduce(
    (acc, log) => {
      const email = log.profiles?.email || 'Unknown'
      const name = log.profiles?.full_name || email
      if (!acc[email]) {
        acc[email] = { name, count: 0, logs: [] }
      }
      acc[email].count++
      acc[email].logs.push(log)
      return acc
    },
    {} as Record<string, { name: string; count: number; logs: ActivityLog[] }>
  )

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(contributorStats).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(contributorStats).map(([email, stats]) => (
              <div key={email} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{stats.name}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{stats.count}</p>
                    <p className="text-xs text-muted-foreground">entries</p>
                  </div>
                </div>

                {/* Recent logs from this contributor */}
                <div className="space-y-1 border-t pt-2">
                  {stats.logs.slice(0, 3).map((log) => (
                    <div key={log.id} className="text-xs text-muted-foreground">
                      <p className="truncate">{log.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                  {stats.logs.length > 3 && (
                    <p className="text-xs text-primary">+{stats.logs.length - 3} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
