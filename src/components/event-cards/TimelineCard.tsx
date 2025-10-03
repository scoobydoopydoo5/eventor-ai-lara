import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FiClock as Clock, FiCalendar as Calendar } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';

const timelineEvents = [
  {
    day: '2 Days Before',
    events: [
      { time: '10:00 AM', title: 'Venue setup begins', type: 'setup' },
      { time: '2:00 PM', title: 'Decoration installation', type: 'setup' },
      { time: '5:00 PM', title: 'Final venue walkthrough', type: 'check' },
    ],
  },
  {
    day: '1 Day Before',
    events: [
      { time: '9:00 AM', title: 'Catering prep', type: 'food' },
      { time: '12:00 PM', title: 'Equipment delivery', type: 'delivery' },
      { time: '3:00 PM', title: 'Sound check', type: 'tech' },
      { time: '6:00 PM', title: 'Final confirmations', type: 'check' },
    ],
  },
  {
    day: 'Event Day',
    events: [
      { time: '12:00 PM', title: 'Staff arrives', type: 'setup' },
      { time: '1:00 PM', title: 'Final setup', type: 'setup' },
      { time: '2:00 PM', title: 'Event starts', type: 'event', highlighted: true },
      { time: '3:00 PM', title: 'Cake cutting', type: 'event' },
      { time: '5:00 PM', title: 'Entertainment', type: 'event' },
      { time: '6:00 PM', title: 'Event ends', type: 'event', highlighted: true },
      { time: '7:00 PM', title: 'Cleanup', type: 'cleanup' },
    ],
  },
];

const getEventColor = (type: string) => {
  switch (type) {
    case 'setup':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
    case 'food':
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
    case 'delivery':
      return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
    case 'tech':
      return 'bg-green-500/20 text-green-700 dark:text-green-300';
    case 'event':
      return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
    case 'check':
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
    case 'cleanup':
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    default:
      return 'bg-muted';
  }
};

export function TimelineCard() {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="day" className="gap-2">
              <Calendar className="h-4 w-4" />
              Day View
            </TabsTrigger>
            <TabsTrigger value="hour" className="gap-2">
              <Clock className="h-4 w-4" />
              Hour View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="mt-6 space-y-6">
            {timelineEvents.map((day) => (
              <div key={day.day}>
                <h4 className="font-semibold mb-3 text-primary">{day.day}</h4>
                <div className="space-y-2">
                  {day.events.map((event, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-smooth ${
                        event.highlighted
                          ? 'border-primary bg-primary/10 shadow-elegant'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center justify-center min-w-[80px] text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${event.highlighted ? 'text-primary' : ''}`}>
                          {event.title}
                        </p>
                      </div>
                      <Badge className={getEventColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="hour" className="mt-6">
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border ml-10" />
              <div className="space-y-6">
                {timelineEvents[2].events.map((event, idx) => (
                  <div key={idx} className="relative pl-14">
                    <div className="absolute left-8 top-2 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="text-sm text-muted-foreground mb-1">{event.time}</div>
                    <div
                      className={`p-3 rounded-lg border ${
                        event.highlighted
                          ? 'border-primary bg-primary/10 shadow-elegant'
                          : 'border-border bg-card'
                      }`}
                    >
                      <p className={`font-medium ${event.highlighted ? 'text-primary' : ''}`}>
                        {event.title}
                      </p>
                      <Badge className={`${getEventColor(event.type)} mt-2`}>
                        {event.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
