import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-typed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import {
  ChevronDown,
  Users,
  Ticket,
  Crown,
  Gift,
  QrCode,
  LinkIcon,
  Key,
  Copy,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Zap,
  UserCheck,
  BookOpen,
  MapPin,
  HelpCircle,
  Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { JoinAsAttendeeModal } from "@/components/tickets/JoinAsAttendeeModal";
import { GuestFlowModal } from "@/components/tickets/GuestFlowModal";
import { CheckedInCard } from "@/components/event-cards/CheckedInCard";

export default function EventGuests() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLinkModalOpen, setInviteLinkModalOpen] = useState(false);
  const [inviteCodeModalOpen, setInviteCodeModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [showJoinAsAttendee, setShowJoinAsAttendee] = useState(false);
  const [showGuestFlow, setShowGuestFlow] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [eventSettings, setEventSettings] = useState<any>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchAttendees();
      fetchEventSettings();
    }
  }, [eventId]);

  const fetchEventSettings = async () => {
    const { data } = await supabase
      .from("event_settings" as any)
      .select("*")
      .eq("event_id", eventId)
      .single();
    
    setEventSettings(data);
  };

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("events" as any)
        .select("*")
        .eq("id", eventId)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Generate invite code if not exists
      if (!(data as any).invite_code) {
        const inviteCode = generateInviteCode();
        const { error: updateError } = await supabase
          .from("events" as any)
          .update({ invite_code: inviteCode })
          .eq("id", eventId);
        
        if (!updateError) {
          (data as any).invite_code = inviteCode;
        }
      }

      setEvent(data as any);
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

  const fetchAttendees = async () => {
    try {
      const { data: attendeeGroups } = await supabase
        .from("attendee_groups" as any)
        .select("*")
        .eq("event_id", eventId)
        .eq("is_banned", false)
        .order("created_at", { ascending: false });

      const { data: eventAttendees } = await supabase
        .from("event_attendees" as any)
        .select("*")
        .eq("event_id", eventId)
        .order("joined_at", { ascending: false });

      setAttendees([...(attendeeGroups || []), ...(eventAttendees || [])]);
    } catch (error) {
      console.error("Error fetching attendees:", error);
    }
  };

  const generateInviteCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleViewRules = () => {
    if (eventSettings?.rules_guidelines) {
      setShowRules(true);
    } else {
      toast({
        title: "No Rules Available",
        description: "Event rules have not been set up yet",
      });
    }
  };

  const handleViewHandbook = () => {
    if (eventSettings?.guest_handbook) {
      setShowHandbook(true);
    } else {
      toast({
        title: "No Handbook Available",
        description: "Guest handbook has not been created yet",
      });
    }
  };

  const inviteLink = `${window.location.origin}/invite/${eventId}`;

  const regularAttendees = attendees.filter((a) => a.group_type === "regular" || a.attendee_type === "regular");
  const vipAttendees = attendees.filter((a) => a.group_type === "vip" || a.attendee_type === "vip");
  const invitedAttendees = attendees.filter((a) => a.group_type === "invited" || a.attendee_type === "free_invited");
  const adminAttendees = attendees.filter((a) => a.group_type === "admin");

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
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Guest Portal</h1>
          <p className="text-muted-foreground">Everything you need as a guest at {event.name}</p>
          
          <div className="flex gap-3 mt-4">
            <Link to={`/event/${eventId}/blogs`}>
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                View Event Blogs
              </Button>
            </Link>
            <Link to={`/event/${eventId}/event-winner`}>
              <Button variant="outline">
                <Trophy className="h-4 w-4 mr-2" />
                Event Winner Spinner
              </Button>
            </Link>
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
                <CardDescription className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge>{event.event_type}</Badge>
                    <Badge variant={event.is_public ? "default" : "secondary"}>
                      {event.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.theme_preferences && (
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">{event.theme_preferences}</p>
              </div>
            )}
            {event.event_duration && (
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">{event.event_duration} hours</p>
              </div>
            )}
            {event.location_name && (
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{event.location_name}</p>
              </div>
            )}
            {event.short_description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">{event.short_description}</p>
              </div>
            )}
            {event.event_date && (
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.event_date), "PPP")}
                  {event.event_time && ` at ${event.event_time}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket & Guest Management Section */}
        <Collapsible defaultOpen className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-4">
              <span className="text-lg font-semibold">Tickets & Attendees</span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => {
                  const hasTicket = localStorage.getItem(`ticket_${eventId}`);
                  if (hasTicket) {
                    setShowJoinAsAttendee(true);
                  } else {
                    navigate(`/event/${eventId}/purchase-ticket`);
                  }
                }}
              >
                <CardHeader>
                  <Ticket className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Get Ticket</CardTitle>
                  <CardDescription>Purchase and get your ticket</CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowJoinAsAttendee(true)}
              >
                <CardHeader>
                  <UserCheck className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Join as Attendee</CardTitle>
                  <CardDescription>Already registered? Join here</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Attendees</CardTitle>
                  <CardDescription>{regularAttendees.length} guests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {regularAttendees.slice(0, 5).map((attendee) => (
                      <p key={attendee.id} className="text-sm">
                        {attendee.attendee_name}
                      </p>
                    ))}
                    {regularAttendees.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        +{regularAttendees.length - 5} more
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <CheckedInCard eventId={eventId!} />

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/attendee-create/${eventId}`)}
              >
                <CardHeader>
                  <Sparkles className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Create Attendee Plan</CardTitle>
                  <CardDescription>Plan your outfits, gifts, and budget</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Crown className="h-8 w-8 mb-2 text-yellow-500" />
                  <CardTitle>VIP & Special</CardTitle>
                  <CardDescription>
                    {vipAttendees.length + invitedAttendees.length + adminAttendees.length} total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {vipAttendees.length > 0 && (
                      <p className="text-sm"><Crown className="h-3 w-3 inline mr-1" />{vipAttendees.length} VIP</p>
                    )}
                    {invitedAttendees.length > 0 && (
                      <p className="text-sm"><Gift className="h-3 w-3 inline mr-1" />{invitedAttendees.length} Invited</p>
                    )}
                    {adminAttendees.length > 0 && (
                      <p className="text-sm"><Key className="h-3 w-3 inline mr-1" />{adminAttendees.length} Admin</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Guest Experience Section */}
        <Collapsible defaultOpen className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-4">
              <span className="text-lg font-semibold">Guest Experience</span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setShowGuestFlow(true)}
            >
              <CardHeader>
                <MapPin className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Guest Flow</CardTitle>
                <CardDescription>View the guest journey from arrival to departure</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleViewRules}
            >
              <CardHeader>
                <BookOpen className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Event Rules</CardTitle>
                <CardDescription>View guidelines and rules for the event</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleViewHandbook}
            >
              <CardHeader>
                <BookOpen className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Guest Handbook</CardTitle>
                <CardDescription>Everything you need to know about the event</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/event/${eventId}/faqs`)}
            >
              <CardHeader>
                <HelpCircle className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>FAQs</CardTitle>
                <CardDescription>Frequently asked questions about the event</CardDescription>
              </CardHeader>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Ice Breakers & Games Section */}
        <Collapsible defaultOpen className="mb-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-4">
              <span className="text-lg font-semibold">Ice Breakers & Games</span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            {!eventSettings?.ice_breakers_enabled ? (
              <Card className="bg-muted">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Disabled by admin
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "AI Trivia", icon: Sparkles, path: "trivia" },
                  { title: "Online Jeopardy", icon: TrendingUp, path: "jeopardy" },
                  { title: "Online Quizizz", icon: Sparkles, path: "quizizz" },
                  { title: "AI Ice-Breakers", icon: Users, path: "icebreakers" },
                  { title: "AI Jokes", icon: Sparkles, path: "jokes" },
                  { title: "Guess from Emojis", icon: Sparkles, path: "emoji" },
                  { title: "Random Task", icon: Zap, path: "task" },
                ].map((game) => (
                  <Card 
                    key={game.path} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/event/${eventId}/games/${game.path}/default`)}
                  >
                    <CardHeader>
                      <game.icon className="h-6 w-6 mb-2 text-primary" />
                      <CardTitle className="text-sm">{game.title}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Invite Section */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-4">
              <span className="text-lg font-semibold">Invite</span>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            {!eventSettings?.external_invites_enabled ? (
              <Card className="bg-muted">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Disabled by admin
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <QrCode className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>QR Code</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <QRCodeSVG value={inviteLink} size={150} />
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setInviteLinkModalOpen(true)}
                >
                  <CardHeader>
                    <LinkIcon className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Get Invite Link</CardTitle>
                    <CardDescription>Share the event link</CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setInviteCodeModalOpen(true)}
                >
                  <CardHeader>
                    <Key className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle>Get Invite Code</CardTitle>
                    <CardDescription>Share the event code</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Join As Attendee Modal */}
      {showJoinAsAttendee && (
        <JoinAsAttendeeModal
          open={showJoinAsAttendee}
          onOpenChange={setShowJoinAsAttendee}
          eventId={eventId!}
        />
      )}

      {/* Guest Flow Modal */}
      {showGuestFlow && (
        <GuestFlowModal
          open={showGuestFlow}
          onOpenChange={setShowGuestFlow}
          eventId={eventId!}
        />
      )}

      {/* Rules Modal */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Rules & Guidelines</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap">
            {eventSettings?.rules_guidelines}
          </div>
        </DialogContent>
      </Dialog>

      {/* Handbook Modal */}
      <Dialog open={showHandbook} onOpenChange={setShowHandbook}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guest Handbook</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap">
            {eventSettings?.guest_handbook}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Link Modal */}
      <Dialog open={inviteLinkModalOpen} onOpenChange={setInviteLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
            <DialogDescription>Share this link to invite people</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(inviteLink, "Invite link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Code Modal */}
      <Dialog open={inviteCodeModalOpen} onOpenChange={setInviteCodeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Code</DialogTitle>
            <DialogDescription>Share this code to invite people</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold tracking-widest">{event?.invite_code}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => copyToClipboard(event?.invite_code || "", "Invite code")}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}