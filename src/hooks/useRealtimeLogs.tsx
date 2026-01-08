import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DailyLog } from '@/types/project'

export function useRealtimeLogs(projectId: string, onLogsChange: (logs: DailyLog[]) => void) {
  useEffect(() => {
    if (!projectId) return

    console.log('🔵 Setting up real-time logs subscription for project:', projectId)

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`project-logs-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log('📨 Real-time log change detected:', payload.eventType)
          await fetchLogs()
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    const fetchLogs = async () => {
      // Fetch updated logs for this project
      try {
        // 1. Fetch logs first to get User IDs
        const { data: logs, error: logsError } = await supabase
          .from('logs')
          .select('id, content, date, created_at, user_id, project_id')
          .eq('project_id', projectId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })

        if (logsError) {
          console.error('❌ Error fetching updated logs:', logsError)
          return
        }

        if (!logs || logs.length === 0) {
          onLogsChange([])
          return
        }

        // 2. Extract User IDs and sanitize
        const userIds = [...new Set(logs.map(l => l.user_id).filter(id => id && id.trim().length > 0))]

        if (userIds.length === 0) {
          // No users to fetch
          const formattedLogs: DailyLog[] = logs.map(log => ({
            id: log.id,
            content: log.content,
            date: log.date,
            createdAt: log.created_at,
            userId: log.user_id,
            userName: 'Unknown',
            avatarUrl: undefined,
          }))
          onLogsChange(formattedLogs)
          return
        }

        // 3. Fetch profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds)

        if (profilesError) {
          // Log but continue
          console.error('❌ Error fetching log profiles:', profilesError)
        }

        // 4. Create Profile Map
        const profileMap = new Map()
        profiles?.forEach(profile => {
          profileMap.set(profile.id, {
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          })
        })

        // 5. Format Logs
        const formattedLogs: DailyLog[] = logs.map(log => ({
          id: log.id,
          content: log.content,
          date: log.date,
          createdAt: log.created_at,
          userId: log.user_id,
          userEmail: profileMap.get(log.user_id)?.email,
          userName: profileMap.get(log.user_id)?.full_name || profileMap.get(log.user_id)?.email?.split('@')[0] || 'Unknown',
          avatarUrl: profileMap.get(log.user_id)?.avatar_url,
        }))

        console.log('✅ Updated logs:', formattedLogs.length)
        onLogsChange(formattedLogs)
      } catch (err) {
        console.error('❌ Error processing real-time log change:', err)
      }
    }

    // Initial fetch
    fetchLogs()

    return () => {
      console.log('🔴 Unsubscribing from real-time logs:', projectId)
      channel.unsubscribe()
    }
  }, [projectId, onLogsChange])
}
