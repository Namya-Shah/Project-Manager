import { useMemo } from 'react';
import { DailyLog } from '@/types/project';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

interface ContributionGraphProps {
  logs: DailyLog[];
  weeks?: number;
}

const ContributionGraph = ({ logs, weeks = 20 }: ContributionGraphProps) => {
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, weeks * 7), { weekStartsOn: 0 });
    
    // Create a map of dates to log counts
    const logMap = new Map<string, number>();
    logs.forEach((log) => {
      const count = logMap.get(log.date) || 0;
      logMap.set(log.date, count + 1);
    });
    
    // Generate grid data
    const gridData: { date: Date; count: number; dateStr: string }[][] = [];
    const months: { label: string; col: number }[] = [];
    let currentMonth = '';
    
    for (let week = 0; week < weeks; week++) {
      const weekData: { date: Date; count: number; dateStr: string }[] = [];
      
      for (let day = 0; day < 7; day++) {
        const date = addDays(startDate, week * 7 + day);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = logMap.get(dateStr) || 0;
        
        // Track month labels
        const monthLabel = format(date, 'MMM');
        if (monthLabel !== currentMonth && day === 0) {
          months.push({ label: monthLabel, col: week });
          currentMonth = monthLabel;
        }
        
        weekData.push({ date, count, dateStr });
      }
      
      gridData.push(weekData);
    }
    
    return { grid: gridData, monthLabels: months };
  }, [logs, weeks]);

  const getActivityLevel = (count: number) => {
    if (count === 0) return 'bg-activity-none';
    if (count === 1) return 'bg-activity-low';
    if (count === 2) return 'bg-activity-medium';
    if (count <= 4) return 'bg-activity-high';
    return 'bg-activity-max';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-fit">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {monthLabels.map((month, idx) => (
            <div
              key={idx}
              className="text-xs text-muted-foreground font-mono"
              style={{ 
                marginLeft: idx === 0 ? `${month.col * 14}px` : `${(month.col - (monthLabels[idx - 1]?.col || 0) - 1) * 14}px`
              }}
            >
              {month.label}
            </div>
          ))}
        </div>
        
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {dayLabels.map((day, idx) => (
              <div
                key={day}
                className="h-[10px] text-[10px] text-muted-foreground font-mono leading-[10px]"
                style={{ visibility: idx % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="flex gap-[3px]">
            {grid.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dayIdx) => (
                  <Tooltip key={dayIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-[10px] h-[10px] rounded-[2px] ${getActivityLevel(day.count)} transition-all duration-200 hover:ring-1 hover:ring-foreground/30 cursor-pointer`}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="font-mono text-xs">
                      <p className="font-semibold">
                        {day.count} {day.count === 1 ? 'update' : 'updates'}
                      </p>
                      <p className="text-muted-foreground">
                        {format(day.date, 'MMM d, yyyy')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8">
          <span className="text-xs text-muted-foreground font-mono">Less</span>
          <div className="flex gap-[3px]">
            <div className="w-[10px] h-[10px] rounded-[2px] bg-activity-none" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-activity-low" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-activity-medium" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-activity-high" />
            <div className="w-[10px] h-[10px] rounded-[2px] bg-activity-max" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">More</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
