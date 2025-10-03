import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Calendar, DollarSign, Users, CheckSquare, MapPin, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function EventFullPlan() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventAndPlan();
    }
  }, [eventId]);

  const fetchEventAndPlan = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Try to get stored plan from localStorage
      const stored = localStorage.getItem(`full-plan-${eventId}`);
      if (stored) {
        setPlanData(JSON.parse(stored));
      } else if (eventData) {
        // Generate plan if not exists
        await generatePlan(eventData);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({ title: 'Error', description: 'Failed to load event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async (eventData: any) => {
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-plan', {
        body: { eventData }
      });

      if (error) throw error;
      
      setPlanData(data);
      localStorage.setItem(`full-plan-${eventId}`, JSON.stringify(data));
      toast({ title: 'Success', description: 'Plan generated successfully' });
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate plan', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
              onClick={() => navigate(`/event/${eventId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Full Event Plan</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 animate-fade-in flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Complete Event Overview</h2>
            <p className="text-muted-foreground">
              AI-generated comprehensive plan for your event
            </p>
          </div>
          <Button onClick={() => event && generatePlan(event)} disabled={regenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {regenerating ? 'Regenerating...' : 'Regenerate Plan'}
          </Button>
        </div>

        {!planData && !regenerating ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No plan generated yet. Generate your comprehensive event plan with AI.</p>
              <Button onClick={() => event && generatePlan(event)} disabled={regenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Plan
              </Button>
            </CardContent>
          </Card>
        ) : regenerating ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Event Overview */}
            {planData?.event && (
              <Card className="border-l-4 border-l-primary shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calendar className="h-6 w-6 text-primary" />
                    <span className="font-bold">Event Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-primary">{planData.event.name}</h3>
                    <p className="text-base leading-relaxed mb-4 text-foreground">{planData.event.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        <span className="font-semibold">Format:</span> {planData.event.event_format}
                      </Badge>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        <span className="font-semibold">Venue:</span> {planData.event.venue_type}
                      </Badge>
                    </div>
                  </div>
                  {planData.event.venue_recommendation && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Venue Recommendation
                      </h4>
                      <p className="text-base leading-relaxed bg-muted p-4 rounded-lg">{planData.event.venue_recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tasks Summary */}
            {planData?.tasks && planData.tasks.length > 0 && (
              <Card className="border-l-4 border-l-blue-500 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CheckSquare className="h-6 w-6 text-blue-500" />
                    <span className="font-bold">Tasks & Requirements</span>
                    <Badge variant="outline" className="ml-2">{planData.tasks.length} tasks</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {planData.tasks.map((task: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-blue-400 pl-4 py-3 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 rounded-r-lg hover:from-blue-100/50 dark:hover:from-blue-900/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-2">{task.title}</h4>
                            <p className="text-base mb-3 leading-relaxed text-muted-foreground">{task.description}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-background">
                                <span className="font-semibold">Category:</span> {task.category}
                              </Badge>
                              <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                                <span className="font-semibold">Priority:</span> {task.priority.toUpperCase()}
                              </Badge>
                              {task.start_date && (
                                <Badge variant="outline" className="bg-background">
                                  <span className="font-semibold">Start:</span> {new Date(task.start_date).toLocaleDateString()}
                                </Badge>
                              )}
                              {task.due_date && (
                                <Badge variant="outline" className="bg-background">
                                  <span className="font-semibold">Due:</span> {new Date(task.due_date).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget Estimate */}
            {planData?.budget && planData.budget.length > 0 && (
              <Card className="border-l-4 border-l-green-500 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    <span className="font-bold">Budget Estimate</span>
                    <Badge variant="outline" className="ml-2">{planData.budget.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {planData.budget.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start border-b pb-3 last:border-0 hover:bg-muted/30 p-3 rounded-lg transition-colors">
                        <div className="flex-1">
                          <p className="font-bold text-lg">{item.item_name}</p>
                          <p className="text-base text-muted-foreground mt-1">{item.notes}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="bg-background">
                              {item.category}
                            </Badge>
                            {item.quantity > 1 && (
                              <Badge variant="secondary">
                                Qty: {item.quantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-xl text-green-600 dark:text-green-400">
                            ${(item.estimated_cost * (item.quantity || 1)).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-muted-foreground">${item.estimated_cost} each</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t-2 border-primary mt-4 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl">Total Estimated Cost:</span>
                        <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                          ${planData.budget.reduce((sum: number, item: any) => sum + (item.estimated_cost * (item.quantity || 1)), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {planData?.timeline && planData.timeline.length > 0 && (
              <Card className="border-l-4 border-l-purple-500 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calendar className="h-6 w-6 text-purple-500" />
                    <span className="font-bold">Event Timeline</span>
                    <Badge variant="outline" className="ml-2">{planData.timeline.length} events</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {planData.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 border-l-4 border-purple-400 pl-4 py-3 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 rounded-r-lg hover:from-purple-100/50 dark:hover:from-purple-900/20 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="bg-background">
                              {item.event_type}
                            </Badge>
                            <span className="text-sm font-semibold text-muted-foreground">
                              📅 {new Date(item.event_time).toLocaleDateString()} at {new Date(item.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {item.duration_minutes && (
                              <Badge variant="secondary">
                                ⏱️ {item.duration_minutes} min
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                          <p className="text-base leading-relaxed text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Helpful Site Links */}
            <Card className="border-l-4 border-l-orange-500 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <LinkIcon className="h-6 w-6 text-orange-500" />
                  <span className="font-bold">Helpful Site Links</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-base mb-6 leading-relaxed text-muted-foreground">
                  <strong>Explore these powerful tools</strong> to manage every aspect of your event seamlessly:
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all" 
                    onClick={() => navigate(`/event/${eventId}/tasks`)}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                        <span className="font-bold">Manage Tasks</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Track and organize all event tasks with deadlines and priorities</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all" 
                    onClick={() => navigate(`/event/${eventId}/budget`)}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <span className="font-bold">Budget Tracker</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Monitor expenses, track spending, and stay within budget</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all" 
                    onClick={() => navigate(`/event/${eventId}/guests`)}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-purple-500" />
                        <span className="font-bold">Guest Management</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Track RSVPs, manage attendee list, and organize guests</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all" 
                    onClick={() => navigate(`/event/${eventId}/invites`)}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-pink-500" />
                        <span className="font-bold">Invitations</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Send personalized invites and track responses</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all" 
                    onClick={() => navigate(`/event/${eventId}/timeline`)}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-indigo-500" />
                        <span className="font-bold">Timeline View</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Visualize complete event schedule and timing</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary transition-all" 
                    onClick={() => navigate(`/event/${eventId}/manage-tickets`)}
                  >
                    <div className="text-left w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-orange-500" />
                        <span className="font-bold">Ticket Management</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Configure tickets, pricing, and attendee check-in</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}