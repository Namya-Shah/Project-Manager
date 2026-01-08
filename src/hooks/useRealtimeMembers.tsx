import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ProjectMember } from '@/types/project'

export function useRealtimeMembers(projectId: string, onMembersChange: (members: ProjectMember[]) => void) {
  useEffect(() => {
    if (!projectId) return

    console.log('🔵 Setting up real-time members subscription for project:', projectId)

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`project-members-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          console.log('📨 Real-time member change detected:', payload.eventType)
          await fetchAndNotifyMembers()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        async (payload) => {
          // Ideally we would filter by checking if payload.new.id is in the project members
          // For now, we'll just trigger the update which is safe though potentially chatty
          // Optimization: We could store member IDs in a ref if this becomes a bottleneck
          console.log('👤 Real-time profile change detected (Status update)')
          await fetchAndNotifyMembers()
        }
      )
      .subscribe((status) => {
        console.log('📡 Members subscription status:', status)
      })

    const fetchAndNotifyMembers = async () => {
      // Fetch updated members for this project
      try {
        // 1. Fetch members first to get User IDs
        const { data: members, error: membersError } = await supabase
          .from('project_members')
          .select('id, user_id, project_id, role, joined_at')
          .eq('project_id', projectId)
          .order('joined_at', { ascending: true })

        if (membersError) {
          console.error('❌ Error fetching updated members:', membersError)
          return
        }

        if (!members || members.length === 0) {
          onMembersChange([])
          return
        }

        // 2. Extract User IDs and sanitize
        const userIds = members.map(m => m.user_id).filter(id => id && id.trim().length > 0)

        // Create Profile Map (initially empty)
        const profileMap = new Map()

        // 3. Fetch profiles for these users
        if (userIds.length > 0) {
          let profiles = null;

          // Try fetching with activity_status
          const { data: fullProfiles, error: fullError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, activity_status')
            .in('id', userIds)

          if (!fullError) {
            profiles = fullProfiles;
          } else {
            console.warn('⚠️ Fetch with activity_status failed (likely missing columns), retrying basic fetch...', fullError.code)
            // Fallback: fetch without activity_status
            const { data: basicProfiles, error: basicError } = await supabase
              .from('profiles')
              .select('id, email, full_name, avatar_url')
              .in('id', userIds)

            if (basicError) {
              console.error('❌ Error fetching member profiles (basic fallback):', basicError)
            } else {
              profiles = basicProfiles;
            }
          }

          if (profiles) {
            profiles.forEach((profile: any) => {
              profileMap.set(profile.id, {
                email: profile.email,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                activity_status: profile.activity_status,
              })
            })
          }
        }

        // 5. Format Members
        const formattedMembers: ProjectMember[] = members.map(member => ({
          id: member.id,
          userId: member.user_id,
          email: profileMap.get(member.user_id)?.email || 'Unknown',
          fullName: profileMap.get(member.user_id)?.full_name,
          avatarUrl: profileMap.get(member.user_id)?.avatar_url,
          activityStatus: profileMap.get(member.user_id)?.activity_status || 'inactive',
          role: member.role,
          joinedAt: member.joined_at,
        }))

        console.log('✅ Updated members:', formattedMembers.length)
        onMembersChange(formattedMembers)
      } catch (err) {
        console.error('❌ Error processing real-time member change:', err)
      }
    }

    return () => {
      console.log('🔴 Unsubscribing from real-time members:', projectId)
      channel.unsubscribe()
    }
  }, [projectId, onMembersChange])
}
