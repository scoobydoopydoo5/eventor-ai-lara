import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-typed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function EventWinner() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const [winner, setWinner] = useState('');

  const { data: attendees } = useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      return data;
    },
  });

  const { data: winnerData, isLoading } = useQuery({
    queryKey: ['event-winner', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_winners')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const updateWinnerMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (winnerData) {
        const { error } = await supabase
          .from('event_winners')
          .update(updates)
          .eq('event_id', eventId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_winners')
          .insert({
            event_id: eventId,
            winner_name: '',
            ...updates,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-winner', eventId] });
    },
  });

  const customNames = (winnerData?.custom_names || []) as string[];
  const allNames = [
    ...(attendees?.map(a => a.attendee_name) || []),
    ...customNames,
  ];

  const addCustomName = () => {
    if (!newName.trim()) return;
    
    const updated = [...customNames, newName.trim()];
    updateWinnerMutation.mutate({ custom_names: updated });
    setNewName('');
    toast({ title: 'Name added successfully!' });
  };

  const removeCustomName = (name: string) => {
    const updated = customNames.filter(n => n !== name);
    updateWinnerMutation.mutate({ custom_names: updated });
    toast({ title: 'Name removed successfully!' });
  };

  const spinWheel = () => {
    if (allNames.length === 0) {
      toast({
        title: 'Error',
        description: 'No names available to spin',
        variant: 'destructive',
      });
      return;
    }

    setIsSpinning(true);
    setWinner('');
    let count = 0;
    const spinDuration = 3000;
    const interval = 100;
    
    const spinInterval = setInterval(() => {
      const randomName = allNames[Math.floor(Math.random() * allNames.length)];
      setCurrentName(randomName);
      count += interval;
      
      if (count >= spinDuration) {
        clearInterval(spinInterval);
        const finalWinner = allNames[Math.floor(Math.random() * allNames.length)];
        setWinner(finalWinner);
        setIsSpinning(false);
        
        updateWinnerMutation.mutate({ winner_name: finalWinner });
        toast({
          title: '🎉 We have a winner!',
          description: finalWinner,
        });
      }
    }, interval);
  };

  useEffect(() => {
    if (winnerData?.winner_name) {
      setWinner(winnerData.winner_name);
    }
  }, [winnerData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/event/${eventId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Event Winner Spinner
          </h1>
          <p className="text-muted-foreground">
            Spin to randomly select a winner from attendees
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Spinner Card */}
          <Card>
            <CardHeader>
              <CardTitle>Spinner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!winner ? (
                <>
                  <div className="bg-muted rounded-lg p-12 text-center min-h-[200px] flex items-center justify-center">
                    {isSpinning ? (
                      <div className="text-4xl font-bold animate-pulse">
                        {currentName}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Click spin to select a winner
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={spinWheel}
                    disabled={isSpinning || allNames.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    {isSpinning ? 'Spinning...' : 'Spin!'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-primary/10 rounded-lg p-12 text-center min-h-[200px] flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-sm text-muted-foreground mb-2">Winner</div>
                    <div className="text-4xl font-bold">{winner}</div>
                  </div>
                  
                  <Button
                    onClick={() => {
                      setWinner('');
                      setCurrentName('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Spin Again
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Participants Card */}
          <Card>
            <CardHeader>
              <CardTitle>Participants ({allNames.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomName()}
                />
                <Button onClick={addCustomName}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {attendees?.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{attendee.attendee_name}</span>
                    <span className="text-xs text-muted-foreground">From attendees</span>
                  </div>
                ))}
                
                {customNames.map((name, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomName(name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
