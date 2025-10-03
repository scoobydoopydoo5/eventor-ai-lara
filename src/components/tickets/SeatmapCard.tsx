import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

interface SeatmapCardProps {
  eventId: string;
}

export function SeatmapCard({ eventId }: SeatmapCardProps) {
  const [config, setConfig] = useState({
    has_seatmap: false,
    horizontal_seats: 10,
    vertical_seats: 10,
    blocked_seats: [] as string[]
  });
  const [seats, setSeats] = useState<string[][]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, [eventId]);

  useEffect(() => {
    generateSeats();
  }, [config.horizontal_seats, config.vertical_seats]);

  const fetchConfig = async () => {
    const { data } = await (supabase as any)
      .from('seatmap_config')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (data) {
      setConfig({
        has_seatmap: data.has_seatmap,
        horizontal_seats: data.horizontal_seats,
        vertical_seats: data.vertical_seats,
        blocked_seats: (data.blocked_seats as string[]) || []
      });
    }
  };

  const generateSeats = () => {
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

  const toggleSeat = (seatId: string) => {
    setConfig(prev => ({
      ...prev,
      blocked_seats: prev.blocked_seats.includes(seatId)
        ? prev.blocked_seats.filter(s => s !== seatId)
        : [...prev.blocked_seats, seatId]
    }));
  };

  const handleSave = async () => {
    try {
      const description = `Seatmap with ${config.horizontal_seats}x${config.vertical_seats} seats. Blocked seats: ${config.blocked_seats.join(', ')}`;
      
      const { error } = await (supabase as any).from('seatmap_config').upsert({
        event_id: eventId,
        has_seatmap: config.has_seatmap,
        horizontal_seats: config.horizontal_seats,
        vertical_seats: config.vertical_seats,
        blocked_seats: config.blocked_seats,
        seatmap_description: description
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Seatmap saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save seatmap', variant: 'destructive' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>🪑 Seatmap</CardTitle>
            <CardDescription>Configure seating arrangements</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seatmap Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Enable Seatmap</Label>
            <Switch
              checked={config.has_seatmap}
              onCheckedChange={(checked) => setConfig({ ...config, has_seatmap: checked })}
            />
          </div>

          {config.has_seatmap && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Horizontal Seats</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={config.horizontal_seats}
                    onChange={(e) => setConfig({ ...config, horizontal_seats: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div>
                  <Label>Vertical Seats</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={config.vertical_seats}
                    onChange={(e) => setConfig({ ...config, vertical_seats: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Seatmap (Click to block/unblock seats for VIP)</Label>
                <div className="border rounded-lg p-4 bg-muted">
                  {seats.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 justify-center mb-2">
                      {row.map((seatId) => (
                        <button
                          key={seatId}
                          onClick={() => toggleSeat(seatId)}
                          className={`w-8 h-8 rounded-full border-2 transition-colors ${
                            config.blocked_seats.includes(seatId)
                              ? 'bg-destructive border-destructive text-destructive-foreground'
                              : 'bg-background border-primary hover:bg-primary/10'
                          }`}
                          title={config.blocked_seats.includes(seatId) ? 'VIP Blocked' : 'Available'}
                        >
                          ●
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">Save Seatmap</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
