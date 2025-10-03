import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function EventInvite() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!attendeeName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join",
        variant: "destructive",
      });
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase.from("event_attendees").insert({
        event_id: eventId,
        attendee_name: attendeeName,
        attendee_type: "regular",
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've joined the event",
      });

      navigate(`/event/${eventId}/guests`);
    } catch (error) {
      console.error("Error joining event:", error);
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>This event doesn't exist or is no longer available</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">You're Invited!</CardTitle>
          <CardDescription className="text-lg">{event.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.event_date), "PPP")}
                  {event.event_time && ` at ${event.event_time}`}
                </p>
              </div>
            </div>

            {event.location_name && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.location_name}</p>
                </div>
              </div>
            )}

            {event.estimated_guests && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Expected Guests</p>
                  <p className="text-sm text-muted-foreground">~{event.estimated_guests} people</p>
                </div>
              </div>
            )}

            {event.short_description && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">About This Event</p>
                <p className="text-sm text-muted-foreground">{event.short_description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Enter your name to join</label>
              <Input
                placeholder="Your name"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <Button onClick={handleJoin} disabled={joining} className="w-full" size="lg">
              {joining ? "Joining..." : "Join Event"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
