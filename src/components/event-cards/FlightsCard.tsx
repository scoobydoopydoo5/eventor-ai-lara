import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiNavigation } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export function FlightsCard({ eventId }: { eventId: string }) {
  return (
    <Link to={`/event/${eventId}/flights`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiNavigation className="h-5 w-5 text-primary" />
            Flights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Find flight options to the event location
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
