import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp, Settings } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DashboardViewProps {
  event: any;
  tasks: any[];
}

export function DashboardView({ event, tasks }: DashboardViewProps) {
  const [playTicTacToe, setPlayTicTacToe] = useState(
    localStorage.getItem('ticTacToe_neverPlayAgain') !== 'true'
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  useEffect(() => {
    setPlayTicTacToe(localStorage.getItem('ticTacToe_neverPlayAgain') !== 'true');
  }, []);
  
  const handlePlayTicTacToeToggle = (checked: boolean) => {
    if (checked) {
      localStorage.removeItem('ticTacToe_neverPlayAgain');
    } else {
      localStorage.setItem('ticTacToe_neverPlayAgain', 'true');
    }
    setPlayTicTacToe(checked);
  };
  
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  const upcomingTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    const daysUntilDue = differenceInDays(new Date(t.due_date), new Date());
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).length;

  const eventDate = event.event_date ? new Date(event.event_date) : null;
  const now = new Date();
  
  let timeUntilEvent = '';
  if (eventDate) {
    const days = differenceInDays(eventDate, now);
    const hours = differenceInHours(eventDate, now) % 24;
    const minutes = differenceInMinutes(eventDate, now) % 60;
    
    if (days > 0) {
      timeUntilEvent = `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      timeUntilEvent = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      timeUntilEvent = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Dashboard</h3>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dashboard Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="play-tictactoe">Play Tic-Tac-Toe when loading</Label>
                <Switch
                  id="play-tictactoe"
                  checked={playTicTacToe}
                  onCheckedChange={handlePlayTicTacToeToggle}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Show the Tic-Tac-Toe game while generating AI content
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Event Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventDate ? format(eventDate, 'MMM dd, yyyy') : 'Not set'}
            </div>
            {event.event_time && (
              <p className="text-sm text-muted-foreground mt-1">
                at {event.event_time}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Time Until Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeUntilEvent || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {eventDate && differenceInDays(eventDate, now) < 0 ? 'Event has passed' : 'Countdown'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTasks} / {totalTasks}
            </div>
            <Progress value={progress} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {progress.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highPriorityTasks}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              High priority pending
            </p>
            <p className="text-sm text-muted-foreground">
              {upcomingTasks} tasks due this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Task Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completed</span>
              <div className="flex items-center gap-2">
                <Progress value={(completedTasks / totalTasks) * 100} className="w-32" />
                <Badge variant="outline">{completedTasks}</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">In Progress</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(tasks.filter(t => t.status === 'in-progress').length / totalTasks) * 100} 
                  className="w-32" 
                />
                <Badge variant="outline">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">To Do</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(tasks.filter(t => t.status === 'todo').length / totalTasks) * 100} 
                  className="w-32" 
                />
                <Badge variant="outline">
                  {tasks.filter(t => t.status === 'todo').length}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-2 p-2 rounded hover:bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {task.category}
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Create some to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks
                .filter(t => t.due_date && t.status !== 'completed')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .slice(0, 5)
                .map((task) => {
                  const daysUntil = differenceInDays(new Date(task.due_date), now);
                  return (
                    <div key={task.id} className="flex items-start justify-between gap-2 p-2 rounded hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge 
                        variant={daysUntil <= 3 ? 'destructive' : daysUntil <= 7 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {daysUntil} days
                      </Badge>
                    </div>
                  );
                })}
              {tasks.filter(t => t.due_date && t.status !== 'completed').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
