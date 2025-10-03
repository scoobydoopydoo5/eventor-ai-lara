import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiMail as Mail, FiSend as Send, FiUsers as Users, FiCheck as Check, FiX as X, FiClock as Clock } from 'react-icons/fi';

const mockInvites = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'accepted' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'declined' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', status: 'accepted' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', status: 'pending' },
];

export function InvitesCard() {
  const accepted = mockInvites.filter((i) => i.status === 'accepted').length;
  const pending = mockInvites.filter((i) => i.status === 'pending').length;
  const declined = mockInvites.filter((i) => i.status === 'declined').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-3 w-3" />;
      case 'declined':
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'declined':
        return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default:
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invitations
          </CardTitle>
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            Send Invites
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg border border-border bg-green-500/10">
            <Users className="h-5 w-5 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{accepted}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </div>
          <div className="text-center p-4 rounded-lg border border-border bg-yellow-500/10">
            <Clock className="h-5 w-5 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center p-4 rounded-lg border border-border bg-red-500/10">
            <X className="h-5 w-5 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Guest List</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-smooth"
              >
                <div className="flex-1">
                  <p className="font-medium">{invite.name}</p>
                  <p className="text-sm text-muted-foreground">{invite.email}</p>
                </div>
                <Badge className={getStatusColor(invite.status)}>
                  {getStatusIcon(invite.status)}
                  <span className="ml-1 capitalize">{invite.status}</span>
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2">
            <Mail className="h-4 w-4" />
            Email Preview
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Send className="h-4 w-4" />
            Send Reminder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
