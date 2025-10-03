import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, MessageSquare } from 'lucide-react';

export const FullOverviewCard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Full Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          View your comprehensive AI-generated event plan with timeline, budget estimates, vendor recommendations, and helpful site links.
        </p>
        <div className="space-y-2">
          <Button variant="outline" className="w-full group" onClick={(e) => { e.stopPropagation(); navigate(`/event/${eventId}/full-plan`); }}>
            View Full Plan
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button 
            variant="default" 
            className="w-full group" 
            onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`/event/${eventId}/chat`); 
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat with Evento AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};