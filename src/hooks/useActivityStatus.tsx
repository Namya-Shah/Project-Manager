import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export type ActivityStatus = 'active' | 'idle' | 'away' | 'inactive'

const IDLE_TIMEOUT = 2 * 60 * 1000 // 2 minutes
const AWAY_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const DB_SYNC_INTERVAL = 30 * 1000 // Update DB every 30 seconds

export function useActivityStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<ActivityStatus>('active')
  const [isTabVisible, setIsTabVisible] = useState(true)

  // Save status to database
  const saveStatusToDb = useCallback(
    async (newStatus: ActivityStatus) => {
      if (!user?.id) return

      try {
        await supabase
          .from('profiles')
          .update({
            activity_status: newStatus,
            last_active_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      } catch (error: any) {
        if (error?.code === 'PGRST204' || error?.status === 400 || error?.message?.includes('400')) {
          // Suppress known schema mismatch error to avoid console spam
          console.warn('⚠️ Activity status update failed (database missing columns or schema cache stale). Status features disabled.')
          return
        }
        console.error('Error saving activity status:', error)
      }
    },
    [user?.id]
  )

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const visible = !document.hidden
    setIsTabVisible(visible)

    if (!visible) {
      setStatus('away')
    } else if (status === 'away') {
      setStatus('active')
    }
  }, [status])

  // Reset activity timeout
  const resetActivityTimeout = useCallback(() => {
    if (!user) return

    if (!isTabVisible) {
      setStatus('away')
      return
    }

    setStatus('active')

    // Set idle timeout
    const idleTimer = setTimeout(() => {
      setStatus('idle')
    }, IDLE_TIMEOUT)

    // Set away timeout
    const awayTimer = setTimeout(() => {
      setStatus('away')
    }, AWAY_TIMEOUT)

    return () => {
      clearTimeout(idleTimer)
      clearTimeout(awayTimer)
    }
  }, [user, isTabVisible])

  // Sync status to database periodically
  useEffect(() => {
    if (!user) {
      setStatus('inactive')
      saveStatusToDb('inactive')
      return
    }

    const syncInterval = setInterval(() => {
      saveStatusToDb(status)
    }, DB_SYNC_INTERVAL)

    return () => clearInterval(syncInterval)
  }, [user, status, saveStatusToDb])

  // Set up activity listeners
  useEffect(() => {
    if (!user) {
      setStatus('inactive')
      return
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('mousemove', resetActivityTimeout)
    document.addEventListener('keydown', resetActivityTimeout)
    document.addEventListener('click', resetActivityTimeout)
    document.addEventListener('scroll', resetActivityTimeout)

    // Initial activity
    resetActivityTimeout()
    // Save initial status
    saveStatusToDb('active')

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('mousemove', resetActivityTimeout)
      document.removeEventListener('keydown', resetActivityTimeout)
      document.removeEventListener('click', resetActivityTimeout)
      document.removeEventListener('scroll', resetActivityTimeout)
    }
  }, [user, handleVisibilityChange, resetActivityTimeout, saveStatusToDb])

  return status
}

