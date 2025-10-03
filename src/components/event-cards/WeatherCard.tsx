import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Planet } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

interface WeatherCardProps {
  eventId: string;
}

export const WeatherCard = ({ eventId }: WeatherCardProps) => {
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/event/${eventId}/weather`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <CardTitle>Weather & Preparation</CardTitle>
          </div>
          <Planet size={40} mood="blissful" color={kawaiiColor} />
        </div>
        <CardDescription>Weather forecast and event preparation tips</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          View Weather & Tips
        </Button>
      </CardContent>
    </Card>
  );
};
