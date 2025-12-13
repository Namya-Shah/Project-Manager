import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import ProjectDetail from '@/components/ProjectDetail';
import AddProjectDialog from '@/components/AddProjectDialog';
import ContributionGraph from '@/components/ContributionGraph';
import GroupIdSection from '@/components/GroupIdSection';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserProjects, createProject, addLogEntry, deleteLogEntry, deleteProject, joinProjectByGroupId, ensureUserProfile } from '@/lib/projects';
import { Project } from '@/types/project';

const Index = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const { toast } = useToast();

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    if (user?.id) {
      loadProjects();
    }
  }, [user?.id]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        const data = await getUserProjects(user.id);
        setProjects(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Combine all logs for the overview graph
  const allLogs = useMemo(() => {
    return projects.flatMap((p) => p.logs);
  }, [projects]);

  const handleAddProject = async (name: string, description: string, color: string, isCollaborative: boolean) => {
    try {
      if (!user?.id) return;
      const newProject = await createProject(name, description, color, user.id, isCollaborative);
      setProjects([newProject, ...projects]);
      
      if (isCollaborative && newProject.groupId) {
        toast({
          title: 'Project created',
          description: `${name} created! Group ID: ${newProject.groupId}`,
        });
      } else {
        toast({
          title: 'Project created',
          description: `${name} has been added to your projects.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project',
        variant: 'destructive',
      });
    }
  };

  const handleAddLog = async (content: string, date?: string) => {
    if (!selectedProjectId || !user?.id) return;
    try {
      const logDate = date || new Date().toISOString().split('T')[0];
      await addLogEntry(selectedProjectId, user.id, content, logDate);
      await loadProjects();
      toast({
        title: 'Progress logged',
        description: 'Your update has been recorded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add log',
        variant: 'destructive',
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user?.id) return;
    try {
      setIsJoiningGroup(true);
      const project = await joinProjectByGroupId(groupId, user.id);
      setProjects([project, ...projects]);
      toast({
        title: 'Success!',
        description: `You've joined "${project.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join group',
        variant: 'destructive',
      });
    } finally {
      setIsJoiningGroup(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!user?.id) return;
    try {
      await deleteLogEntry(logId, user.id);
      await loadProjects();
      toast({
        title: 'Log deleted',
        description: 'Your log entry has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete log',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user?.id) return;
    try {
      await deleteProject(projectId, user.id);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      toast({
        title: 'Project deleted',
        description: 'Your project has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProjectId(null)}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            onProjectUpdated={loadProjects}
          />
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Join Group Section */}
        <div className="mb-8">
          <GroupIdSection onJoinGroup={handleJoinGroup} isJoining={isJoiningGroup} />
        </div>

        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back<span className="text-gradient">.</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Track your daily progress across all your projects.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Active Projects</span>
            </div>
            <p className="text-3xl font-bold font-mono">{projects.length}</p>
          </div>
          
          <div className="glass rounded-xl p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Updates</span>
            </div>
            <p className="text-3xl font-bold font-mono">{allLogs.length}</p>
          </div>
          
          <div className="glass rounded-xl p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-activity-high" />
              </div>
              <span className="text-sm text-muted-foreground">Current Streak</span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {allLogs.some((log) => log.date === new Date().toISOString().split('T')[0]) ? '🔥' : '—'}
            </p>
          </div>
        </div>

        {/* Overall Activity Graph */}
        {allLogs.length > 0 && (
          <div className="glass rounded-xl p-6 mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-lg font-semibold mb-4">Overall Activity</h3>
            <ContributionGraph logs={allLogs} weeks={16} />
          </div>
        )}

        {/* Projects Section */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Your Projects</h3>
          <Button onClick={() => setShowAddProject(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, idx) => (
              <div 
                key={project.id} 
                style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                className="animate-fade-in"
              >
                <ProjectCard
                  project={project}
                  onClick={() => setSelectedProjectId(project.id)}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center animate-fade-in">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No projects yet</h4>
            <p className="text-muted-foreground mb-6">
              Create your first project to start tracking your progress.
            </p>
            <Button onClick={() => setShowAddProject(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}
      </main>

      <AddProjectDialog
        open={showAddProject}
        onOpenChange={setShowAddProject}
        onAdd={handleAddProject}
      />
    </div>
  );
};

export default Index;
