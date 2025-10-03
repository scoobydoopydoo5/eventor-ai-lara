import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameParticipant } from '@/hooks/useGameRoom';
import { Users } from 'lucide-react';

interface RoomParticipantsProps {
  participants: GameParticipant[];
  hostId: string;
}

export function RoomParticipants({ participants, hostId }: RoomParticipantsProps) {
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Players ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedParticipants.map((participant, index) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">#{index + 1}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{participant.participant_name}</span>
                    {participant.participant_id === hostId && (
                      <Badge variant="secondary">Host</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {participant.score} pts
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
