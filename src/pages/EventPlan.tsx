import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiUser, FiUserPlus } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import { WelcomeTour } from "@/components/WelcomeTour";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-typed";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useClerkAuth } from "@/contexts/ClerkAuthContext";
import { EventSettingsDialog } from "@/components/planner/EventSettingsDialog";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { EventoChatCard } from "@/components/event-cards/EventoChatCard";
import { DetailsCard } from "@/components/event-cards/DetailsCard";
import { SpeechCard } from "@/components/event-cards/SpeechCard";
import { MemoriesCard } from "@/components/event-cards/MemoriesCard";
import { ThemeCard } from "@/components/event-cards/ThemeCard";
import { FlightsCard } from "@/components/event-cards/FlightsCard";
import { DecorCard } from "@/components/event-cards/DecorCard";
import { FAQCard } from "@/components/event-cards/FAQCard";
import { BlogsCard } from "@/components/event-cards/BlogsCard";
import { FoodCard } from "@/components/event-cards/FoodCard";
import { SouvenirsCard } from "@/components/event-cards/SouvenirsCard";
import { WeatherCard } from "@/components/event-cards/WeatherCard";
import { SponsorsCard } from "@/components/event-cards/SponsorsCard";
import { EmergencyCard } from "@/components/event-cards/EmergencyCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Step } from "react-joyride";

const eventSteps: Step[] = [
  {
    target: '[data-tour="event-cards"]',
    content:
      "Welcome to your event dashboard! These cards help you manage every aspect of your event.",
    disableBeacon: true,
  },
  {
    target: '[data-tour="search"]',
    content: "Search for specific features using this search bar.",
  },
  {
    target: '[data-tour="settings"]',
    content:
      "Customize which cards are visible and manage event settings here.",
  },
  {
    target: '[data-tour="public-toggle"]',
    content: "Toggle whether your event is public or private.",
  },
];

interface CardItem {
  id: string;
  title: string;
  icon: string;
  description: string;
  path: string;
  component?: "chat" | "details";
}

interface SortableCardProps {
  card: CardItem;
  eventId: string;
}

