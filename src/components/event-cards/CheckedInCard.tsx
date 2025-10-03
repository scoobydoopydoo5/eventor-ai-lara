import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-typed';

interface CheckedInCardProps {
  eventId: string;
}

export function CheckedInCard({ eventId }: CheckedInCardProps) {
  const { data: attendees } = useQuery({
    queryKey: ['attendees-status', eventId],
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

  const checkedInCount = attendees?.filter((a: any) => a.checked_in).length || 0;
  const totalCount = attendees?.length || 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>✅ Check-In Status</CardTitle>
            <CardDescription>
              {checkedInCount} of {totalCount} attendees checked in
            </CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendee Check-In Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {attendees?.map((attendee: any) => (
            <div
              key={attendee.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {attendee.checked_in ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">{attendee.attendee_name}</span>
              </div>
              <Badge variant={attendee.checked_in ? 'default' : 'secondary'}>
                {attendee.checked_in ? 'Checked In' : 'Not Checked In'}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
