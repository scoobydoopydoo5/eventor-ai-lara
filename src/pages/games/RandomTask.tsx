import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';

export default function RandomTask() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    const { data } = await supabase
      .from('attendee_groups' as any)
      .select('*')
      .eq('event_id', eventId);
    
    if (data) {
      setAttendees(data.filter((a: any) => !a.is_banned));
    }
  };

  const pickRandomPerson = async () => {
    if (attendees.length === 0) {
      toast({ title: 'Error', description: 'No attendees found', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setGameOver(false);
    try {
      const randomPerson = attendees[Math.floor(Math.random() * attendees.length)];
      setSelectedPerson(randomPerson);

      const { data, error } = await supabase.functions.invoke('generate-random-task', {
        body: { personName: randomPerson.attendee_name }
      });

      if (error) throw error;
      setTask(data.task);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = () => {
    setGameOver(true);
    toast({ 
      title: '😢 Task Refused', 
      description: `${selectedPerson?.attendee_name} loses!`,
      variant: 'destructive'
    });
  };

  const handleAccept = () => {
    setGameOver(true);
    toast({ 
      title: '🎉 Task Accepted', 
      description: `${selectedPerson?.attendee_name} is up for the challenge!`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}/guests`)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">🎲 Random Task</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Random Task Challenge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedPerson ? (
              <Button onClick={pickRandomPerson} disabled={loading} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {loading ? 'Selecting...' : 'Pick Random Person'}
              </Button>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <p className="text-4xl">🎯</p>
                  <h2 className="text-2xl font-bold text-primary">
                    {selectedPerson.attendee_name}
                  </h2>
                  {task && (
                    <div className="bg-primary/10 p-6 rounded-lg">
                      <p className="text-lg font-semibold">Your Task:</p>
                      <p className="text-xl mt-2">{task}</p>
                    </div>
                  )}
                </div>

                {!gameOver && task && (
                  <div className="flex gap-2">
                    <Button onClick={handleAccept} className="flex-1">
                      ✓ Accept Challenge
                    </Button>
                    <Button onClick={handleRefuse} variant="destructive" className="flex-1">
                      ✗ Refuse (Lose)
                    </Button>
                  </div>
                )}

                {gameOver && (
                  <Button onClick={() => {
                    setSelectedPerson(null);
                    setTask('');
                  }} variant="outline" className="w-full">
                    <FiRefreshCw className="mr-2" />
                    Pick Another Person
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}