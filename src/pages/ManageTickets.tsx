import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FiArrowLeft } from 'react-icons/fi';
import { Trophy } from 'lucide-react';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useState, useEffect } from 'react';
import { GuestFlowModal } from '@/components/tickets/GuestFlowModal';
import { TicketDesignCard } from '@/components/tickets/TicketDesignCard';
import { AttendeeManagementCard } from '@/components/tickets/AttendeeManagementCard';
import { AnalyticsCard } from '@/components/tickets/AnalyticsCard';
import { SeatmapCard } from '@/components/tickets/SeatmapCard';
import { SettingsCard } from '@/components/tickets/SettingsCard';
import { RulesCard } from '@/components/tickets/RulesCard';
import { GamesCard } from '@/components/tickets/GamesCard';
import { LocationCoordinatesCard } from '@/components/tickets/LocationCoordinatesCard';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { CheckInManagementCard } from '@/components/event-cards/CheckInManagementCard';

export default function ManageTickets() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showGuestFlow, setShowGuestFlow] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [inviteLinkModalOpen, setInviteLinkModalOpen] = useState(false);
  const [inviteCodeModalOpen, setInviteCodeModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ticketConfig, isLoading } = useQuery({
    queryKey: ['ticket-config', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_config')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const updateWinnerEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (ticketConfig) {
        const { error } = await supabase
          .from('ticket_config')
          .update({ winner_enabled: enabled })
          .eq('event_id', eventId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ticket_config')
          .insert({
            event_id: eventId,
            winner_enabled: enabled,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-config', eventId] });
      toast({ title: 'Winner settings updated' });
    },
  });

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    const { data } = await supabase.from('events' as any).select('*').eq('id', eventId).single();
    setEvent(data);
  };

  const inviteLink = `${window.location.origin}/invite/${eventId}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
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
            <h1 className="text-2xl font-bold text-gradient">Ticket Management</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <CheckInManagementCard eventId={eventId!} />
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowGuestFlow(true)}>
            <CardHeader>
              <CardTitle>🚶 Guest Flow</CardTitle>
              <CardDescription>AI-generated guest journey from arrival to departure</CardDescription>
            </CardHeader>
          </Card>

          <TicketDesignCard eventId={eventId!} />
          <AttendeeManagementCard eventId={eventId!} />
          <AnalyticsCard eventId={eventId!} />
          <SeatmapCard eventId={eventId!} />
          <SettingsCard eventId={eventId!} />
          <RulesCard eventId={eventId!} />
          <GamesCard eventId={eventId!} />
          <LocationCoordinatesCard eventId={eventId!} />
          
          {/* Winner Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Event Winner Settings
              </CardTitle>
              <CardDescription>Enable or disable the winner spinner feature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="winner-enabled">Enable Winner Spinner</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow attendees to participate in the winner selection process
                  </p>
                </div>
                <Switch
                  id="winner-enabled"
                  checked={ticketConfig?.winner_enabled || false}
                  onCheckedChange={(checked) => updateWinnerEnabled.mutate(checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-4 mt-8">Invite Section</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Share via QR code</CardDescription>
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
              <CardTitle>🔗 Get Invite Link</CardTitle>
              <CardDescription>Share the event link</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setInviteCodeModalOpen(true)}
          >
            <CardHeader>
              <CardTitle>🔑 Get Invite Code</CardTitle>
              <CardDescription>Share the event code</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <GuestFlowModal 
        open={showGuestFlow} 
        onOpenChange={setShowGuestFlow}
        eventId={eventId!}
      />

      <Dialog open={inviteLinkModalOpen} onOpenChange={setInviteLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={inviteLink} readOnly />
            <Button onClick={() => copyToClipboard(inviteLink, "Invite link")} className="w-full">
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteCodeModalOpen} onOpenChange={setInviteCodeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={event?.invite_code || 'Loading...'} readOnly className="text-2xl font-bold text-center" />
            <Button onClick={() => copyToClipboard(event?.invite_code, "Invite code")} className="w-full">
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
