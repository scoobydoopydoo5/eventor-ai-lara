import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { FiEdit, FiTrash2, FiExternalLink, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { format, addDays } from 'date-fns';

interface GanttViewProps {
  event: any;
  tasks: any[];
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
}

type ViewMode = 'week' | 'month';

export function GanttView({ event, tasks, onEditTask, onDeleteTask }: GanttViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysToShow, setDaysToShow] = useState(14);

  const ganttData = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.start_date && t.due_date);
    
    if (tasksWithDates.length === 0) return { tasks: [], minDate: new Date(), maxDate: new Date(), totalDays: 0 };

    // Calculate date range based on zoom level
    const minDate = currentDate;
    const maxDate = addDays(currentDate, daysToShow);

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const processedTasks = tasksWithDates
      .map(task => {
        const start = new Date(task.start_date);
        const end = new Date(task.due_date);
        
        // Check if task overlaps with current view range
        if (end < minDate || start > maxDate) return null;
        
        const startOffset = Math.max(0, Math.floor((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const endOffset = Math.min(totalDays, Math.ceil((end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const duration = endOffset - startOffset + 1;
        
        if (duration <= 0) return null;
        
        return {
          ...task,
          startOffset,
          duration,
          widthPercent: (duration / totalDays) * 100,
          leftPercent: (startOffset / totalDays) * 100,
        };
      })
      .filter(Boolean);

    return { tasks: processedTasks, minDate, maxDate, totalDays };
  }, [tasks, viewMode, currentDate, daysToShow]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'next' ? daysToShow : -daysToShow));
  };

  const handleZoom = (increment: number) => {
    setDaysToShow(prev => Math.max(3, Math.min(30, prev + increment)));
  };

  if (tasks.filter(t => t.start_date && t.due_date).length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <p className="text-xl font-semibold">No Timeline Data Available</p>
          <p className="text-muted-foreground">
            Tasks need both start and due dates to appear on the Gantt chart
          </p>
          <p className="text-sm text-muted-foreground">
            Use the "Generate AI Tasks" button to create tasks with proper dates
          </p>
        </div>
      </Card>
    );
  }

  // Generate day/week markers
  const markers: { label: string; position: number }[] = [];
  const markerCount = viewMode === 'week' ? 7 : ganttData.totalDays;
  
  for (let i = 0; i < markerCount; i++) {
    const date = addDays(ganttData.minDate, viewMode === 'week' ? i : Math.floor(i * ganttData.totalDays / markerCount));
    const position = (i / markerCount) * 100;
    markers.push({
      label: viewMode === 'week' ? format(date, 'EEE d') : format(date, 'd'),
      position
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Project Timeline</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(ganttData.minDate, 'MMM dd, yyyy')} - {format(ganttData.maxDate, 'MMM dd, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground font-medium">Zoom:</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleZoom(-1)} disabled={daysToShow <= 3}>
              <span className="text-lg">-</span>
            </Button>
            <span className="text-xs font-semibold min-w-[50px] text-center">{daysToShow} days</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleZoom(1)} disabled={daysToShow >= 30}>
              <span className="text-lg">+</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
              <FiChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('next')}>
              <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6">
        {/* Timeline Header */}
        <div className="mb-6 relative">
          <div className="h-12 bg-muted/30 rounded-lg relative overflow-hidden">
            {markers.map((marker, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 flex items-center px-2 text-xs font-medium text-muted-foreground border-l border-border"
                style={{ left: `${marker.position}%` }}
              >
                {marker.label}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {ganttData.tasks.map((task: any) => (
            <div key={task.id} className="group">
              <div className="flex items-center gap-3">
                <div className="min-w-[200px] max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{task.title}</span>
                    {task.url && (
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <FiExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                    {task.category && (
                      <Badge variant="secondary" className="text-xs">
                        {task.category}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 relative h-10 bg-muted/20 rounded-lg overflow-hidden group-hover:ring-2 ring-primary/30 transition-all">
                  <div
                    className={`absolute h-full rounded-lg ${getPriorityColor(task.priority)} flex items-center px-3 shadow-md hover:shadow-lg transition-all cursor-pointer`}
                    style={{
                      left: `${task.leftPercent}%`,
                      width: `${task.widthPercent}%`,
                      minWidth: '60px',
                    }}
                    onClick={() => onEditTask && onEditTask(task)}
                  >
                    <span className="text-xs font-semibold text-white truncate">
                      {format(new Date(task.start_date), 'MMM dd')} - {format(new Date(task.due_date), 'MMM dd')}
                    </span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {onEditTask && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditTask(task)}
                    >
                      <FiEdit className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteTask && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <FiTrash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {task.description && (
                <div className="text-xs text-muted-foreground ml-[200px] mt-1 line-clamp-1">
                  {task.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-muted/30">
        <h4 className="font-semibold mb-3 text-sm">Priority Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-500 shadow-sm"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 shadow-sm"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-green-500 shadow-sm"></div>
            <span>Low Priority</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
