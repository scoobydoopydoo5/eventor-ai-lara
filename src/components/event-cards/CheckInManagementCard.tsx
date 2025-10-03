import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';
import { CheckCircle } from 'lucide-react';

interface CheckInManagementCardProps {
  eventId: string;
}

export function CheckInManagementCard({ eventId }: CheckInManagementCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attendees } = useQuery({
    queryKey: ['attendees', eventId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('attendee_name');

      if (error) throw error;
      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await (supabase as any)
        .from('event_attendees')
        .update({ 
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', attendeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees', eventId] });
      toast({
        title: 'Success',
        description: 'Attendee checked in successfully',
      });
      setSelectedAttendee('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to check in attendee',
        variant: 'destructive',
      });
    },
  });

  const handleCheckIn = () => {
    if (selectedAttendee) {
      checkInMutation.mutate(selectedAttendee);
    }
  };

  const uncheckedAttendees = attendees?.filter((a: any) => !a.checked_in) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Check-In Attendees
            </CardTitle>
            <CardDescription>Manually check in attendees</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check-In Attendee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedAttendee} onValueChange={setSelectedAttendee}>
            <SelectTrigger>
              <SelectValue placeholder="Select attendee to check in" />
            </SelectTrigger>
            <SelectContent>
              {uncheckedAttendees.map((attendee: any) => (
                <SelectItem key={attendee.id} value={attendee.id}>
                  {attendee.attendee_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCheckIn} 
            disabled={!selectedAttendee || checkInMutation.isPending}
            className="w-full"
          >
            Check In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
