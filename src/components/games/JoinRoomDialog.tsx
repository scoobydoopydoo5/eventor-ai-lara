import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: (roomCode: string, playerName: string) => void;
  loading?: boolean;
}

export function JoinRoomDialog({ open, onOpenChange, onJoin, loading }: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleJoin = () => {
    if (roomCode.trim() && playerName.trim()) {
      onJoin(roomCode.toUpperCase(), playerName);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Game Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Room Code</Label>
            <Input
              placeholder="Enter 6-digit code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="uppercase"
            />
          </div>
          <div>
            <Label>Your Name</Label>
            <Input
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleJoin}
            disabled={!roomCode.trim() || !playerName.trim() || loading}
            className="w-full"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
