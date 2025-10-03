import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

interface SeatmapSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSeatSelected: (seat: string) => void;
}

export function SeatmapSelector({ open, onOpenChange, eventId, onSeatSelected }: SeatmapSelectorProps) {
  const [config, setConfig] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seats, setSeats] = useState<string[][]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && eventId) {
      fetchConfig();
    }
  }, [open, eventId]);

  const fetchConfig = async () => {
    const { data } = await (supabase as any)
      .from('seatmap_config')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (data) {
      setConfig(data);
      generateSeats(data);
    }
  };

  const generateSeats = (config: any) => {
    const newSeats: string[][] = [];
    for (let row = 0; row < config.vertical_seats; row++) {
      const rowSeats: string[] = [];
      for (let col = 0; col < config.horizontal_seats; col++) {
        rowSeats.push(`${row}-${col}`);
      }
      newSeats.push(rowSeats);
    }
    setSeats(newSeats);
  };

  const handleAIRecommendation = async () => {
    if (!config) return;

  const { data: eventData } = await (supabase as any)
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    // Simple AI recommendation logic
    const blockedSeats = config.blocked_seats || [];
    const availableSeats: string[] = [];
    
    seats.forEach((row, rowIndex) => {
      row.forEach((seatId) => {
        if (!blockedSeats.includes(seatId)) {
          availableSeats.push(seatId);
        }
      });
    });

    if (availableSeats.length === 0) {
      toast({
        title: 'No seats available',
        description: 'All seats are taken or blocked',
        variant: 'destructive'
      });
      return;
    }

    // Recommend middle seats as they usually have the best view
    const middleRow = Math.floor(config.vertical_seats / 2);
    const middleCol = Math.floor(config.horizontal_seats / 2);
    const idealSeat = `${middleRow}-${middleCol}`;
    
    let recommendedSeat = idealSeat;
    if (blockedSeats.includes(idealSeat)) {
      // Find closest available seat
      recommendedSeat = availableSeats[Math.floor(availableSeats.length / 2)];
    }

    setSelectedSeat(recommendedSeat);
    toast({
      title: 'AI Recommendation',
      description: `We recommend seat ${recommendedSeat.replace('-', ', Column ')} for the best experience!`
    });
  };

  const isSeatBlocked = (seatId: string) => {
    return config?.blocked_seats?.includes(seatId);
  };

  const handleConfirm = () => {
    if (selectedSeat) {
      onSeatSelected(selectedSeat);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Your Seat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary border-2 border-primary" />
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-destructive border-2 border-destructive" />
                <span className="text-sm">VIP/Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent border-2 border-accent" />
                <span className="text-sm">Selected</span>
              </div>
            </div>
            <Button onClick={handleAIRecommendation} variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Recommend
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-muted">
            <div className="text-center mb-4">
              <div className="inline-block px-8 py-2 bg-primary text-primary-foreground rounded">
                STAGE
              </div>
            </div>
            {seats.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 justify-center mb-2">
                {row.map((seatId) => (
                  <button
                    key={seatId}
                    onClick={() => !isSeatBlocked(seatId) && setSelectedSeat(seatId)}
                    disabled={isSeatBlocked(seatId)}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      isSeatBlocked(seatId)
                        ? 'bg-destructive border-destructive text-destructive-foreground cursor-not-allowed'
                        : selectedSeat === seatId
                        ? 'bg-accent border-accent text-accent-foreground'
                        : 'bg-background border-primary hover:bg-primary/10'
                    }`}
                    title={`Row ${rowIndex + 1}, Seat ${seatId.split('-')[1]}`}
                  >
                    ●
                  </button>
                ))}
              </div>
            ))}
          </div>

          {selectedSeat && (
            <div className="text-center">
              <p className="font-medium">Selected: Row {parseInt(selectedSeat.split('-')[0]) + 1}, Seat {parseInt(selectedSeat.split('-')[1]) + 1}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleConfirm} disabled={!selectedSeat} className="flex-1">
              Confirm Selection
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}