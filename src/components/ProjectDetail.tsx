import { useState, useCallback, useEffect } from 'react';
import { Project, DailyLog } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Plus, Trash2, Calendar, Users } from 'lucide-react';
import ContributionGraph from './ContributionGraph';
import AddLogDialog from './AddLogDialog';
import { ProjectMembers } from './ProjectMembers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeLogs } from '@/hooks/useRealtimeLogs';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onAddLog: (content: string, date?: string) => void;
  onDeleteLog: (logId: string) => void;
  onProjectUpdated?: () => void;
}

const ProjectDetail = ({ project, onBack, onAddLog, onDeleteLog, onProjectUpdated }: ProjectDetailProps) => {
  const [showAddLog, setShowAddLog] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [logs, setLogs] = useState(project.logs);

  // Sync logs when project prop updates (e.g. from parent refresh)
  useEffect(() => {
    if (project.logs) {
      setLogs(project.logs);
    }
  }, [project.logs]);
  const { user } = useAuth();
  const isOwner = user?.id === project.ownerId;
  const canEdit = isOwner || project.members?.some(m => m.userId === user?.id && m.role === 'editor');

  // Handle adding log with optimistic update
  const handleAddLog = async (content: string, date?: string) => {
    const logDate = date || new Date().toISOString().split('T')[0]

    // Optimistic update - add log immediately
    const tempLog = {
      id: `temp-${Date.now()}`,
      content,
      date: logDate,
      createdAt: new Date().toISOString(),
      userId: user?.id || '',
      userEmail: user?.email,
      userName: 'You',
      avatarUrl: undefined,
    }

    setLogs([tempLog, ...logs])
    setShowAddLog(false)

    // Call the actual add log function
    onAddLog(content, date)
  }

  // Handle deleting log with optimistic update
  const handleDeleteLog = (logId: string) => {
    // Optimistic update - remove log immediately
    setLogs(logs.filter(log => log.id !== logId))

    // Call the actual delete function
    onDeleteLog(logId)
  }

  // Set up real-time log updates for collaborative projects
  const handleLogsUpdate = useCallback((updatedLogs: DailyLog[]) => {
    console.log('🔄 Updating logs from real-time:', updatedLogs.length)
    setLogs(updatedLogs)
  }, [])

  useRealtimeLogs(project.id, handleLogsUpdate)

  // Filter logs for current user (for contribution graph and my logs)
  const myLogs = logs.filter(log => log.userId === user?.id);

  // Group my logs by date
  const myLogsByDate = myLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, typeof myLogs>);

  const sortedMyDates = Object.keys(myLogsByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Group all team logs by date (for team logs tab)
  const allLogsByDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, typeof project.logs>);

  const sortedTeamDates = Object.keys(allLogsByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-xs text-muted-foreground">
                {project.members && project.members.length > 0 && (
                  <>
                    <Users className="h-3 w-3 inline mr-1" />
                    {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {canEdit && activeTab === 'activity' && (
          <Button onClick={() => setShowAddLog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Log
          </Button>
        )}
      </div>

      {/* Description */}
      <p className="text-muted-foreground max-w-2xl">
        {project.description}
      </p>

      {/* Tabs for different views */}
      <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="team-logs">Team Logs</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Activity Tab - My Logs and Contribution Graph */}
        <TabsContent value="activity" className="space-y-6">
          {/* Contribution Graph - My Activity */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Contribution Graph
            </h2>
            <ContributionGraph logs={myLogs} />
          </div>

          {/* My Logs Timeline */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">My Progress Logs</h2>
            {sortedMyDates.length > 0 ? (
              <div className="space-y-6">
                {sortedMyDates.map((date) => (
                  <div key={date} className="relative">
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="font-mono text-sm font-medium text-primary">
                        {format(new Date(date), 'MMMM d, yyyy')}
                      </span>
                    </div>

                    {/* Logs for this date */}
                    <div className="ml-6 pl-6 border-l border-border space-y-3">
                      {myLogsByDate[date].map((log) => (
                        <div
                          key={log.id}
                          className="glass rounded-lg p-4 group animate-fade-in"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-foreground/90">{log.content}</p>
                            </div>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => onDeleteLog(log.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono mt-2 block">
                            {format(new Date(log.createdAt), 'h:mm a')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <p className="text-muted-foreground mb-4">No logs yet. Start tracking your progress!</p>
                {canEdit && (
                  <Button onClick={() => setShowAddLog(true)} variant="secondary" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Log
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Team Logs Tab */}
        <TabsContent value="team-logs" className="space-y-6">
          <h2 className="text-lg font-semibold">Team Progress Logs</h2>
          {sortedTeamDates.length > 0 ? (
            <div className="space-y-6">
              {sortedTeamDates.map((date) => (
                <div key={date} className="relative">
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="font-mono text-sm font-medium text-primary">
                      {format(new Date(date), 'MMMM d, yyyy')}
                    </span>
                  </div>

                  {/* Logs for this date */}
                  <div className="ml-6 pl-6 border-l border-border space-y-3">
                    {allLogsByDate[date].map((log) => {
                      const displayName = log.userName || log.userEmail?.split('@')[0] || 'Unknown';
                      const initials = displayName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);

                      return (
                        <div
                          key={log.id}
                          className="glass rounded-lg p-4 group animate-fade-in"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Avatar className="h-8 w-8 shrink-0">
                                {log.avatarUrl?.startsWith('http') || log.avatarUrl?.startsWith('data:') ? (
                                  <AvatarImage src={log.avatarUrl} alt={displayName} />
                                ) : null}
                                <AvatarFallback className={`text-xs ${log.avatarUrl && !log.avatarUrl.startsWith('http') && !log.avatarUrl.startsWith('data:') ? 'bg-transparent text-base' : 'bg-primary/10 text-primary'}`}>
                                  {(!log.avatarUrl?.startsWith('http') && !log.avatarUrl?.startsWith('data:') && log.avatarUrl) ? log.avatarUrl : initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {displayName}
                                  </p>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {format(new Date(log.createdAt), 'h:mm a')}
                                  </span>
                                </div>
                                <p className="text-foreground/90">{log.content}</p>
                              </div>
                            </div>
                            {canEdit && log.userId === user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => handleDeleteLog(log.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center">
              <p className="text-muted-foreground">No team logs yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <ProjectMembers project={project} onMembersChanged={onProjectUpdated} />
        </TabsContent>
      </Tabs>

      <AddLogDialog
        open={showAddLog}
        onOpenChange={setShowAddLog}
        onAdd={handleAddLog}
        projectName={project.name}
      />
    </div>
  );
};

export default ProjectDetail;
