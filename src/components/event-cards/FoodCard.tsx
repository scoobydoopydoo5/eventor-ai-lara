import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IceCream } from 'react-kawaii';
import { useKawaiiTheme } from '@/hooks/useKawaiiTheme';

interface FoodCardProps {
  eventId: string;
}

export const FoodCard = ({ eventId }: FoodCardProps) => {
  const navigate = useNavigate();
  const { kawaiiColor } = useKawaiiTheme();

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/event/${eventId}/food`)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            <CardTitle>Food & Catering</CardTitle>
          </div>
          <IceCream size={40} mood="blissful" color={kawaiiColor} />
        </div>
        <CardDescription>AI-suggested food options for your event</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">
          View Food Suggestions
        </Button>
      </CardContent>
    </Card>
  );
};
