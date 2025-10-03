import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SpeechBubble } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

interface SponsorsCardProps {
  eventId: string;
}

export const SponsorsCard = ({ eventId }: SponsorsCardProps) => {
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/event/${eventId}/sponsors`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            <CardTitle>Sponsors</CardTitle>
          </div>
          <SpeechBubble size={40} mood="happy" color={kawaiiColor} />
        </div>
        <CardDescription>AI-found potential sponsors for your event</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          Find Sponsors
        </Button>
      </CardContent>
    </Card>
  );
};
