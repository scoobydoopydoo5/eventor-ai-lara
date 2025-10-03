import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Backpack } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

interface SouvenirsCardProps {
  eventId: string;
}

export const SouvenirsCard = ({ eventId }: SouvenirsCardProps) => {
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/event/${eventId}/souvenirs`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <CardTitle>Swag Bags & Souvenirs</CardTitle>
          </div>
          <Backpack size={40} mood="excited" color={kawaiiColor} />
        </div>
        <CardDescription>AI-suggested souvenir ideas for attendees</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          View Souvenir Ideas
        </Button>
      </CardContent>
    </Card>
  );
};
