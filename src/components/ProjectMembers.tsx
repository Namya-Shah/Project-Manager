import { useState, useEffect, useCallback } from 'react'
import { Project, ProjectMember } from '@/types/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, X, UserPlus, Copy, Share2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { addProjectMember, removeProjectMember, updateMemberRole } from '@/lib/collaboration'
import { useAuth } from '@/hooks/useAuth'
import { useRealtimeMembers } from '@/hooks/useRealtimeMembers'

const EMOJI_AVATARS = ['😀', '😎', '🥳', '🤓', '😍', '🚀', '💻', '⭐', '🔥', '💡', '🎯', '🌟', '👨‍💻', '👩‍💻', '🧑‍🚀', '👽'];
const ICON_AVATARS = ['😊', '🎨', '🎭', '🎪', '🎬', '🎤', '🎸', '🎹', '⚡', '🌈', '🦄', '🐉'];

const ACTIVITY_CONFIG: Record<string, { color: string; label: string }> = {
  active: { color: 'bg-green-500', label: 'Active' },
  idle: { color: 'bg-yellow-500', label: 'Idle' },
  away: { color: 'bg-orange-500', label: 'Away' },
  inactive: { color: 'bg-gray-500', label: 'Inactive' },
}

interface ProjectMembersProps {
  project: Project
  onMembersChanged?: () => void
}

export function ProjectMembers({ project, onMembersChanged }: ProjectMembersProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<ProjectMember[]>(project.members || [])
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.id === project.ownerId

  // Set up real-time member updates
  const handleMembersUpdate = useCallback((updatedMembers: ProjectMember[]) => {
    console.log('🔄 Updating members from real-time:', updatedMembers.length)
    setMembers(updatedMembers)
  }, [])

  useRealtimeMembers(project.id, handleMembersUpdate)

  // Update local state when project prop changes
  useEffect(() => {
    setMembers(project.members || [])
  }, [project.members])

  const handleCopyGroupId = () => {
    if (!project.groupId) {
      toast({
        title: 'Error',
        description: 'This project does not have a group ID',
        variant: 'destructive',
      })
      return
    }
    navigator.clipboard.writeText(project.groupId)
    toast({
      title: 'Copied!',
      description: 'Group ID copied to clipboard',
    })
  }

  const handleAddMember = async () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await addProjectMember(project.id, email, role)
      toast({
        title: 'Success',
        description: `${email} has been added to the project`,
      })
      setEmail('')
      setRole('editor')
      setOpen(false)
      onMembersChanged?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add member',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      await removeProjectMember(project.id, userId)
      toast({
        title: 'Success',
        description: 'Member removed from project',
      })
      onMembersChanged?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      await updateMemberRole(project.id, userId, newRole)
      toast({
        title: 'Success',
        description: 'Member role updated',
      })
      onMembersChanged?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Group ID Card */}
      {project.groupId && (
        <Card className="glass border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4" />
              Group ID
            </CardTitle>
            <CardDescription>Share this code to invite team members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={project.groupId}
                readOnly
                className="font-mono font-bold text-lg tracking-widest text-center bg-background"
              />
              <Button
                onClick={handleCopyGroupId}
                size="icon"
                variant="outline"
                title="Copy group ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this ID can join the project
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Project Members</h3>
        </div>
        {isAdmin && (
          <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="glass rounded-lg p-4 space-y-3">
        {members && members.length > 0 ? (
          members.map((member: ProjectMember) => {
            const activityStatus = member.activityStatus || 'inactive'
            const activityConfig = ACTIVITY_CONFIG[activityStatus] || ACTIVITY_CONFIG.inactive
            const displayName = member.fullName || member.email?.split('@')[0] || 'Unknown'
            const initials = displayName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)

            return (
              <div key={member.id} className="flex items-center justify-between p-3 rounded border border-border/50 hover:bg-secondary/50">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    {member.avatarUrl?.startsWith('http') || member.avatarUrl?.startsWith('data:') ? (
                      <AvatarImage src={member.avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className={`text-lg ${member.avatarUrl && !member.avatarUrl.startsWith('http') && !member.avatarUrl.startsWith('data:') ? 'bg-transparent text-2xl' : 'bg-primary/10 text-primary text-xs'}`}>
                      {(!member.avatarUrl?.startsWith('http') && !member.avatarUrl?.startsWith('data:') && member.avatarUrl) ? member.avatarUrl : initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{displayName}</p>
                      {member.userId === project.ownerId && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 font-medium">
                          Owner
                        </span>
                      )}
                      {project.groupId && (
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${activityConfig.color}`} />
                          <span className="text-xs text-muted-foreground">{activityConfig.label}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && member.userId !== user?.id ? (
                    <>
                      <Select value={member.role} onValueChange={(value) => handleRoleChange(member.userId, value as 'editor' | 'viewer')}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a team member who already has an account in this app
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The user must have an account in this app. They can sign up if they don't have one.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={(value) => setRole(value as 'editor' | 'viewer')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor - Can add/edit logs</SelectItem>
                  <SelectItem value="viewer">Viewer - Can only view logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
