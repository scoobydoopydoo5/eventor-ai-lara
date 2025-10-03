import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { 
  ArrowLeft, 
  Shirt, 
  CheckSquare, 
  Gift, 
  DollarSign,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function AttendeePlan() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const fetchData = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: planData, error: planError } = await supabase
        .from('attendee_plans')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (planError) throw planError;
      setPlan(planData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendee plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!event || !plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No attendee plan found</p>
          <Button onClick={() => navigate(`/attendee-create/${eventId}`)}>
            Create Plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/event/${eventId}/guests`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Attendee Plan</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Event Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge>{event.event_type}</Badge>
                  {event.theme_preferences && (
                    <Badge variant="secondary">{event.theme_preferences}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.event_date), 'PPP')}
                </p>
              </div>
            </div>
            {event.event_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">{event.event_time}</p>
                </div>
              </div>
            )}
            {event.location_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location_name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Outfit Suggestions */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/attendee/${eventId}/outfits`)}>
            <CardHeader>
              <Shirt className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Outfit Suggestions</CardTitle>
              <CardDescription>What to wear to the event</CardDescription>
            </CardHeader>
          </Card>

          {/* Gift Ideas */}
          <Card className="cursor-pointer hover:shadow-lg transition-smooth" onClick={() => navigate(`/attendee/${eventId}/gifts`)}>
            <CardHeader>
              <Gift className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Gift Ideas</CardTitle>
              <CardDescription>Suggestions for gifts to bring</CardDescription>
            </CardHeader>
          </Card>

          {/* Guest Guide */}
          <Card className="cursor-pointer hover:shadow-lg transition-smooth" onClick={() => navigate(`/attendee/${eventId}/guide`)}>
            <CardHeader>
              <CheckSquare className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Guest Guide & Flow</CardTitle>
              <CardDescription>Step-by-step guide for the event</CardDescription>
            </CardHeader>
          </Card>

          {/* Etiquette Tips */}
          <Card className="cursor-pointer hover:shadow-lg transition-smooth" onClick={() => navigate(`/attendee/${eventId}/etiquette`)}>
            <CardHeader>
              <CheckSquare className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Etiquette Tips</CardTitle>
              <CardDescription>Etiquette and behavior guidelines</CardDescription>
            </CardHeader>
          </Card>

          {/* Budget Breakdown */}
          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Budget Breakdown</CardTitle>
              <CardDescription>Estimated costs for attending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.budget_breakdown && Object.keys(plan.budget_breakdown).length > 0 ? (
                  <>
                    {Object.entries(plan.budget_breakdown).map(([category, amount]: [string, any]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                        <span className="font-medium">${Number(amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span>
                        $
                        {(Object.values(plan.budget_breakdown)
                          .reduce((sum: number, val: any) => sum + Number(val || 0), 0) as number)
                          .toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No budget breakdown available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
