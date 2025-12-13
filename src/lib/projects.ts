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
      console.error('❌ Error loading owned projects:', ownedError.message)
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

    return allProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.created_at,
      ownerId: project.owner_id,
      groupId: project.group_id,
      logs: project.logs?.map(log => ({
        id: log.id,
        content: log.content,
        date: log.date,
        createdAt: log.created_at,
        userId: log.user_id,
        userEmail: undefined,
      })) || [],
      members: project.project_members?.map(member => ({
        id: member.id,
        userId: member.user_id,
        email: '',
        fullName: undefined,
        role: member.role,
        joinedAt: member.joined_at,
      })) || [],
    }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Error in getUserProjects:', message)
    return []
  }
}

// Join project by group ID
export async function joinProjectByGroupId(
  groupId: string,
  userId: string
): Promise<Project> {
  try {
    console.log('🔵 Joining project with Group ID:', groupId)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('group_id', groupId)
      .single()

    if (projectError) {
      console.error('❌ Group not found:', groupId)
      throw new Error('Group not found')
    }

    if (!project) {
      throw new Error('Project not found for this group ID')
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

    return {
      id: fullProject.id,
      name: fullProject.name,
      description: fullProject.description,
      color: fullProject.color,
      createdAt: fullProject.created_at,
      ownerId: fullProject.owner_id,
      groupId: fullProject.group_id,
      logs: fullProject.logs?.map(log => ({
        id: log.id,
        content: log.content,
        date: log.date,
        createdAt: log.created_at,
        userId: log.user_id,
        userEmail: undefined,
      })) || [],
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

    return {
      id: data.id,
      content: data.content,
      date: data.date,
      createdAt: data.created_at,
      userId: data.user_id,
      userEmail: undefined,
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
