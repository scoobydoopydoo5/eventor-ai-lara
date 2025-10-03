import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { File } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

export const BlogsCard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/event/${eventId}/blogs`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Event Blogs
          </CardTitle>
          <File size={40} mood="blissful" color={kawaiiColor} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Read and share blogs about memorable moments and highlights from your event.
        </p>
        <Button variant="outline" className="w-full group">
          View Blogs
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};
