import { Link, useNavigate } from "react-router-dom";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import {
  FiPlus,
  FiCalendar,
  FiTrash2,
  FiUser,
  FiDownload,
  FiSettings,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { ConfettiButton } from "@/components/ConfettiButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import { GuestModeModal } from "@/components/GuestModeModal";
import { WelcomeTour } from "@/components/WelcomeTour";
import { useEvents } from "@/hooks/useEvents";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-typed";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { Backpack } from "react-kawaii";
import { useKawaiiTheme } from "@/hooks/useKawaiiTheme";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { balloons, userId } = useClerkAuth();
  const { events, loading, deleteEvent } = useEvents();
  const { toast } = useToast();
  const { kawaiiColor } = useKawaiiTheme();
  const [guestEvents, setGuestEvents] = useState<any[]>([]);
  const [playTicTacToeLoading, setPlayTicTacToeLoading] = useState(
    localStorage.getItem("play_tictactoe_loading") === "true"
  );

  useEffect(() => {
    if (!isSignedIn) {
      loadGuestEvents();
    } else {
      // When user signs in, merge guest events
      mergeGuestEvents();
    }
  }, [isSignedIn]);

  const mergeGuestEvents = async () => {
    const guestEventIds = JSON.parse(
      localStorage.getItem("owned_events") || "[]"
    );
    if (guestEventIds.length > 0 && userId) {
      // Load guest events
      const { data: guestEventsData } = await (supabase as any)
        .from("events")
        .select("*")
        .in("id", guestEventIds);

      if (guestEventsData && guestEventsData.length > 0) {
        setGuestEvents(guestEventsData);
        toast({
          title: "Guest Events Found",
          description: `You have ${guestEventsData.length} events from guest mode. Add them to your account from the event page.`,
        });
      }
    }
  };

  const loadGuestEvents = async () => {
    // Load from both owned_events and guestEvents for backward compatibility
    const ownedEventIds = JSON.parse(
      localStorage.getItem("owned_events") || "[]"
    );
    const guestEventIds = JSON.parse(
      localStorage.getItem("guestEvents") || "[]"
    );
    const allEventIds = [...new Set([...ownedEventIds, ...guestEventIds])];

    if (allEventIds.length > 0) {
      const { data } = await (supabase as any)
        .from("events")
        .select("*")
        .in("id", allEventIds)
        .order("created_at", { ascending: false });

      setGuestEvents(data || []);
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this event?")) {
      await deleteEvent(id);

      // Remove from guest events if not signed in
      if (!isSignedIn) {
        const guestEventIds = JSON.parse(
          localStorage.getItem("guestEvents") || "[]"
        );
        const updated = guestEventIds.filter(
          (eventId: string) => eventId !== id
        );
        localStorage.setItem("guestEvents", JSON.stringify(updated));
        loadGuestEvents();
      }
    }
  };

  const downloadEventLinks = () => {
    const eventLinks = (isSignedIn ? events : guestEvents)
      .map(
        (event) => `${event.name} - ${window.location.origin}/event/${event.id}`
      )
      .join("\n\n");

    const blob = new Blob([eventLinks], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-links.txt";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Event links downloaded successfully",
    });
  };

  const handleToggleTicTacToe = (checked: boolean) => {
    setPlayTicTacToeLoading(checked);
    localStorage.setItem("play_tictactoe_loading", checked.toString());
    toast({
      title: checked ? "Enabled" : "Disabled",
      description: checked
        ? "Tic-tac-toe will show during loading"
        : "Tic-tac-toe disabled",
    });
  };

  const displayEvents = isSignedIn
    ? [...events.filter((e) => e.clerk_user_id === userId), ...guestEvents]
    : guestEvents;

  return (
    <div className="min-h-screen bg-background" data-tour="dashboard">
      <WelcomeTour />
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <h1 className="hover:rotate-[5deg] hover:scale-110 transition-all text-2xl font-bold text-gradient">
              eventor.ai
            </h1>
          </Link>{" "}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1" data-tour="balloons">
              <Coins className="h-4 w-4" />
              {balloons} Balloons
            </Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <FiSettings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Dashboard Settings</SheetTitle>
                  <SheetDescription>
                    Customize your dashboard experience
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tictactoe">
                      Play Tic-Tac-Toe when loading
                    </Label>
                    <Switch
                      id="tictactoe"
                      checked={playTicTacToeLoading}
                      onCheckedChange={handleToggleTicTacToe}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate("/pricing")}
            >
              <span className="font-semibold">{balloons} 🎈</span>
            </Button>
            {isSignedIn && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                data-tour="profile"
              >
                <FiUser className="h-5 w-5" />
              </Button>
            )}
            <ThemeSelector data-tour="theme" />

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/dashboard" />
            ) : (
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!isSignedIn && (
          <GuestModeModal
            guestEvents={guestEvents}
            onDownloadLinks={downloadEventLinks}
          />
        )}

        <div className="mb-8 flex flex-wrap items-center gap-4 animate-fade-in">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">My Events</h2>
            <p className="text-muted-foreground">
              Manage all your planned events
            </p>
          </div>
          <ConfettiButton
            onClick={() => navigate("/create")}
            className="gap-2"
            rewardType="confetti"
            data-tour="create-event"
          >
            <FiPlus className="h-5 w-5" />
            Create Event
          </ConfettiButton>
          <ConfettiButton
            onClick={() => navigate("/attendee-create-modes/custom")}
            variant="outline"
            className="gap-2"
            rewardType="balloons"
          >
            <FiPlus className="h-5 w-5" />
            Plan Attendance
          </ConfettiButton>
        </div>

        {!isSignedIn && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg animate-fade-in">
            <p className="text-sm">
              🎈 <strong>Guest Mode:</strong> You have {balloons} free balloons
              to try our AI features! Sign in to save your progress and get more
              balloons.
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayEvents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex justify-center mb-6">
                <Backpack size={120} mood="sad" color={kawaiiColor} />
              </div>
              <h3 className="text-xl font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to get started
              </p>
              <ConfettiButton
                onClick={() => navigate("/create")}
                rewardType="balloons"
              >
                <FiPlus className="h-5 w-5 mr-2" />
                Create Event
              </ConfettiButton>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-slide-up">
            {displayEvents.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                {event.event_image && (
                  <div className="h-40 w-full overflow-hidden">
                    <img
                      src={event.event_image}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{event.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteEvent(event.id, e)}
                      className="h-8 w-8"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FiCalendar className="h-4 w-4" />
                    {format(new Date(event.event_date), "PPP")}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {event.event_type} • {event.plan_mode}
                  </p>
                  {event.location_name && (
                    <p className="text-sm text-muted-foreground truncate">
                      📍 {event.location_name}
                      {event.country && `, ${event.country}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
