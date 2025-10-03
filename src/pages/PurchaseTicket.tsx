import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiArrowLeft } from 'react-icons/fi';
import { ThemeSelector } from '@/components/ThemeSelector';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { SeatmapSelector } from '@/components/tickets/SeatmapSelector';
import { TicketModal } from '@/components/tickets/TicketModal';

export default function PurchaseTicket() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [donation, setDonation] = useState('');
  const [seatmapConfig, setSeatmapConfig] = useState<any>(null);
  const [ticketConfig, setTicketConfig] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [showSeatmap, setShowSeatmap] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const fetchData = async () => {
    const [seatmapRes, ticketRes, eventRes] = await Promise.all([
      supabase.from('seatmap_config' as any).select('*').eq('event_id', eventId).single(),
      supabase.from('ticket_config' as any).select('*').eq('event_id', eventId).single(),
      supabase.from('events' as any).select('*').eq('id', eventId).single()
    ]);

    setSeatmapConfig(seatmapRes.data);
    setTicketConfig(ticketRes.data);
    setEventData(eventRes.data);
  };

  const handleSelectSeat = () => {
    if (seatmapConfig?.has_seatmap) {
      setShowSeatmap(true);
    }
  };

  const handlePurchase = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name',
        variant: 'destructive'
      });
      return;
    }

    // Add to attendees
    await supabase.from('attendee_groups' as any).insert({
      event_id: eventId,
      attendee_name: name,
      group_type: 'regular',
      is_banned: false
    });

    // Generate ticket
    const password = Math.random().toString(36).substring(7).toUpperCase();
    
    const checkInUrl = `${window.location.origin}/check-in/${eventId}/${encodeURIComponent(name)}`;
    
    const ticket = {
      ...ticketConfig,
      eventData,
      attendeeName: name,
      groupType: 'regular',
      seat: selectedSeat,
      password,
      checkInUrl
    };
    
    setTicketData(ticket);
    
    // Store ticket purchase status in localStorage
    localStorage.setItem(`ticket_${eventId}`, JSON.stringify({
      purchased: true,
      name,
      date: new Date().toISOString()
    }));

    setShowTicket(true);
    
    toast({
      title: 'Success',
      description: 'Ticket purchased successfully!'
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/event/${eventId}/guests`)}
              >
                <FiArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gradient">Purchase Ticket</h1>
            </div>
            <ThemeSelector />
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{eventData?.name}</CardTitle>
              <CardDescription>
                {new Date(eventData?.event_date).toLocaleDateString()} at {eventData?.event_time || 'TBA'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Your Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {seatmapConfig?.has_seatmap && !selectedSeat && (
                <div>
                  <Label>Seat Selection (Required)</Label>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSelectSeat}
                      className="flex-1"
                    >
                      Choose Seat
                    </Button>
                    <Button variant="outline" onClick={handleSelectSeat}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Recommend
                    </Button>
                  </div>
                </div>
              )}

              {selectedSeat && seatmapConfig?.has_seatmap && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Label>Selected Seat</Label>
                  <p className="text-lg font-bold mt-1">
                    Row {parseInt(selectedSeat.split('-')[0]) + 1}, Seat {parseInt(selectedSeat.split('-')[1]) + 1}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSeat(null)} className="mt-2">
                    Change Seat
                  </Button>
                </div>
              )}

              <div>
                <Label>Ticket Price</Label>
                <div className="text-2xl font-bold">
                  ${ticketConfig?.adult_price || '0.00'}
                </div>
              </div>

              <div>
                <Label>Optional Donation</Label>
                <Input
                  type="number"
                  value={donation}
                  onChange={(e) => setDonation(e.target.value)}
                  placeholder="Enter amount (optional)"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span>Ticket Price:</span>
                  <span>${ticketConfig?.adult_price || '0.00'}</span>
                </div>
                {donation && (
                  <div className="flex justify-between mb-4">
                    <span>Donation:</span>
                    <span>${donation}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>
                    ${(parseFloat(ticketConfig?.adult_price || '0') + parseFloat(donation || '0')).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handlePurchase} 
                className="w-full"
                size="lg"
                disabled={seatmapConfig?.has_seatmap && !selectedSeat}
              >
                {seatmapConfig?.has_seatmap && !selectedSeat ? 'Please Select a Seat First' : 'Complete Purchase'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showSeatmap && (
        <SeatmapSelector
          open={showSeatmap}
          onOpenChange={setShowSeatmap}
          eventId={eventId!}
          onSeatSelected={(seat) => {
            setSelectedSeat(seat);
            setShowSeatmap(false);
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