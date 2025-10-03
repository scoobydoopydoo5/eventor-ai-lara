import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Eye, MapPin, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PublicEvent {
  id: string;
  name: string;
  event_type: string;
  short_description?: string;
  event_date: string;
  location_name?: string;
  country?: string;
  estimated_guests?: number;
  theme_preferences?: string;
  actual_attendees?: number;
  clerk_user_id?: string;
  creator_name?: string;
  creator_username?: string;
}

export default function FindEvents() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PublicEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showFavorites, setShowFavorites] = useState(false);
  const [previewEvent, setPreviewEvent] = useState<PublicEvent | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicEvents();
    loadFavorites();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, selectedType, events]);

  const fetchPublicEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_public", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      
      // Fetch actual attendee counts and creator info
      const eventsWithCounts = await Promise.all((data || []).map(async (event) => {
        const { data: attendees } = await supabase
          .from("attendee_groups")
          .select("id")
          .eq("event_id", event.id)
          .eq("is_banned", false);
        
        // Fetch creator info if event has clerk_user_id
        let creator_name = 'Anonymous';
        let creator_username = null;
        
        if (event.clerk_user_id) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("email, username, show_name")
            .eq("clerk_user_id", event.clerk_user_id)
            .single();
          
          if (profile) {
            creator_name = profile.show_name && profile.email 
              ? profile.email.split('@')[0] 
              : 'Anonymous';
            creator_username = profile.username;
          }
        }
        
        return {
          ...event,
          actual_attendees: attendees?.length || 0,
          creator_name,
          creator_username
        };
      }));
      
      setEvents(eventsWithCounts);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem("event_favorites");
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)));
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (showFavorites) {
      filtered = filtered.filter((event) => favorites.has(event.id));
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((event) => event.event_type === selectedType);
    }

    setFilteredEvents(filtered);
  };

  const toggleFavorite = async (eventId: string) => {
    const userIdentifier = localStorage.getItem("user_identifier") || `guest_${Date.now()}`;
    localStorage.setItem("user_identifier", userIdentifier);

    try {
      if (favorites.has(eventId)) {
        await supabase
          .from("event_favorites")
          .delete()
          .eq("event_id", eventId)
          .eq("user_identifier", userIdentifier);

        const newFavorites = new Set(favorites);
        newFavorites.delete(eventId);
        setFavorites(newFavorites);
        localStorage.setItem("event_favorites", JSON.stringify([...newFavorites]));
      } else {
        await supabase.from("event_favorites").insert({
          event_id: eventId,
          user_identifier: userIdentifier,
        });

        const newFavorites = new Set(favorites);
        newFavorites.add(eventId);
        setFavorites(newFavorites);
        localStorage.setItem("event_favorites", JSON.stringify([...newFavorites]));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const eventTypes = ["all", ...new Set(events.map((e) => e.event_type))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Events</h1>
          <p className="text-muted-foreground">Discover and join exciting events</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {favorites.size > 0 && (
              <Button
                variant={showFavorites ? "default" : "outline"}
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  setSelectedType("all");
                }}
                size="sm"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
            )}
            {eventTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type && !showFavorites ? "default" : "outline"}
                onClick={() => {
                  setSelectedType(type);
                  setShowFavorites(false);
                }}
                size="sm"
              >
                {type === "all" ? "All Events" : type}
              </Button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {(event as any).event_image && (
                  <div className="h-40 w-full overflow-hidden">
                    <img 
                      src={(event as any).event_image} 
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(event.id)}
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          favorites.has(event.id)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  </div>
                  <CardDescription>
                    <Badge variant="secondary">{event.event_type}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {event.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.short_description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(event.event_date), "PPP")}
                  </div>
                  {event.location_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {event.location_name}{event.country && `, ${event.country}`}
                    </div>
                  )}
                  {event.estimated_guests && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {event.actual_attendees}/{event.estimated_guests ? `~${event.estimated_guests}` : '?'} guests
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground pt-2 border-t border-border">
                    Event by:{' '}
                    {event.creator_username ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/p/${event.creator_username}`);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        {event.creator_name}
                      </button>
                    ) : (
                      <span className="font-medium">{event.creator_name}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPreviewEvent(event)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => navigate(`/event/${event.id}/guests`)}
                  >
                    Join Event
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!previewEvent} onOpenChange={() => setPreviewEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewEvent?.name}</DialogTitle>
          </DialogHeader>
          {previewEvent && (
            <div className="space-y-4">
              <div>
                <Badge variant="secondary">{previewEvent.event_type}</Badge>
              </div>
              {previewEvent.short_description && (
                <p className="text-muted-foreground">{previewEvent.short_description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(previewEvent.event_date), "PPP")}
                  </p>
                </div>
                {previewEvent.location_name && (
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {previewEvent.location_name}
                    </p>
                  </div>
                )}
                {previewEvent.estimated_guests && (
                  <div>
                    <p className="text-sm font-medium">Expected Guests</p>
                    <p className="text-sm text-muted-foreground">
                      ~{previewEvent.estimated_guests}
                    </p>
                  </div>
                )}
                {previewEvent.theme_preferences && (
                  <div>
                    <p className="text-sm font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      {previewEvent.theme_preferences}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setPreviewEvent(null);
                    navigate(`/event/${previewEvent.id}/guests`);
                  }}
                  className="flex-1"
                >
                  Join Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
