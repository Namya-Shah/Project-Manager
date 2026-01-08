import { useMemo, useState, useEffect, useRef } from 'react';
import { DailyLog } from '@/types/project';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

interface ContributionGraphProps {
  logs: DailyLog[];
  weeks?: number; // Optional: Force a specific number of weeks, otherwise responsive
}

const BLOCK_SIZE = 10;
const BLOCK_GAP = 3;
const WEEK_WIDTH = BLOCK_SIZE + BLOCK_GAP;
const DESC_WIDTH = 30; // Width reserved for Mon/Wed/Fri labels

const ContributionGraph = ({ logs, weeks: forcedWeeks }: ContributionGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWeeks, setAvailableWeeks] = useState(52);

  // Responsive calculation
  useEffect(() => {
    if (forcedWeeks) {
      setAvailableWeeks(forcedWeeks);
      return;
    }

    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Calculate how many weeks fit: (Total Width - Label Width) / (Block + Gap)
        const fitWeeks = Math.floor((width - DESC_WIDTH) / WEEK_WIDTH);
        // Ensure at least 4 weeks, max 52
        setAvailableWeeks(Math.max(4, Math.min(52, fitWeeks)));
      }
    };

    // Initial calcs
    updateWidth();

    // Observer
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [forcedWeeks]);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    // We want the last week to be the current week. 
    // So we go back (availableWeeks - 1) weeks from the start of the current week.
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    const startDate = subDays(currentWeekStart, (availableWeeks - 1) * 7);

    // Create a map of dates to log counts
    const logMap = new Map<string, number>();
    logs.forEach((log) => {
      const count = logMap.get(log.date) || 0;
      logMap.set(log.date, count + 1);
    });

    // Generate grid data
    const gridData: { date: Date; count: number; dateStr: string }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];

    for (let week = 0; week < availableWeeks; week++) {
      const weekData: { date: Date; count: number; dateStr: string }[] = [];

      for (let day = 0; day < 7; day++) {
        const date = addDays(startDate, week * 7 + day);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = logMap.get(dateStr) || 0;

        // Label alignment: Check if this week contains the 1st of the month
        if (date.getDate() === 1) {
          months.push({ label: format(date, 'MMM'), weekIndex: week });
        }

        weekData.push({ date, count, dateStr });
      }

      gridData.push(weekData);
    }

    return { grid: gridData, monthLabels: months };
  }, [logs, availableWeeks]);

  const getActivityLevel = (count: number) => {
    if (count === 0) return 'bg-activity-none';
    if (count === 1) return 'bg-activity-low';
    if (count === 2) return 'bg-activity-medium';
    if (count <= 4) return 'bg-activity-high';
    return 'bg-activity-max';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full" ref={containerRef}>
      <div className="inline-block">
        {/* Month labels */}
        {/* We use a relative container shifted by DESC_WIDTH to align exactly with the grid */}
        <div className="flex mb-1 relative h-4" style={{ marginLeft: `${DESC_WIDTH}px` }}>
          {monthLabels.map((month, idx) => (
            <div
              key={`${month.label}-${idx}`}
              className="absolute text-xs text-muted-foreground font-mono"
              style={{
                left: `${month.weekIndex * WEEK_WIDTH}px`,
              }}
            >
              {month.label}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels column */}
          <div
            className="flex flex-col gap-[3px] pr-2 pt-[0px]"
            style={{ width: `${DESC_WIDTH}px` }}
          >
            {dayLabels.map((day, idx) => (
              <div
                key={day}
                className="h-[10px] text-[9px] text-muted-foreground font-mono leading-[10px] text-right"
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
        <div className="flex items-center gap-2 mt-3 justify-end">
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
