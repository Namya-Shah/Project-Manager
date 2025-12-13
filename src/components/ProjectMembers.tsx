import { useState } from 'react'
import { Project, ProjectMember } from '@/types/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, X, UserPlus, Copy, Share2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { addProjectMember, removeProjectMember, updateMemberRole } from '@/lib/collaboration'
import { useAuth } from '@/hooks/useAuth'

interface ProjectMembersProps {
  project: Project
  onMembersChanged?: () => void
}

export function ProjectMembers({ project, onMembersChanged }: ProjectMembersProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const isOwner = user?.id === project.ownerId

  const handleCopyGroupId = () => {
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Project Members</h3>
        </div>
        {isOwner && (
          <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="glass rounded-lg p-4 space-y-2">
        {project.members && project.members.length > 0 ? (
          project.members.map((member: ProjectMember) => (
            <div key={member.id} className="flex items-center justify-between p-3 rounded border border-border/50 hover:bg-secondary/50">
              <div className="flex-1">
                <p className="font-medium text-sm">{member.email}</p>
                {member.fullName && (
                  <p className="text-xs text-muted-foreground">{member.fullName}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isOwner ? (
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
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.userId)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-1 rounded">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))
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
              Invite someone to collaborate on this project
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
