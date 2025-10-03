import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { FiEdit, FiTrash2, FiExternalLink, FiChevronDown, FiChevronRight, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { format, differenceInDays } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GanttViewProps {
  event: any;
  tasks: any[];
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function GanttView({ event, tasks, onEditTask, onDeleteTask }: GanttViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(100);

  const ganttData = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.start_date && t.due_date);
    
    if (tasksWithDates.length === 0) return { tasks: [], minDate: new Date(), maxDate: new Date(), totalDays: 0, categories: {} };

    const dates = tasksWithDates.flatMap(t => [new Date(t.start_date), new Date(t.due_date)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Group by category
    const categories: Record<string, any[]> = {};
    
    tasksWithDates.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      
      const start = new Date(task.start_date);
      const end = new Date(task.due_date);
      const startOffset = Math.floor((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      categories[category].push({
        ...task,
        startOffset,
        duration,
        widthPercent: (duration / totalDays) * 100,
        leftPercent: (startOffset / totalDays) * 100,
      });
    });

    // Initialize all categories as expanded
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(categories).forEach(cat => {
      initialExpanded[cat] = true;
    });
    setExpandedCategories(prev => ({ ...initialExpanded, ...prev }));

    return { tasks: tasksWithDates, minDate, maxDate, totalDays, categories };
  }, [tasks]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (Object.keys(ganttData.categories).length === 0) {
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

  // Generate month markers
  const months: { label: string; position: number }[] = [];
  let currentDate = new Date(ganttData.minDate);
  while (currentDate <= ganttData.maxDate) {
    const daysFromStart = differenceInDays(currentDate, ganttData.minDate);
    const position = (daysFromStart / ganttData.totalDays) * 100;
    months.push({
      label: format(currentDate, 'MMM yyyy'),
      position
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Project Timeline</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(ganttData.minDate, 'MMM dd, yyyy')} - {format(ganttData.maxDate, 'MMM dd, yyyy')} ({ganttData.totalDays} days)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            disabled={zoomLevel <= 50}
          >
            <FiZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">{zoomLevel}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
            disabled={zoomLevel >= 200}
          >
            <FiZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6 overflow-x-auto">
        <div style={{ width: `${zoomLevel}%`, minWidth: '100%' }}>
          {/* Timeline Header */}
          <div className="mb-6 relative">
            <div className="h-12 bg-muted/30 rounded-lg relative overflow-hidden">
            {months.map((month, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0 flex items-center px-3 text-xs font-medium text-muted-foreground border-l border-border"
                style={{ left: `${month.position}%` }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>

          {/* Tasks by Category */}
          <div className="space-y-6">
          {Object.entries(ganttData.categories).map(([category, categoryTasks]) => (
            <Collapsible
              key={category}
              open={expandedCategories[category]}
              onOpenChange={() => toggleCategory(category)}
            >
              <div className="space-y-3">
                <CollapsibleTrigger className="w-full group">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    {expandedCategories[category] ? (
                      <FiChevronDown className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <FiChevronRight className="h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="font-bold text-lg">{category}</span>
                    <Badge variant="outline" className="ml-2">{categoryTasks.length}</Badge>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="space-y-2 pl-8">
                    {categoryTasks.map((task: any) => (
                      <div key={task.id} className="group">
                        <div className="flex items-center gap-3 mb-1">
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
                              <span className="text-xs text-muted-foreground">
                                {task.duration} day{task.duration !== 1 ? 's' : ''}
                              </span>
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

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
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
                          <div className="text-xs text-muted-foreground ml-[200px] mb-2 line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
          </div>
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
