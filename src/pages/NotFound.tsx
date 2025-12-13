import { useState, useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import ProjectDetail from '@/components/ProjectDetail';
import AddProjectDialog from '@/components/AddProjectDialog';
import ContributionGraph from '@/components/ContributionGraph';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { projects, addProject, deleteProject, addLog, deleteLog, getProject } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const { toast } = useToast();

  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : null;

  // Combine all logs for the overview graph
  const allLogs = useMemo(() => {
    return projects.flatMap((p) => p.logs);
  }, [projects]);

  const handleAddProject = (name: string, description: string, color: string) => {
    addProject(name, description, color);
    toast({
      title: "Project created",
      description: `${name} has been added to your projects.`,
    });
  };

  const handleDeleteProject = (projectId: string) => {
    const project = getProject(projectId);
    deleteProject(projectId);
    toast({
      title: "Project deleted",
      description: `${project?.name} has been removed.`,
    });
  };

  const handleAddLog = (content: string, date?: string) => {
    if (selectedProjectId) {
      addLog(selectedProjectId, content, date);
      toast({
        title: "Progress logged",
        description: "Your update has been recorded.",
      });
    }
  };

  const handleDeleteLog = (logId: string) => {
    if (selectedProjectId) {
      deleteLog(selectedProjectId, logId);
      toast({
        title: "Log deleted",
        description: "The log entry has been removed.",
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
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
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
