import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface CalendarViewProps {
  event: any;
  tasks: any[];
  onEditTask?: (task: any) => void;
}

export function CalendarView({ event, tasks, onEditTask }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(event.event_date));

  const tasksForSelectedDate = tasks.filter(task => {
    if (!selectedDate) return false;
    const taskDate = task.due_date ? new Date(task.due_date) : null;
    if (!taskDate) return false;
    return taskDate.toDateString() === selectedDate.toDateString();
  });

  const taskDates = tasks
    .filter(t => t.due_date)
    .map(t => new Date(t.due_date));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border w-full"
          modifiers={{
            eventDay: new Date(event.event_date),
            taskDue: taskDates,
          }}
          modifiersStyles={{
            eventDay: { 
              fontWeight: 'bold', 
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            },
            taskDue: {
              textDecoration: 'underline',
            },
          }}
        />
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-primary"></div>
            <span className="text-muted-foreground">Event Day</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded border-b-2 border-foreground"></div>
            <span className="text-muted-foreground">Task Due Date</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">
          {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
        </h3>
        
        {tasksForSelectedDate.length > 0 ? (
          <div className="space-y-3">
            {tasksForSelectedDate.map((task) => (
              <Card key={task.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">{task.category}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No tasks scheduled for this date</p>
          </Card>
        )}

        <Card className="p-4 mt-6 bg-muted/50">
          <h4 className="font-semibold mb-2">Event Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{event.event_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{new Date(event.event_date).toLocaleDateString()}</span>
            </div>
            {event.location_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{event.location_name}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
