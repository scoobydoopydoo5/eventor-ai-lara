import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { ConfettiButton } from "@/components/ConfettiButton";

interface EventoChatCardProps {
  eventId: string;
}

export const EventoChatCard = ({ eventId }: EventoChatCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-card hover:shadow-elegant transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chat with Evento AI
        </CardTitle>
        <CardDescription>
          Get instant AI assistance for your event planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfettiButton
          onClick={() => navigate(`/event/${eventId}/chat`)}
          className="w-full"
          rewardType="balloons"
        >
          Start Chat
        </ConfettiButton>
      </CardContent>
    </Card>
  );
};
