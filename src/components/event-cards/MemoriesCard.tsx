import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images, ArrowRight } from 'lucide-react';
import { Browser } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

interface MemoriesCardProps {
  eventId: string;
}

export const MemoriesCard = ({ eventId }: MemoriesCardProps) => {
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary" />
            Memories
          </CardTitle>
          <Browser size={40} mood="blissful" color={kawaiiColor} />
        </div>
      </CardHeader>
      <CardContent onClick={() => navigate(`/event/${eventId}/memories`)}>
        <p className="text-sm text-muted-foreground mb-4">
          View and generate AI-powered memory images from your event
        </p>
        <Button variant="outline" className="w-full group">
          View Memories
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};
