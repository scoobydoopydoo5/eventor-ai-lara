import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FiChevronDown, FiChevronRight, FiSettings } from 'react-icons/fi';
import { PlannerSettings } from '@/hooks/usePlannerSettings';
import { TasksSettingsModal } from './TasksSettingsModal';
import { useTaskSettings } from '@/hooks/useTaskSettings';
import { CollapsibleTask } from './CollapsibleTask';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TasksViewProps {
  event: any;
  tasks: any[];
  onTasksChange: () => void;
  onEditTask?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  settings?: PlannerSettings | null;
}

export function TasksView({ event, tasks, onTasksChange, onEditTask, onDeleteTask, settings }: TasksViewProps) {
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    todo: true,
    'in-progress': true,
    completed: true,
  });
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings: taskSettings } = useTaskSettings(event.id);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      
      const { error } = await (supabase as any)
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Immediately refetch to ensure UI is in sync
      await onTasksChange();
      
      toast({
        title: "Success",
        description: `Task marked as ${newStatus === 'completed' ? 'completed' : 'incomplete'}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    
    if (!activeTask || !overTask) return;

    if (activeTask.status === overTask.status) {
      const statusTasks = tasks.filter(t => t.status === activeTask.status).sort((a, b) => (a.position || 0) - (b.position || 0));
      const oldIndex = statusTasks.findIndex(t => t.id === active.id);
      const newIndex = statusTasks.findIndex(t => t.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(statusTasks, oldIndex, newIndex);
        
        try {
          for (const [index, task] of reordered.entries()) {
            await (supabase as any)
              .from('tasks')
              .update({ position: index })
              .eq('id', task.id);
          }
          
          await onTasksChange();
          toast({ title: 'Success', description: 'Task order updated' });
        } catch (error) {
          console.error('Error:', error);
          toast({ title: 'Error', description: 'Failed to reorder', variant: 'destructive' });
        }
      }
    }
  };

  const handleClearAllTasks = async () => {
    try {
      const { error } = await (supabase as any)
        .from('tasks')
        .delete()
        .eq('event_id', event.id);

      if (error) throw error;

      await onTasksChange();
      toast({
        title: "Success",
        description: "All tasks cleared",
      });
    } catch (error) {
      console.error('Error clearing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to clear tasks",
        variant: "destructive",
      });
    } finally {
      setClearDialogOpen(false);
    }
  };

  const filteredTasks = settings?.show_completed_tasks 
    ? tasks 
    : tasks.filter(t => t.status !== 'completed');

  const groupedTasks: Record<string, any[]> = {
    todo: [],
    'in-progress': [],
    completed: [],
  };

  filteredTasks.forEach(task => {
    const status = task.status;
    // Always show completed tasks if keep_completed_in_list is true (default)
    if (status === 'completed') {
      // Default to true if not set
      const shouldKeep = taskSettings?.keep_completed_in_list !== false;
      if (shouldKeep) {
        groupedTasks.completed.push(task);
      }
    } else {
      if (groupedTasks[status]) {
        groupedTasks[status].push(task);
      } else {
        groupedTasks.todo.push(task);
      }
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const renderTask = (task: any) => (
    <CollapsibleTask
      key={task.id}
      task={task}
      isCompleted={task.isCompleted}
      onToggle={() => handleToggleTask(task.id, task.status)}
      onEdit={onEditTask ? () => onEditTask(task) : undefined}
      onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
      getPriorityColor={getPriorityColor}
    />
  );

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Tasks for {event.name}</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length} completed
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSettingsOpen(true)}
          >
            <FiSettings className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={tasks.length === 0}
          >
            Clear All Tasks
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => {
            if (status === 'completed' && settings?.remove_completed_from_todo && statusTasks.length === 0) {
              return null;
            }

            return (
              <Collapsible
                key={status}
                open={openSections[status]}
                onOpenChange={() => toggleSection(status)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize flex items-center gap-2">
                      {openSections[status] ? (
                        <FiChevronDown className="h-4 w-4" />
                      ) : (
                        <FiChevronRight className="h-4 w-4" />
                      )}
                      {status.replace('-', ' ')}
                      <Badge variant="outline">{statusTasks.length}</Badge>
                    </h4>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <SortableContext items={statusTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {statusTasks.length > 0 ? (
                        statusTasks.map(renderTask)
                      ) : (
                        <Card className="p-6 text-center">
                          <p className="text-sm text-muted-foreground">No tasks in this category</p>
                        </Card>
                      )}
                    </div>
                  </SortableContext>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
      
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all tasks for this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllTasks} className="bg-destructive text-destructive-foreground">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <DragOverlay>
      {activeTask ? (
        <Card className="p-3 bg-card/95 shadow-2xl rotate-2 border-2 border-primary">
          <div className="font-semibold">{activeTask.title}</div>
          <Badge variant={getPriorityColor(activeTask.priority)} className="text-xs mt-2">
            {activeTask.priority}
          </Badge>
        </Card>
      ) : null}
    </DragOverlay>

    <TasksSettingsModal
      open={settingsOpen}
      onOpenChange={setSettingsOpen}
      eventId={event.id}
    />
  </DndContext>
  );
}
