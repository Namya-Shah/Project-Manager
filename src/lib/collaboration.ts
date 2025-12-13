import { supabase } from '@/lib/supabase'
import { Project, ProjectMember } from '@/types/project'

// Get all projects for a user (owned + member of)
export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      color,
      owner_id,
      created_at,
      project_members (
        id,
        user_id,
        role,
        joined_at,
        profiles (email, full_name)
      ),
      logs (
        id,
        content,
        date,
        created_at,
        user_id,
        profiles (email)
      )
    `)
    .or(`owner_id.eq.${userId},project_members.user_id.eq.${userId}`)

  if (error) throw error
  return data || []
}

// Get single project with members
export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      color,
      owner_id,
      created_at,
      project_members (
        id,
        user_id,
        role,
        joined_at,
        profiles (email, full_name)
      ),
      logs (
        id,
        content,
        date,
        created_at,
        user_id,
        profiles (email)
      )
    `)
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

// Add member to project
export async function addProjectMember(
  projectId: string,
  email: string,
  role: 'editor' | 'viewer' = 'editor'
): Promise<void> {
  // First, get user ID by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (userError) throw new Error(`User with email ${email} not found`)

  // Add member to project
  const { error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userData.id,
      role,
    })

  if (error) throw error
}

// Remove member from project
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}

// Update member role
export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: 'editor' | 'viewer'
): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}

// Check if user is member of project
export async function isProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (project?.owner_id === userId) return true

  const { data: member } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  return !!member
}

// Get member role
export async function getMemberRole(
  projectId: string,
  userId: string
): Promise<'owner' | 'editor' | 'viewer' | null> {
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (project?.owner_id === userId) return 'owner'

  const { data: member } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  return member?.role || null
}

// Add log (used by any project member)
export async function addLog(
  projectId: string,
  userId: string,
  content: string,
  date: string
): Promise<void> {
  const { error } = await supabase
    .from('logs')
    .insert({
      project_id: projectId,
      user_id: userId,
      content,
      date,
    })

  if (error) throw error
}

// Delete log (only owner or log creator can delete)
export async function deleteLog(
  logId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId)

  if (error) throw error
}

// Get project activity (all member contributions)
export async function getProjectActivity(projectId: string) {
  const { data, error } = await supabase
    .from('logs')
    .select(`
      id,
      content,
      date,
      created_at,
      user_id,
      profiles (email, full_name)
    `)
    .eq('project_id', projectId)
    .order('date', { ascending: false })

  if (error) throw error
  return data
}
