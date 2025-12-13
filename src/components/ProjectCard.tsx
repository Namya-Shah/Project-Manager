import { Project } from '@/types/project';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronRight } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useMemo } from 'react';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: () => void;
}

const ProjectCard = ({ project, onClick, onDelete }: ProjectCardProps) => {
  const recentActivity = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => 
      format(subDays(today, 6 - i), 'yyyy-MM-dd')
    );
    
    return last7Days.map((date) => {
      const logsOnDate = project.logs.filter((log) => log.date === date);
      return { date, count: logsOnDate.length };
    });
  }, [project.logs]);

  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-activity-none';
    if (count === 1) return 'bg-activity-low';
    if (count === 2) return 'bg-activity-medium';
    return 'bg-activity-high';
  };

  const totalLogs = project.logs.length;
  const lastLog = project.logs[project.logs.length - 1];

  return (
    <Card 
      className="glass group cursor-pointer transition-all duration-300 hover:border-primary/30 hover:glow-primary animate-fade-in"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {project.name}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {project.description}
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Mini activity graph */}
        <div className="flex items-center gap-1 mb-3">
          {recentActivity.map((day, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-sm ${getActivityColor(day.count)} transition-all`}
              title={`${day.count} updates on ${day.date}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2 font-mono">
            Last 7 days
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono">{totalLogs} updates</span>
            {lastLog && (
              <span className="font-mono text-xs">
                Last: {format(new Date(lastLog.createdAt), 'MMM d')}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
