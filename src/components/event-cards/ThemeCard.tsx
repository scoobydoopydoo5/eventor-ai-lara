import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ThemeCard({ eventId }: { eventId: string }) {
  return (
    <Link to={`/event/${eventId}/theme`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme Ideas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI-generated creative themes for your event
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