function SortableCard({ card, eventId }: SortableCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (card.component === "chat") {
    return (
      <div ref={setNodeRef} style={style}>
        <div className="relative group">
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <EventoChatCard eventId={eventId} />
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow group relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardContent className="p-6" onClick={() => navigate(card.path)}>
          <h3 className="font-bold text-lg mb-2">
            {card.icon} {card.title}
          </h3>
          <p className="text-sm text-muted-foreground">{card.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EventPlan() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSignedIn } = useUser();
  const { userId, balloons } = useClerkAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleCardIds, setVisibleCardIds] = useState<string[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [copying, setCopying] = useState(false);
  const [cards, setCards] = useState<CardItem[]>([
    {
      id: "details",
      title: "Details",
      icon: "📝",
      description: "View and edit event details",
      path: `/event/${eventId}/details`,
      component: "details",
    },
    {
      id: "planner",
      title: "Planner",
      icon: "📅",
      description: "Interactive planner with timeline views",
      path: `/event/${eventId}/plan`,
    },
    {
      id: "full-plan",
      title: "Full Plan",
      icon: "📋",
      description: "View complete event overview",
      path: `/event/${eventId}/full-plan`,
    },
    {
      id: "tasks",
      title: "Tasks",
      icon: "✅",
      description: "Manage event tasks",
      path: `/event/${eventId}/tasks`,
    },
    {
      id: "budget",
      title: "Budget",
      icon: "💰",
      description: "Track expenses",
      path: `/event/${eventId}/budget`,
    },
    {
      id: "faqs",
      title: "Faqs",
      icon: "❓",
      description: "AI FAQ suggestions",
      path: `/event/${eventId}/faqs`,
    },
    {
      id: "speeches",
      title: "Speeches",
      icon: "🎤",
      description: "Speeches",
      path: `/event/${eventId}/speeches`,
    },
    {
      id: "memories",
      title: "Memories",
      icon: "📸",
      description: "Memories & highlights",
      path: `/event/${eventId}/memories`,
    },
    {
      id: "blogs",
      title: "Blogs",
      icon: "📰",
      description: "Event updates & blogs",
      path: `/event/${eventId}/manage-blogs`,
    },
    {
      id: "invites",
      title: "Invites",
      icon: "✉️",
      description: "Manage invitations",
      path: `/event/${eventId}/invites`,
    },
    {
      id: "invites",
      title: "Invites",
      icon: "✉️",
      description: "Manage invitations",
      path: `/event/${eventId}/invites`,
    },
    {
      id: "timeline",
      title: "Timeline",
      icon: "⏰",
      description: "Event schedule",
      path: `/event/${eventId}/timeline`,
    },
    {
      id: "vendors",
      title: "Vendors",
      icon: "🏪",
      description: "Find services & vendors",
      path: `/event/${eventId}/vendors`,
    },
    {
      id: "guests",
      title: "Guests",
      icon: "👥",
      description: "Manage attendees & invites",
      path: `/event/${eventId}/guests`,
    },
    {
      id: "tickets",
      title: "Tickets",
      icon: "🎫",
      description: "Manage tickets & attendees",
      path: `/event/${eventId}/manage-tickets`,
    },
    {
      id: "food",
      title: "Food",
      icon: "🍽️",
      description: "AI food suggestions & recipes",
      path: `/event/${eventId}/food`,
    },
    {
      id: "souvenirs",
      title: "Souvenirs",
      icon: "🎁",
      description: "Swag bags & souvenir ideas",
      path: `/event/${eventId}/souvenirs`,
    },
    {
      id: "weather",
      title: "Weather",
      icon: "🌤️",
      description: "Weather forecast & tips",
      path: `/event/${eventId}/weather`,
    },
    {
      id: "sponsors",
      title: "Sponsors",
      icon: "🤝",
      description: "Find event sponsors",
      path: `/event/${eventId}/sponsors`,
    },
    {
      id: "decor",
      title: "Decor",
      icon: "🎨",
      description: "Decoration ideas",
      path: `/event/${eventId}/decor`,
    },
    {
      id: "themes",
      title: "Themes",
      icon: "🪄",
      description: "Theme ideas",
      path: `/event/${eventId}/themes`,
    },
    {
      id: "flights",
      title: "Flights",
      icon: "✈️",
      description: "Flight ticket suggestions",
      path: `/event/${eventId}/flights`,
    },
    {
      id: "memories",
      title: "Memories",
      icon: "📸",
      description: "AI-generated event memories",
      path: `/event/${eventId}/memories`,
    },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (eventId) {
      fetchEventStatus();
      loadCardOrder();
      fetchVisibleCards();
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
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
    }
  };

  const fetchVisibleCards = async () => {
    const { data } = await supabase
      .from("event_settings")
      .select("visible_cards")
      .eq("event_id", eventId)
      .maybeSingle();

    if (data?.visible_cards) {
      setVisibleCardIds(data.visible_cards as string[]);
    } else {
      // Default: all cards visible
      setVisibleCardIds(cards.map((c) => c.id));
    }
  };

  const loadCardOrder = () => {
    const savedOrder = localStorage.getItem(`card-order-${eventId}`);
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const orderedCards = orderIds
          .map((id: string) => cards.find((c) => c.id === id))
          .filter((c: CardItem | undefined): c is CardItem => c !== undefined);

        // Add any new cards that weren't in saved order
        const missingCards = cards.filter((c) => !orderIds.includes(c.id));
        setCards([...orderedCards, ...missingCards]);
      } catch (e) {
        console.error("Failed to load card order:", e);
      }
    }
  };

  const saveCardOrder = (newCards: CardItem[]) => {
    const orderIds = newCards.map((c) => c.id);
    localStorage.setItem(`card-order-${eventId}`, JSON.stringify(orderIds));
  };

  const fetchEventStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("is_public")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setIsPublic(data?.is_public || false);
    } catch (error) {
      console.error("Error fetching event status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_public: checked })
        .eq("id", eventId);

      if (error) throw error;

      setIsPublic(checked);
      toast({
        title: "Success",
        description: `Event is now ${checked ? "public" : "private"}`,
      });
    } catch (error) {
      console.error("Error updating event status:", error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

  const handleAddToAccount = async () => {
    if (!userId || !event) return;

    setCopying(true);
    try {
      // Create a copy of the event with user's ID
      const { data: newEvent, error: eventError } = await supabase
        .from("events")
        .insert({
          ...event,
          id: undefined,
          clerk_user_id: userId,
          created_at: undefined,
          updated_at: undefined,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Copy related data
      const tables = [
        "tasks",
        "budget_items",
        "timeline_events",
        "invites",
        "event_faqs",
        "event_speeches",
      ];

      for (const table of tables) {
        const { data: items } = await (supabase as any)
          .from(table)
          .select("*")
          .eq("event_id", eventId);

        if (items && items.length > 0) {
          await (supabase as any).from(table).insert(
            items.map((item: any) => ({
              ...item,
              id: undefined,
              event_id: newEvent.id,
              created_at: undefined,
              updated_at: undefined,
            }))
          );
        }
      }

      // Remove from localStorage
      const ownedEvents = JSON.parse(
        localStorage.getItem("owned_events") || "[]"
      );
      const updated = ownedEvents.filter((id: string) => id !== eventId);
      localStorage.setItem("owned_events", JSON.stringify(updated));

      toast({
        title: "Success",
        description: "Event added to your account!",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error copying event:", error);
      toast({
        title: "Error",
        description: "Failed to add event to account",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  };

  const isGuestEvent = !event?.clerk_user_id && isSignedIn;

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isVisible = visibleCardIds.includes(card.id);
    return matchesSearch && isVisible;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newCards = arrayMove(items, oldIndex, newIndex);
        saveCardOrder(newCards);
        return newCards;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeTour steps={eventSteps} />
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/">
              <h1 className="hover:rotate-[5deg] hover:scale-110 transition-all text-2xl font-bold text-gradient">
                eventor.ai
              </h1>
            </Link>{" "}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-4 w-4" />
              {balloons} Balloons
            </Badge>
            <ThemeSelector />
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
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/dashboard" />
            ) : (
              <SignInButton mode="modal">
                <Button size="sm">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Event Plan</h2>
              <p className="text-muted-foreground">
                AI-generated plan tailored to your event
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isGuestEvent && (
                <Button
                  onClick={handleAddToAccount}
                  disabled={copying}
                  className="gap-2"
                  variant="default"
                >
                  <FiUserPlus className="h-4 w-4" />
                  {copying ? "Adding..." : "Add to Your Account"}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                data-tour="settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <div
                className="flex items-center space-x-2"
                data-tour="public-toggle"
              >
                <Switch
                  id="public-mode"
                  checked={isPublic}
                  onCheckedChange={handlePublicToggle}
                  disabled={loading}
                />
                <Label htmlFor="public-mode">
                  {isPublic ? "Public Event" : "Private Event"}
                </Label>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
              data-tour="search"
            />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredCards.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-slide-up"
              data-tour="event-cards"
            >
              {filteredCards.map((card) => (
                <SortableCard key={card.id} card={card} eventId={eventId!} />
              ))}
              <EventoChatCard eventId={eventId!} />
              {event && <EmergencyCard event={event} />}
            </div>
          </SortableContext>
        </DndContext>

        <EventSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          eventId={eventId!}
        />
      </div>
    </div>
  );
}
