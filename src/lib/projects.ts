import { supabase } from '@/lib/supabase'
import { Project, DailyLog } from '@/types/project'

// Generate a shareable group ID
export function generateGroupId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Create a new project
export async function createProject(
  name: string,
  description: string,
  color: string,
  userId: string,
  isCollaborative: boolean = true
): Promise<Project> {
  try {
    console.log('🔵 Creating project:', { name, userId, isCollaborative })

    // Ensure user profile exists before creating project
    await ensureUserProfile(userId)

    const groupId = isCollaborative ? generateGroupId() : null

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        color,
        owner_id: userId,
        group_id: groupId,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Insert error:', error.message, error.details, error.hint)
      throw new Error(`Failed to create project: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from project creation')
    }

    console.log('✅ Project created:', data.id)

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      createdAt: data.created_at,
      ownerId: data.owner_id,
      groupId: data.group_id || undefined,
      logs: [],
      members: [],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in createProject:', message)
    throw err
  }
}

// Get all projects for a user
export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    console.log('🔵 Loading projects for user:', userId)

    // Check Supabase connection
    const { data: healthCheck } = await supabase.from('projects').select('id').limit(1)
    if (healthCheck === null) {
      console.error('❌ Supabase connection failed - check your environment variables')
      throw new Error('Database connection failed. Please check your Supabase configuration.')
    }

    // First, get projects owned by this user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        color,
        owner_id,
        group_id,
        created_at,
        project_members (
          id,
          user_id,
          role,
          joined_at
        ),
        logs (
          id,
          content,
          date,
          created_at,
          user_id
        )
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('❌ Error loading owned projects:', ownedError.message, ownedError)
      throw ownedError
    }

    // Next, get projects where user is a member
    const { data: memberProjects, error: memberError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        projects (
          id,
          name,
          description,
          color,
          owner_id,
          group_id,
          created_at,
          project_members (
            id,
            user_id,
            role,
            joined_at
          ),
          logs (
            id,
            content,
            date,
            created_at,
            user_id
          )
        )
      `)
      .eq('user_id', userId)

    if (memberError) {
      console.error('❌ Error loading member projects:', memberError.message)
    }

    // Combine and deduplicate projects
    const allProjectsMap = new Map()

    // Add owned projects
    if (ownedProjects) {
      ownedProjects.forEach(project => {
        allProjectsMap.set(project.id, project)
      })
    }

    // Add member projects
    if (memberProjects) {
      memberProjects.forEach(item => {
        if (item.projects) {
          allProjectsMap.set(item.projects.id, item.projects)
        }
      })
    }

    const allProjects = Array.from(allProjectsMap.values())
    console.log('✅ Projects loaded:', allProjects.length)

    // Fetch profile data for all log user IDs and member user IDs
    const allUserIds = new Set<string>()
    allProjects.forEach(project => {
      project.logs?.forEach(log => {
        if (log.user_id) allUserIds.add(log.user_id)
      })
      project.project_members?.forEach(member => {
        allUserIds.add(member.user_id)
      })
    })

    // Fetch all profiles at once
    const profileMap = new Map<string, { email?: string; full_name?: string; avatar_url?: string; activity_status?: string }>()
    if (allUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', Array.from(allUserIds))

      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, {
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          })
        })
      }
    }

    return allProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.created_at,
      ownerId: project.owner_id,
      groupId: project.group_id,
      logs: project.logs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(log => {
        const profile = log.user_id ? profileMap.get(log.user_id) : null
        return {
          id: log.id,
          content: log.content,
          date: log.date,
          createdAt: log.created_at,
          userId: log.user_id,
          userEmail: profile?.email,
          userName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          avatarUrl: profile?.avatar_url,
        }
      }) || [],
      members: (() => {
        const membersList = (project.project_members || []).map(member => {
          const profile = profileMap.get(member.user_id)
          return {
            id: member.id,
            userId: member.user_id,
            email: profile?.email || '',
            fullName: profile?.full_name || 'Unknown',
            avatarUrl: profile?.avatar_url,
            role: member.role,
            joinedAt: member.joined_at,
            activityStatus: profile?.activity_status || 'inactive',
          }
        })

        // Add owner as admin if not already in members
        const ownerProfile = profileMap.get(project.owner_id)
        const ownerExists = membersList.some(m => m.userId === project.owner_id)
        if (!ownerExists && ownerProfile) {
          membersList.unshift({
            id: `owner-${project.owner_id}`,
            userId: project.owner_id,
            email: ownerProfile.email || '',
            fullName: ownerProfile.full_name || 'Unknown',
            avatarUrl: ownerProfile.avatar_url,
            role: 'admin',
            joinedAt: project.created_at,
            activityStatus: ownerProfile.activity_status || 'inactive',
          })
        }

        return membersList
      })(),
    }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in getUserProjects:', message)
    return []
  }
}

