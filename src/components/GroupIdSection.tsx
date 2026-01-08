import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Share2, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { validateGroupId } from '@/lib/projects'

interface GroupIdSectionProps {
  groupId?: string
  onJoinGroup?: (groupId: string) => Promise<void>
  isJoining?: boolean
}

export function GroupIdSection({ groupId, onJoinGroup, isJoining = false }: GroupIdSectionProps) {
  const [joinGroupId, setJoinGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCopyGroupId = () => {
    if (groupId) {
      navigator.clipboard.writeText(groupId)
      toast({
        title: 'Copied!',
        description: 'Group ID copied to clipboard',
      })
    }
  }

  const handleJoinGroup = async () => {
    if (!joinGroupId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group ID',
        variant: 'destructive',
      })
      return
    }

    // Validate format (should be 6 characters)
    if (joinGroupId.trim().length !== 6) {
      toast({
        title: 'Error',
        description: 'Group ID must be exactly 6 characters',
        variant: 'destructive',
      })
      return
    }

    // Check existence in DB before attempting to join
    const exists = await validateGroupId(joinGroupId)
    if (!exists) {
      toast({
        title: 'Error',
        description: 'Group ID not found. Please check the ID and try again.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      if (onJoinGroup) {
        await onJoinGroup(joinGroupId.toUpperCase())
      }
      setJoinGroupId('')
      toast({
        title: 'Success!',
        description: 'You have joined the group',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join group',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {groupId && (
        <Card className="glass border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Group ID
            </CardTitle>
            <CardDescription>Share this with team members to invite them</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={groupId}
                readOnly
                className="font-mono font-bold text-lg tracking-widest text-center"
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
              Share this 6-character code with team members to let them join this project
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Join Project by Group ID
          </CardTitle>
          <CardDescription>Enter a group ID to join an existing project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input
              placeholder="Enter 6-character group ID (e.g., ABC123)"
              value={joinGroupId}
              onChange={(e) => setJoinGroupId(e.target.value.toUpperCase())}
              disabled={isLoading || isJoining}
              maxLength={6}
              className="font-mono font-bold text-center tracking-widest"
            />
            <Button
              onClick={handleJoinGroup}
              disabled={isLoading || isJoining || !joinGroupId}
              className="w-full gap-2"
            >
              {(isLoading || isJoining) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading || isJoining ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GroupIdSection
