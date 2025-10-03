import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { DollarSign, Users, UserCheck, Ban } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsCardProps {
  eventId: string;
}

export function AnalyticsCard({ eventId }: AnalyticsCardProps) {
  const [analytics, setAnalytics] = useState({
    totalEarnings: 0,
    totalAttendees: 0,
    activeAttendees: 0,
    bannedAttendees: 0
  });

  const [attendeesByType, setAttendeesByType] = useState<any[]>([]);
  const [earningsOverTime, setEarningsOverTime] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async () => {
    const { data: attendees } = await (supabase as any)
      .from('attendee_groups')
      .select('*')
      .eq('event_id', eventId);

    const { data: ticketConfig } = await (supabase as any)
      .from('ticket_config')
      .select('adult_price, child_price')
      .eq('event_id', eventId)
      .single();

    const totalAttendees = (attendees as any[])?.length || 0;
    const activeAttendees = (attendees as any[])?.filter((a: any) => !a.is_banned).length || 0;
    const bannedAttendees = (attendees as any[])?.filter((a: any) => a.is_banned).length || 0;
    
    // Simple earnings calculation
    const adultPrice = (ticketConfig?.adult_price as number) || 0;
    const totalEarnings = activeAttendees * Number(adultPrice);

    setAnalytics({
      totalEarnings,
      totalAttendees,
      activeAttendees,
      bannedAttendees
    });

    // Prepare chart data
    const typeCount = (attendees as any[])?.reduce((acc: any, attendee: any) => {
      const type = attendee.group_type || 'regular';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    const pieData = Object.entries(typeCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
    setAttendeesByType(pieData);

    // Mock earnings over time data (in a real app, you'd track this)
    const mockEarnings = Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      earnings: Math.floor(Math.random() * (totalEarnings / 7))
    }));
    setEarningsOverTime(mockEarnings);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>📊 Analytics</CardTitle>
            <CardDescription>View event statistics and earnings</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Event Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.totalEarnings.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalAttendees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Attendees</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeAttendees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banned Attendees</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.bannedAttendees}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Attendees by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendeesByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {attendeesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Earnings Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={earningsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="earnings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
