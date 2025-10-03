import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';

export default function EventWeather() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const generateWeather = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-weather', {
        body: {
          country: event?.country,
          city: event?.state,
          location: event?.location_name,
          eventDate: event?.event_date,
          eventTime: event?.event_time
        }
      });
      if (error) throw error;
      
      // Store weather in database
      await supabase
        .from('events')
        .update({ weather_data: { forecast: data.forecast } })
        .eq('id', eventId);
      
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Weather forecast generated!' });
    },
    onError: (error) => {
      console.error('Weather generation error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to generate weather forecast',
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/event/${eventId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Weather & Preparation</h1>
            <p className="text-muted-foreground">Weather forecast and event preparation tips</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Weather Forecast</CardTitle>
                <CardDescription>
                  {event?.location_name}, {event?.state}, {event?.country}
                </CardDescription>
              </div>
              <Button 
                onClick={() => generateWeather.mutate()} 
                disabled={generateWeather.isPending}
              >
                {generateWeather.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {event?.weather_data && typeof event.weather_data === 'object' && 'forecast' in event.weather_data ? (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{String(event.weather_data.forecast)}</ReactMarkdown>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Click "Generate Forecast" to get AI-powered weather information for your event.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
