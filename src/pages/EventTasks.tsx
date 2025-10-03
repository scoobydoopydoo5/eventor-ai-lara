import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiCheckCircle, FiCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { format } from 'date-fns';
import { IceCream } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

export default function EventTasks() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { tasks, loading, updateTask } = useTasks(eventId || '');
  const [view, setView] = useState('list');
  const kawaiiColor = useKawaiiTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    await updateTask(taskId, { status: newStatus });
  };

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  return (
    <div className="min-h-screen bg-background">
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
            <h1 className="text-2xl font-bold text-gradient">Tasks</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={view} onValueChange={setView} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <Button>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          <TabsContent value="list" className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <IceCream size={120} mood="sad" color={kawaiiColor.kawaiiColor} />
                  </div>
                  <p className="text-muted-foreground">No tasks yet</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                    >
                      {task.status === 'completed' ? (
                        <FiCheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <FiCircle className="h-5 w-5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {format(new Date(task.due_date), 'PPP')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {task.category && (
                        <Badge variant="outline" className="capitalize">
                          {task.category}
                        </Badge>
                      )}
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="kanban">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <Card key={status}>
                  <CardHeader>
                    <CardTitle className="text-base capitalize flex items-center justify-between">
                      {status.replace('-', ' ')}
                      <Badge variant="secondary">{statusTasks.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {statusTasks.map((task) => (
                      <Card key={task.id} className="p-3">
                        <h5 className="font-medium text-sm mb-2">{task.title}</h5>
                        <div className="flex gap-2">
                          {task.category && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {task.category}
                            </Badge>
                          )}
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardContent className="py-6">
                <div className="space-y-4">
                  {tasks
                    .filter(t => t.start_date || t.due_date)
                    .sort((a, b) => {
                      const dateA = new Date(a.start_date || a.due_date || '');
                      const dateB = new Date(b.start_date || b.due_date || '');
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((task) => (
                      <div key={task.id} className="flex gap-4 items-start">
                        <div className="text-sm text-muted-foreground min-w-24">
                          {task.start_date && format(new Date(task.start_date), 'MMM dd')}
                          {task.due_date && ` - ${format(new Date(task.due_date), 'MMM dd')}`}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
