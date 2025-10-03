import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiPlus, FiRefreshCw, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from '@/components/ThemeSelector';
import { TimelineSettingsDialog } from '@/components/timeline/TimelineSettingsDialog';
import { TimelineEventDialog } from '@/components/timeline/TimelineEventDialog';
import { supabase } from '@/lib/supabase-typed';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useBalloons } from '@/hooks/useBalloons';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_time: string;
  duration_minutes?: number;
}

export default function EventTimeline() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { spendBalloons } = useBalloons();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [includePrep, setIncludePrep] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'hourly' | 'daily'>('hourly');
  const [dailyTimeline, setDailyTimeline] = useState<TimelineEvent[]>([]);
  const [hourlyTimeline, setHourlyTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    fetchEventAndTimeline();
  }, [eventId]);

  useEffect(() => {
    // Update displayed events when view mode changes
    setEvents(viewMode === 'daily' ? dailyTimeline : hourlyTimeline);
  }, [viewMode, dailyTimeline, hourlyTimeline]);

  const fetchEventAndTimeline = async () => {
    if (!eventId) return;
    
    try {
      const [eventRes, timelineRes] = await Promise.all([
        (supabase as any).from('events').select('*').eq('id', eventId).single(),
        (supabase as any).from('timeline_events').select('*').eq('event_id', eventId).order('event_time', { ascending: true })
      ]);

      if (eventRes.error) throw eventRes.error;
      if (timelineRes.error) throw timelineRes.error;

      setEvent(eventRes.data);
      
      // Separate daily and hourly timelines based on event_type prefix
      const allEvents = timelineRes.data || [];
      const daily = allEvents.filter((e: TimelineEvent) => e.event_type?.startsWith('daily_'));
      const hourly = allEvents.filter((e: TimelineEvent) => !e.event_type?.startsWith('daily_'));
      
      setDailyTimeline(daily);
      setHourlyTimeline(hourly);
      setEvents(viewMode === 'daily' ? daily : hourly);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load timeline",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimeline = async () => {
    if (!event) return;

    // Check and spend balloons (30 balloons for timeline generation)
    const canProceed = await spendBalloons(30, 'Timeline Generation');
    if (!canProceed) return;

    setGenerating(true);
    toast({
      title: "Generating timeline...",
      description: "AI is creating your event timeline",
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-timeline', {
        body: { eventData: event, includePrep }
      });

      if (error) throw error;

      // Delete existing timeline events
      await (supabase as any).from('timeline_events').delete().eq('event_id', eventId);

      // Insert both daily and hourly timeline events
      if (data.dailyTimeline && data.dailyTimeline.length > 0) {
        await (supabase as any).from('timeline_events').insert(
          data.dailyTimeline.map((te: any) => ({
            event_id: eventId,
            title: te.title,
            event_type: 'daily_' + (te.event_type || 'main'),
            event_time: te.event_time,
            duration_minutes: te.duration_minutes,
            description: te.description,
          }))
        );
      }

      if (data.hourlyTimeline && data.hourlyTimeline.length > 0) {
        await (supabase as any).from('timeline_events').insert(
          data.hourlyTimeline.map((te: any) => ({
            event_id: eventId,
            title: te.title,
            event_type: te.event_type,
            event_time: te.event_time,
            duration_minutes: te.duration_minutes,
            description: te.description,
          }))
        );
      }

      await fetchEventAndTimeline();
      
      toast({
        title: "Timeline generated!",
        description: "Your event timeline has been created",
      });
    } catch (error) {
      console.error('Error generating timeline:', error);
      toast({
        title: "Error",
        description: "Failed to generate timeline",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEvent = async (eventData: Omit<TimelineEvent, 'id'>) => {
    try {
      if (editingEvent) {
        const { error } = await (supabase as any)
          .from('timeline_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        
        toast({
          title: "Event updated",
          description: "Timeline event has been updated",
        });
      } else {
        const { error } = await (supabase as any)
          .from('timeline_events')
          .insert([{ ...eventData, event_id: eventId }]);

        if (error) throw error;
        
        toast({
          title: "Event added",
          description: "Timeline event has been added",
        });
      }

      await fetchEventAndTimeline();
      setEditingEvent(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('timeline_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchEventAndTimeline();
      
      toast({
        title: "Event deleted",
        description: "Timeline event has been removed",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'setup': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'main': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'cleanup': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'preparation': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
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
            <h1 className="text-2xl font-bold text-gradient">Timeline</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <p className="text-muted-foreground">Complete event schedule</p>
          <div className="flex gap-2">
            <TimelineSettingsDialog
              includePrep={includePrep}
              onTogglePrep={setIncludePrep}
              onRegenerate={handleGenerateTimeline}
              loading={generating}
            />
            <Button size="sm" onClick={handleGenerateTimeline} disabled={generating}>
              <FiRefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'Regenerate Timeline'}
            </Button>
            <Button size="sm" onClick={() => { setEditingEvent(undefined); setDialogOpen(true); }}>
              <FiPlus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'hourly' | 'daily')} className="mb-6">
          <TabsList>
            <TabsTrigger value="hourly">
              <FiClock className="h-4 w-4 mr-2" />
              Hourly View
            </TabsTrigger>
            <TabsTrigger value="daily">
              <FiCalendar className="h-4 w-4 mr-2" />
              Daily View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FiClock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No timeline events yet</p>
              <Button onClick={handleGenerateTimeline} disabled={generating}>
                <FiRefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                Generate Timeline
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="relative pl-16">
                  <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-primary border-4 border-background" />
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <FiClock className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.event_time), 'PPp')}
                              {event.duration_minutes && ` • ${event.duration_minutes} min`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getEventColor(event.event_type)}>
                            {event.event_type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingEvent(event); setDialogOpen(true); }}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {event.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        <TimelineEventDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingEvent(undefined); }}
          onSave={handleSaveEvent}
          event={editingEvent}
          eventDate={event?.event_date || new Date().toISOString().split('T')[0]}
        />
      </div>
    </div>
  );
}
