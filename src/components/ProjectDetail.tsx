import { useState } from 'react';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2, Calendar, Users } from 'lucide-react';
import ContributionGraph from './ContributionGraph';
import AddLogDialog from './AddLogDialog';
import { ProjectMembers } from './ProjectMembers';
import { ContributorActivity } from './ContributorActivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onAddLog: (content: string, date?: string) => void;
  onDeleteLog: (logId: string) => void;
  onProjectUpdated?: () => void;
}

const ProjectDetail = ({ project, onBack, onAddLog, onDeleteLog, onProjectUpdated }: ProjectDetailProps) => {
  const [showAddLog, setShowAddLog] = useState(false);
  const { user } = useAuth();
  const isOwner = user?.id === project.ownerId;
  const canEdit = isOwner || project.members?.some(m => m.userId === user?.id && m.role === 'editor');

  // Group logs by date
  const logsByDate = project.logs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, typeof project.logs>);

  const sortedDates = Object.keys(logsByDate).sort((a, b) => 
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
        
        {canEdit && (
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
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Contribution Graph */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Contribution Graph
            </h2>
            <ContributionGraph logs={project.logs} weeks={24} />
          </div>

          {/* Team Activity */}
          <ContributorActivity projectId={project.id} />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Add Log Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Progress Logs</h2>
            {canEdit && (
              <Button onClick={() => setShowAddLog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Log
              </Button>
            )}
          </div>

          {/* Logs Timeline */}
          {sortedDates.length > 0 ? (
            <div className="space-y-6">
              {sortedDates.map((date) => (
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
                    {logsByDate[date].map((log) => (
                      <div
                        key={log.id}
                        className="glass rounded-lg p-4 group animate-fade-in"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-foreground/90">{log.content}</p>
                            {log.userEmail && (
                              <p className="text-xs text-muted-foreground mt-1">
                                By {log.userEmail}
                              </p>
                            )}
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
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <ProjectMembers project={project} onMembersChanged={onProjectUpdated} />
        </TabsContent>
      </Tabs>

      <AddLogDialog
        open={showAddLog}
        onOpenChange={setShowAddLog}
        onAdd={onAddLog}
        projectName={project.name}
      />
    </div>
  );
};

export default ProjectDetail;
