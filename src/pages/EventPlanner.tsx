import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiCalendar, FiList, FiBarChart2, FiColumns, FiMaximize2, FiSettings, FiPlus, FiMinimize2, FiRefreshCw } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from '@/components/ThemeSelector';
import { AuthButton } from '@/components/AuthButton';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { useTasks } from '@/hooks/useTasks';
import { usePlannerSettings } from '@/hooks/usePlannerSettings';
import { useBalloons } from '@/hooks/useBalloons';
import { TimerView } from '@/components/planner/TimerView';
import { CalendarView } from '@/components/planner/CalendarView';
import { TasksView } from '@/components/planner/TasksView';
import { GanttView } from '@/components/GanttView';
import { KanbanView } from '@/components/planner/KanbanView';
import { TaskDialog } from '@/components/planner/TaskDialog';
import { SettingsDialog } from '@/components/planner/SettingsDialog';
import { DashboardView } from '@/components/planner/DashboardView';
import { NotesView } from '@/components/planner/NotesView';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { TimerSettingsDialog } from '@/components/planner/TimerSettingsDialog';
import { PlannerSettingsDialog } from '@/components/planner/PlannerSettingsDialog';
import { TicTacToeModal } from '@/components/TicTacToeModal';
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

export default function EventPlanner() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { spendBalloons, balloons: balloonsAmount } = useBalloons();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [timerSettingsDialogOpen, setTimerSettingsDialogOpen] = useState(false);
  const [plannerSettingsDialogOpen, setPlannerSettingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, refetch } = useTasks(eventId || '');
  const { settings: plannerSettings, updateSettings: updatePlannerSettings } = usePlannerSettings(eventId || '');

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;

    try {
      const { data: eventData, error: eventError } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);
    } catch (error) {
      console.error('Error fetching event data:', error);
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAITasks = async () => {
    if (!event || generatingTasks) return;

    const canProceed = await spendBalloons(40, 'Generate AI Tasks');
    if (!canProceed) return;

    setGeneratingTasks(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-planner-tasks', {
        body: { event }
      });

      if (error) throw error;

      if (data?.tasks && Array.isArray(data.tasks)) {
        for (const taskData of data.tasks) {
          await createTask({
            title: taskData.title,
            description: taskData.description,
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            category: taskData.category,
            start_date: taskData.start_date,
            due_date: taskData.due_date,
            start_time: taskData.start_time,
            due_time: taskData.due_time,
            url: taskData.url,
            notes: taskData.notes,
            tags: taskData.tags || [],
            position: 0,
          });
        }

        toast({
          title: "Success",
          description: `Generated ${data.tasks.length} AI-powered tasks with real venue links!`,
        });
        
        await refetch();
      }
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI tasks",
        variant: "destructive",
      });
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTask(taskToDelete);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleSaveTask = async (taskData: any) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } else {
      await createTask({ ...taskData, position: tasks.length });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isLoading = loading || tasksLoading || generatingTasks;

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} min-h-screen bg-background`}>
      {!isFullscreen && (
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/event/${eventId}`)}
              >
                <FiArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gradient">eventor.ai</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Event Planning</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Coins className="h-4 w-4" />
                {balloonsAmount} Balloons
              </Badge>
              <span className="text-sm text-muted-foreground hidden md:block">Planner + Event Timer</span>
              <ThemeSelector />
              <AuthButton />
            </div>
          </div>
        </header>
      )}

      <div className={`${isFullscreen ? 'h-screen overflow-hidden' : 'container mx-auto px-4 py-8'}`}>
        {!isFullscreen && (
          <div className="mb-6 animate-fade-in flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-2">{event.name} Planner & Timer</h2>
              <p className="text-muted-foreground">
                Plan your event schedule and track time to {event.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateAITasks}
                disabled={generatingTasks}
                variant="outline"
                className="gap-2"
              >
                <FiRefreshCw className={`h-4 w-4 ${generatingTasks ? 'animate-spin' : ''}`} />
                {generatingTasks ? 'Generating...' : 'Generate AI Tasks'}
              </Button>
              <Button onClick={handleCreateTask} className="gap-2">
                <FiPlus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        )}

        <Card className={`p-0 overflow-hidden animate-slide-up ${isFullscreen ? 'h-full rounded-none border-0' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b h-14 bg-muted/30 shrink-0 overflow-x-auto">
              <TabsTrigger value="dashboard" className="gap-2">
                <FiBarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <FiList className="h-4 w-4" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <FiCalendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <FiColumns className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="gantt" className="gap-2">
                <FiBarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Gantt</span>
              </TabsTrigger>
              <TabsTrigger value="timer" className="gap-2">
                <FiClock className="h-4 w-4" />
                <span className="hidden sm:inline">Timer</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FiList className="h-4 w-4" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            <div className="relative flex-1 overflow-hidden">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
                </Button>
                {activeTab === 'timer' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setTimerSettingsDialogOpen(true)}
                  >
                    <FiSettings className="h-4 w-4" />
                  </Button>
                )}
                {activeTab === 'tasks' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setPlannerSettingsDialogOpen(true)}
                  >
                    <FiSettings className="h-4 w-4" />
                  </Button>
                )}
                {activeTab !== 'timer' && activeTab !== 'tasks' && activeTab !== 'notes' && activeTab !== 'calendar' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setSettingsDialogOpen(true)}
                  >
                    <FiSettings className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <TabsContent value="dashboard" className={`p-6 ${isFullscreen ? 'h-full overflow-auto' : 'min-h-[600px]'}`}>
                <DashboardView event={event} tasks={tasks} />
              </TabsContent>

              <TabsContent value="tasks" className={`p-6 ${isFullscreen ? 'h-full overflow-auto' : 'min-h-[600px]'}`}>
                <TasksView 
                  event={event} 
                  tasks={tasks} 
                  onTasksChange={refetch}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  settings={plannerSettings}
                />
              </TabsContent>

              <TabsContent value="calendar" className={`p-6 ${isFullscreen ? 'h-full overflow-auto' : 'min-h-[600px]'}`}>
                <CalendarView event={event} tasks={tasks} onEditTask={handleEditTask} />
              </TabsContent>

              <TabsContent value="kanban" className={`p-6 ${isFullscreen ? 'h-full overflow-y-auto' : 'min-h-[600px] overflow-y-auto'}`}>
                <KanbanView 
                  event={event} 
                  tasks={tasks} 
                  onTasksChange={refetch}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              </TabsContent>

              <TabsContent value="gantt" className={`p-6 ${isFullscreen ? 'h-full overflow-auto' : 'min-h-[600px]'}`}>
                <GanttView 
                  event={event} 
                  tasks={tasks}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              </TabsContent>

              <TabsContent value="timer" className={`p-6 ${isFullscreen ? 'h-full overflow-auto' : 'min-h-[600px]'}`}>
                <TimerView event={event} tasks={tasks} />
              </TabsContent>

              <TabsContent value="notes" className={`p-6 ${isFullscreen ? 'h-full overflow-auto' : 'min-h-[600px]'}`}>
                <NotesView event={event} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
        mode={editingTask ? 'edit' : 'create'}
      />

      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        settings={{ 
          viewMode: 'comfortable' as const,
          showCompletedTasks: true,
          autoRefresh: false,
          theme: 'system' as const
        }}
        onSettingsChange={() => {}}
      />

      <TimerSettingsDialog
        open={timerSettingsDialogOpen}
        onOpenChange={setTimerSettingsDialogOpen}
        event={event}
        onEventUpdate={fetchEventData}
      />

      <PlannerSettingsDialog
        open={plannerSettingsDialogOpen}
        onOpenChange={setPlannerSettingsDialogOpen}
        settings={plannerSettings}
        onSettingsUpdate={updatePlannerSettings}
      />

      <TicTacToeModal
        open={isLoading && (localStorage.getItem('play_tictactoe_loading') === 'true')}
        onClose={() => setGeneratingTasks(false)}
        title={generatingTasks ? 'Generating AI Tasks...' : 'Loading Planner...'}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
