import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiExternalLink, FiSend } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeSelector } from '@/components/ThemeSelector';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';
import { Planet } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

export default function EventFlights() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();
  const kawaiiColor = useKawaiiTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [residencyCountry, setResidencyCountry] = useState('');
  const [needsCountry, setNeedsCountry] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      setEvent(eventData);

      // Try to get residency country from user profile
      if (user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('residency_country')
          .eq('clerk_user_id', user.id)
          .maybeSingle();

        if (profileData && profileData.residency_country) {
          setResidencyCountry(profileData.residency_country);
          await fetchFlights(eventData, profileData.residency_country);
        } else {
          setNeedsCountry(true);
        }
      } else {
        setNeedsCountry(true);
      }
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlights = async (eventData?: any, country?: string) => {
    try {
      const { data: flightsData } = await supabase
        .from('event_flights')
        .select('*')
        .eq('event_id', eventId)
        .order('flight_date', { ascending: true });
      
      if (!flightsData || flightsData.length === 0) {
        await generateFlights(eventData || event, country || residencyCountry);
      } else {
        setFlights(flightsData);
        setNeedsCountry(false);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const generateFlights = async (eventData?: any, country?: string) => {
    if (!country) {
      toast({
        title: "Residency Country Required",
        description: "Please enter your residency country first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-flights', {
        body: { 
          event: eventData || event,
          residencyCountry: country
        }
      });

      if (error) throw error;

      const flightsToInsert = data.flights.map((flight: any) => ({
        ...flight,
        event_id: eventId
      }));

      const { data: inserted } = await supabase
        .from('event_flights')
        .insert(flightsToInsert)
        .select();

      if (inserted) {
        setFlights(inserted);
        setNeedsCountry(false);
        toast({
          title: "Success",
          description: "Flights found successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating flights:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to find flights",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (residencyCountry.trim()) {
      fetchFlights(event, residencyCountry);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin" />
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
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Flight Options</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {needsCountry ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Where are you traveling from?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <Planet size={120} mood="excited" color={kawaiiColor.kawaiiColor} />
              </div>
              <form onSubmit={handleSubmitCountry} className="space-y-4">
                <div>
                  <Label htmlFor="country">Residency Country</Label>
                  <Input
                    id="country"
                    value={residencyCountry}
                    onChange={(e) => setResidencyCountry(e.target.value)}
                    placeholder="e.g., United States"
                    required
                  />
                </div>
                <Button type="submit" disabled={generating} className="w-full">
                  {generating ? (
                    <><FiLoader className="h-4 w-4 mr-2 animate-spin" /> Finding Flights...</>
                  ) : (
                    "Find Flights"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-muted-foreground">
                Flight options from {residencyCountry} to {event?.country || event?.location_name}
              </p>
              <Button onClick={() => generateFlights(event, residencyCountry)} disabled={generating}>
                {generating ? (
                  <><FiLoader className="h-4 w-4 mr-2 animate-spin" /> Finding...</>
                ) : (
                  "Refresh Flights"
                )}
              </Button>
            </div>

            <div className="space-y-6">
              {['Two days before', 'One day before', 'Event day'].map((section, idx) => {
                const sectionFlights = flights.filter((f, index) => Math.floor(index / 2) === idx);
                if (sectionFlights.length === 0) return null;

                return (
                  <div key={section}>
                    <h3 className="text-lg font-semibold mb-3">{section}</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {sectionFlights.map((flight) => (
                        <Card key={flight.id}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-lg">{flight.airline}</h4>
                                <p className="text-sm text-muted-foreground">{flight.flight_number}</p>
                              </div>
                              <FiSend className="h-5 w-5 text-primary" />
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">From:</span>
                                <span className="font-medium">{flight.departure_location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">To:</span>
                                <span className="font-medium">{flight.arrival_location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Departure:</span>
                                <span className="font-medium">
                                  {new Date(flight.departure_time).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Arrival:</span>
                                <span className="font-medium">
                                  {new Date(flight.arrival_time).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Stops:</span>
                                <span className="font-medium">{flight.stops}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Price:</span>
                                <span className="font-bold text-primary">{flight.price}</span>
                              </div>
                            </div>

                            {flight.booking_link && (
                              <Button variant="outline" size="sm" asChild className="w-full">
                                <a href={flight.booking_link} target="_blank" rel="noopener noreferrer">
                                  Book Flight <FiExternalLink className="ml-2 h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
