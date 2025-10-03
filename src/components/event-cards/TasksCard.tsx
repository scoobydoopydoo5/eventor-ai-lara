import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FiList as ListTodo, FiColumns as Columns, FiCalendar as Calendar, FiPlus as Plus } from 'react-icons/fi';

const mockTasks = [
  { id: 1, title: 'Book venue', status: 'done', priority: 'high', category: 'Venue' },
  { id: 2, title: 'Send invitations', status: 'in-progress', priority: 'high', category: 'Guests' },
  { id: 3, title: 'Order cake', status: 'todo', priority: 'medium', category: 'Food' },
  { id: 4, title: 'Arrange decorations', status: 'todo', priority: 'medium', category: 'Decor' },
  { id: 5, title: 'Hire photographer', status: 'todo', priority: 'low', category: 'Entertainment' },
];

export function TasksCard() {
  const [view, setView] = useState<'list' | 'kanban' | 'timeline'>('list');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            Tasks
          </CardTitle>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="list" className="gap-2">
              <ListTodo className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <Columns className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-3">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-smooth"
              >
                <Checkbox checked={task.status === 'done'} />
                <div className="flex-1">
                  <p className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.category}</p>
                </div>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="kanban">
            <div className="grid md:grid-cols-3 gap-4">
              {['To Do', 'In Progress', 'Done'].map((column) => (
                <div key={column} className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">{column}</h4>
                  <div className="space-y-2 min-h-[200px] p-2 rounded-lg border border-dashed border-border">
                    {mockTasks
                      .filter((t) => {
                        if (column === 'To Do') return t.status === 'todo';
                        if (column === 'In Progress') return t.status === 'in-progress';
                        return t.status === 'done';
                      })
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border border-border bg-card cursor-move hover:shadow-md transition-smooth"
                        >
                          <p className="font-medium text-sm">{task.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {task.category}
                            </Badge>
                            <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-4">
              <div className="relative pl-8 border-l-2 border-primary pb-4">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">2 weeks before</p>
                  <p className="font-medium">Book venue, Send invitations</p>
                </div>
              </div>
              <div className="relative pl-8 border-l-2 border-primary pb-4">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">1 week before</p>
                  <p className="font-medium">Order cake, Arrange decorations</p>
                </div>
              </div>
              <div className="relative pl-8 border-l-2 border-muted">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">3 days before</p>
                  <p className="font-medium">Hire photographer, Final preparations</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
