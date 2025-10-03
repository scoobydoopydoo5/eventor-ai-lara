import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ConfettiButton } from '@/components/ConfettiButton';

export default function CheckIn() {
  const { attendeeName, eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, [attendeeName, eventId]);

  const checkStatus = async () => {
    const { data } = await (supabase as any)
      .from('event_attendees')
      .select('checked_in')
      .eq('event_id', eventId)
      .eq('attendee_name', decodeURIComponent(attendeeName || ''))
      .single();

    if (data) {
      setIsCheckedIn((data as any).checked_in);
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    const { error } = await (supabase as any)
      .from('event_attendees')
      .update({ 
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('attendee_name', decodeURIComponent(attendeeName || ''));

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to check in',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckedIn(true);
    toast({
      title: 'Success!',
      description: `${decodeURIComponent(attendeeName || '')} has been checked in`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-12 text-center space-y-8">
          <h1 className="text-6xl font-bold text-gradient">
            {decodeURIComponent(attendeeName || '')}
          </h1>
          
          {isCheckedIn ? (
            <div className="space-y-6">
              <CheckCircle className="h-32 w-32 text-green-500 mx-auto" />
              <p className="text-3xl font-semibold text-green-600">Already Checked In!</p>
              <Button size="lg" onClick={() => navigate(`/event/${eventId}`)}>
                Go to Event
              </Button>
            </div>
          ) : (
            <ConfettiButton
              onClick={handleCheckIn}
              size="lg"
              className="text-2xl py-8 px-12 h-auto"
            >
              Check In
            </ConfettiButton>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
