import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { SeatmapSelector } from './SeatmapSelector';
import { TicketModal } from './TicketModal';

interface JoinAsAttendeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

interface AttendeeData {
  id: string;
  attendee_name: string;
  group_type: string;
  password?: string;
}

export function JoinAsAttendeeModal({ open, onOpenChange, eventId }: JoinAsAttendeeModalProps) {
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [password, setPassword] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeData | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showSeatmap, setShowSeatmap] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [seatmapConfig, setSeatmapConfig] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && eventId) {
      fetchAttendees();
      fetchSeatmapConfig();
    }
  }, [open, eventId]);

  const fetchAttendees = async () => {
    const { data } = await (supabase as any)
      .from('attendee_groups')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_banned', false)
      .order('attendee_name');

    setAttendees(data || []);
  };

  const fetchSeatmapConfig = async () => {
    const { data } = await (supabase as any)
      .from('seatmap_config')
      .select('*')
      .eq('event_id', eventId)
      .single();

    setSeatmapConfig(data);
  };

  const handleItsMe = (attendee: AttendeeData) => {
    setSelectedAttendee(attendee);
    if (attendee.group_type === 'regular' || !attendee.password) {
      if (seatmapConfig?.has_seatmap) {
        setShowSeatmap(true);
      } else {
        generateTicket(attendee, null);
      }
    }
  };

  const handlePasswordSubmit = () => {
    if (selectedAttendee && password === selectedAttendee.password) {
      if (seatmapConfig?.has_seatmap) {
        setShowSeatmap(true);
      } else {
        generateTicket(selectedAttendee, null);
      }
    } else {
      toast({
        title: 'Error',
        description: 'Incorrect password',
        variant: 'destructive'
      });
    }
  };

  const generateTicket = async (attendee: AttendeeData, seat: string | null) => {
    const { data: ticketConfig } = await (supabase as any)
      .from('ticket_config')
      .select('*')
      .eq('event_id', eventId)
      .single();

  const { data: eventData } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    setTicketData({
      ...ticketConfig,
      eventData,
      attendeeName: attendee.attendee_name,
      groupType: attendee.group_type,
      seat: seat,
      password: Math.random().toString(36).substring(7).toUpperCase()
    });

    setShowTicket(true);
    setShowSeatmap(false);
    setPassword('');
    setSelectedAttendee(null);
    
    toast({
      title: 'Success',
      description: 'Ticket generated successfully!'
    });
  };

  const filterByType = (type: string) => {
    return attendees.filter(a => a.group_type === type);
  };

  return (
    <>
      <Dialog open={open && !showSeatmap && !showTicket} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Join as Attendee</DialogTitle>
          </DialogHeader>

          {selectedAttendee && selectedAttendee.password ? (
            <div className="space-y-4">
              <p>Enter password for {selectedAttendee.attendee_name}:</p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <div className="flex gap-2">
                <Button onClick={handlePasswordSubmit}>Submit</Button>
                <Button variant="outline" onClick={() => {
                  setSelectedAttendee(null);
                  setPassword('');
                }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="vip">VIP</TabsTrigger>
                <TabsTrigger value="invited">Invited</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              {['all', 'vip', 'invited', 'admin'].map(type => (
                <TabsContent key={type} value={type} className="space-y-2">
                  {(type === 'all' ? attendees : filterByType(type)).map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{attendee.attendee_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{attendee.group_type}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleItsMe(attendee)}
                      >
                        {attendee.password ? <Lock className="h-4 w-4 mr-2" /> : null}
                        It's Me
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {showSeatmap && selectedAttendee && (
        <SeatmapSelector
          open={showSeatmap}
          onOpenChange={setShowSeatmap}
          eventId={eventId}
          onSeatSelected={(seat) => {
            setSelectedSeat(seat);
            generateTicket(selectedAttendee, seat);
          }}
        />
      )}

      {showTicket && ticketData && (
        <TicketModal
          open={showTicket}
          onOpenChange={setShowTicket}
          ticketData={ticketData}
        />
      )}
    </>
  );
}