// Validate if a group ID exists
export async function validateGroupId(groupId: string): Promise<boolean> {
  try {
    if (!groupId || !groupId.trim()) {
      return false
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('group_id', groupId.trim().toUpperCase())
      .single()

    if (error || !data) {
      return false
    }

    return true
  } catch (err) {
    console.error('❌ Error validating group ID:', err)
    return false
  }
}

// Join project by group ID
export async function joinProjectByGroupId(
  groupId: string,
  userId: string
): Promise<Project> {
  try {
    console.log('🔵 Joining project with Group ID:', groupId)

    // Validate group ID format - only check if value is provided
    if (!groupId || !groupId.trim()) {
      throw new Error('Please enter a group ID')
    }

    const normalizedGroupId = groupId.trim().toUpperCase()

    // Check if group ID exists in backend - only validate existence when value is provided
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('group_id', normalizedGroupId)
      .single()

    if (projectError || !project) {
      console.error('❌ Group not found:', normalizedGroupId)
      throw new Error('Group ID not found. Please check the ID and try again.')
    }

    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', userId)
      .single()

    if (!checkError && existingMember) {
      throw new Error('You are already a member of this project')
    }

    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'editor',
      })

    if (memberError) {
      console.error('❌ Failed to add member:', memberError.message)
      throw memberError
    }

    console.log('✅ Joined project successfully')

    const { data: fullProject, error: fetchError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        color,
        owner_id,
        group_id,
        created_at,
        project_members (
          id,
          user_id,
          role,
          joined_at
        ),
        logs (
          id,
          content,
          date,
          created_at,
          user_id
        )
      `)
      .eq('id', project.id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching project:', fetchError.message)
      throw fetchError
    }

    // Fetch profile data for all log user IDs
    const logUserIds = new Set<string>()
    fullProject.logs?.forEach(log => {
      if (log.user_id) logUserIds.add(log.user_id)
    })

    const profileMap = new Map<string, { email?: string; full_name?: string; avatar_url?: string }>()
    if (logUserIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', Array.from(logUserIds))

      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, {
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          })
        })
      }
    }

    return {
      id: fullProject.id,
      name: fullProject.name,
      description: fullProject.description,
      color: fullProject.color,
      createdAt: fullProject.created_at,
      ownerId: fullProject.owner_id,
      groupId: fullProject.group_id,
      logs: fullProject.logs?.map(log => {
        const profile = log.user_id ? profileMap.get(log.user_id) : null
        return {
          id: log.id,
          content: log.content,
          date: log.date,
          createdAt: log.created_at,
          userId: log.user_id,
          userEmail: profile?.email,
          userName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          avatarUrl: profile?.avatar_url,
        }
      }) || [],
      members: fullProject.project_members?.map(member => ({
        id: member.id,
        userId: member.user_id,
        email: '',
        fullName: undefined,
        role: member.role,
        joinedAt: member.joined_at,
      })) || [],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in joinProjectByGroupId:', message)
    throw err
  }
}

// Add a log entry
export async function addLogEntry(
  projectId: string,
  userId: string,
  content: string,
  date: string
): Promise<DailyLog> {
  try {
    console.log('🔵 Adding log entry for project:', projectId)

    const { data, error } = await supabase
      .from('logs')
      .insert({
        project_id: projectId,
        user_id: userId,
        content,
        date,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Log creation error:', error.message)
      throw error
    }

    console.log('✅ Log added successfully')

    // Fetch user profile for the log
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, avatar_url')
      .eq('id', data.user_id)
      .single()

    return {
      id: data.id,
      content: data.content,
      date: data.date,
      createdAt: data.created_at,
      userId: data.user_id,
      userEmail: profile?.email,
      userName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
      avatarUrl: profile?.avatar_url,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in addLogEntry:', message)
    throw err
  }
}

// Delete a log entry
export async function deleteLogEntry(logId: string, userId: string): Promise<void> {
  try {
    console.log('🔵 Deleting log:', logId)

    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Log deletion error:', error.message)
      throw error
    }

    console.log('✅ Log deleted successfully')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in deleteLogEntry:', message)
    throw err
  }
}

// Delete a project
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  try {
    console.log('🔵 Deleting project:', projectId)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', userId)

    if (error) {
      console.error('❌ Project deletion error:', error.message)
      throw error
    }

    console.log('✅ Project deleted successfully')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in deleteProject:', message)
    throw err
  }
}

// Ensure user profile exists (creates if missing)
export async function ensureUserProfile(userId: string, email?: string): Promise<void> {
  try {
    console.log('�� Ensuring user profile exists:', userId)

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', checkError.message)
      // PGRST116 means no rows found, which is expected
    }

    if (existingProfile) {
      console.log('✅ Profile already exists')
      return
    }

    // Profile doesn't exist, create it
    console.log('📝 Creating missing profile for user:', userId)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email || 'no-email@example.com',
        full_name: '',
      })

    if (insertError) {
      console.error('❌ Error creating profile:', insertError)
      // Detect foreign key violation (auth.users missing)
      const msg = insertError.message || JSON.stringify(insertError)
      if (/foreign key|violates foreign key|profiles_id_fkey|owner_id/.test(msg.toLowerCase())) {
        throw new Error(
          `Cannot create profile: the user id ${userId} is not present in auth.users. ` +
          `This means the auth record is missing (session may be stale) — try signing out and signing in again, or run the server-side SQL to recreate users/profiles. See DATABASE_RESET_FINAL.sql for trigger setup.`
        )
      }

      throw new Error(msg)
    }

    console.log('✅ Profile created successfully')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in ensureUserProfile:', message)
    throw err
  }
}
// Get activity status of group members
export async function getGroupMembersActivity(projectId: string): Promise<
  Array<{
    userId: string
    email: string
    fullName: string
    activityStatus: string
    lastActiveAt: string
  }>
> {
  try {
    const { data: members, error: memberError } = await supabase
      .from('project_members')
      .select(
        `
        user_id,
        profiles (
          id,
          email,
          full_name
        )
      `
      )
      .eq('project_id', projectId)

    if (memberError) {
      console.error('❌ Error fetching group members:', memberError)
      return []
    }

    return (
      members?.map((m: any) => ({
        userId: m.user_id,
        email: m.profiles?.email || '',
        fullName: m.profiles?.full_name || 'Unknown',
        activityStatus: 'inactive',
        lastActiveAt: m.profiles?.last_active_at || new Date().toISOString(),
      })) || []
    )
  } catch (err) {
    console.error('❌ Error in getGroupMembersActivity:', err)
    return []
  }
}