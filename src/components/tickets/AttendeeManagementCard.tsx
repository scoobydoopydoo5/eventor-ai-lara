import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Ban } from 'lucide-react';

interface AttendeeManagementCardProps {
  eventId: string;
}

export function AttendeeManagementCard({ eventId }: AttendeeManagementCardProps) {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [newAttendee, setNewAttendee] = useState({
    name: '',
    phone: '',
    password: '',
    group: 'regular'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendees();
  }, [eventId]);

  const fetchAttendees = async () => {
    const { data } = await (supabase as any)
      .from('attendee_groups')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    setAttendees(data || []);
  };

  const handleAddAttendee = async () => {
    if (!newAttendee.name) {
      toast({ title: 'Error', description: 'Please enter attendee name', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await (supabase as any).from('attendee_groups').insert({
        event_id: eventId,
        attendee_name: newAttendee.name,
        phone_number: newAttendee.phone,
        password: newAttendee.password,
        group_type: newAttendee.group
      });

      if (error) throw error;

      setNewAttendee({ name: '', phone: '', password: '', group: 'regular' });
      fetchAttendees();
      toast({ title: 'Success', description: 'Attendee added' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add attendee', variant: 'destructive' });
    }
  };

  const handleBanAttendee = async (id: string, currentBanStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('attendee_groups')
        .update({ is_banned: !currentBanStatus })
        .eq('id', id);

      if (error) throw error;

      fetchAttendees();
      toast({ title: 'Success', description: `Attendee ${!currentBanStatus ? 'banned' : 'unbanned'}` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update attendee', variant: 'destructive' });
    }
  };

  const handleDeleteAttendee = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('attendee_groups').delete().eq('id', id);

      if (error) throw error;

      fetchAttendees();
      toast({ title: 'Success', description: 'Attendee removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove attendee', variant: 'destructive' });
    }
  };

  const filterAttendees = (type: string) => {
    return attendees.filter(a => a.group_type === type);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>👥 Manage Attendees</CardTitle>
            <CardDescription>Add and manage event attendees</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendee Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={newAttendee.name}
                onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                placeholder="Attendee name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newAttendee.phone}
                onChange={(e) => setNewAttendee({ ...newAttendee, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Password (VIP/Admin)</Label>
              <Input
                type="password"
                value={newAttendee.password}
                onChange={(e) => setNewAttendee({ ...newAttendee, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <div>
              <Label>Group</Label>
              <Select value={newAttendee.group} onValueChange={(value) => setNewAttendee({ ...newAttendee, group: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddAttendee} className="w-full">Add Attendee</Button>

          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="vip">VIP</TabsTrigger>
              <TabsTrigger value="invited">Invited</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="regular">Regular</TabsTrigger>
            </TabsList>

            {['all', 'vip', 'invited', 'admin', 'regular'].map(type => (
              <TabsContent key={type} value={type}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(type === 'all' ? attendees : filterAttendees(type)).map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell>{attendee.attendee_name}</TableCell>
                        <TableCell>{attendee.phone_number || '-'}</TableCell>
                        <TableCell className="capitalize">{attendee.group_type}</TableCell>
                        <TableCell>{attendee.is_banned ? '🚫 Banned' : '✅ Active'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleBanAttendee(attendee.id, attendee.is_banned)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => handleDeleteAttendee(attendee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
