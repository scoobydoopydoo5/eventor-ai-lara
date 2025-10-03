import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, GripVertical } from 'lucide-react';

interface DetailsCardProps {
  eventId: string;
}

export const DetailsCard = ({ eventId }: DetailsCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
      <CardHeader>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
          <CardTitle className="flex items-center gap-2 flex-1">
            <FileText className="h-5 w-5 text-primary" />
            Details
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent onClick={() => navigate(`/event/${eventId}/details`)}>
        <p className="text-sm text-muted-foreground mb-4">
          View and edit event details including name, date, location, and more.
        </p>
        <Button variant="outline" className="w-full group">
          View Details
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};
