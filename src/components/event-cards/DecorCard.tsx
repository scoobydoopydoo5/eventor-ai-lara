import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DecorCard({ eventId }: { eventId: string }) {
  return (
    <Link to={`/event/${eventId}/decor`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Decorations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI-curated decoration ideas and shopping links
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
