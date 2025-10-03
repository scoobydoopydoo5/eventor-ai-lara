import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiRefreshCw, FiCopy, FiUsers } from 'react-icons/fi';
import { Sparkles, Share2 } from 'lucide-react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { JoinRoomDialog } from '@/components/games/JoinRoomDialog';
import { RoomParticipants } from '@/components/games/RoomParticipants';
import { sounds } from '@/utils/soundEffects';

export default function Jeopardy() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState('');
  const [board, setBoard] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [mode, setMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | undefined>(undefined);
  
  const { 
    room, 
    participants, 
    createRoom, 
    joinRoom, 
    updateGameState, 
    updateParticipantScore,
    leaveRoom 
  } = useGameRoom(currentRoomCode);

  const startMultiplayerGame = async () => {
    if (!playerName.trim()) {
      toast({ title: 'Error', description: 'Enter your name first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const newRoom = await createRoom(eventId!, 'jeopardy', playerName, theme || 'general knowledge');
      if (!newRoom) throw new Error('Failed to create room');
      
      setCurrentRoomCode(newRoom.room_code);
      const result = await joinRoom(newRoom.room_code, playerName, playerName);
      if (result) {
        setMyParticipantId(result.participant.id);
        setMode('multiplayer');
        await generateBoard();
      }
    } catch (error: any) {
      sounds.wrong();
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (code: string, name: string) => {
    setCurrentRoomCode(code);
    const result = await joinRoom(code, name, name);
    if (result) {
      setPlayerName(name);
      setMyParticipantId(result.participant.id);
      setMode('multiplayer');
      setShowJoinDialog(false);
    }
  };

  const generateBoard = async () => {
    if (!playerName.trim()) {
      toast({ title: 'Error', description: 'Enter your name first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-jeopardy', {
        body: { theme: theme || 'general knowledge' }
      });

      if (error) throw error;
      setBoard(data);
      setAnsweredQuestions(new Set());
      
      if (mode === 'multiplayer' && room) {
        await updateGameState(room.id, { board: data, answeredQuestions: [] });
      }
      
      sounds.gameStart();
      toast({ title: 'Success', description: 'Board generated!' });
    } catch (error: any) {
      sounds.wrong();
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startSoloGame = async () => {
    setMode('solo');
    await generateBoard();
  };

  const handleQuestionClick = (category: string, question: any) => {
    const key = `${category}-${question.points}`;
    if (!answeredQuestions.has(key)) {
      sounds.reveal();
      setSelectedQuestion({ ...question, category, key });
      setShowAnswer(false);
    }
  };

  const handleCorrect = async () => {
    if (selectedQuestion && playerName) {
      sounds.correct();
      
      if (mode === 'multiplayer' && myParticipantId && room) {
        const myParticipant = participants.find(p => p.id === myParticipantId);
        if (myParticipant) {
          await updateParticipantScore(myParticipantId, myParticipant.score + selectedQuestion.points);
        }
        
        const newAnswered = [...answeredQuestions, selectedQuestion.key];
        setAnsweredQuestions(new Set(newAnswered));
        await updateGameState(room.id, { ...room.game_state, answeredQuestions: newAnswered });
      } else {
        const myParticipant = participants.find(p => p.participant_name === playerName);
        if (myParticipant) {
          await updateParticipantScore(myParticipant.id, myParticipant.score + selectedQuestion.points);
        }
      }
      
      setAnsweredQuestions(prev => new Set([...prev, selectedQuestion.key]));
      setSelectedQuestion(null);
    }
  };

  const handleWrong = async () => {
    if (selectedQuestion) {
      sounds.wrong();
      
      if (mode === 'multiplayer' && room) {
        const newAnswered = [...answeredQuestions, selectedQuestion.key];
        setAnsweredQuestions(new Set(newAnswered));
        await updateGameState(room.id, { ...room.game_state, answeredQuestions: newAnswered });
      } else {
        setAnsweredQuestions(prev => new Set([...prev, selectedQuestion.key]));
      }
      
      setSelectedQuestion(null);
    }
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.room_code);
      toast({ title: 'Copied!', description: 'Room code copied to clipboard' });
    }
  };

  const copyInviteLink = () => {
    if (room) {
      const link = `${window.location.origin}/event/${eventId}/games/jeopardy?room=${room.room_code}`;
      navigator.clipboard.writeText(link);
      toast({ title: 'Copied!', description: 'Invite link copied to clipboard' });
    }
  };

  useEffect(() => {
    if (room?.game_state?.board) {
      setBoard(room.game_state.board);
    }
    if (room?.game_state?.answeredQuestions) {
      setAnsweredQuestions(new Set(room.game_state.answeredQuestions));
    }
  }, [room]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
      setShowJoinDialog(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}/guests`)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">🎯 Jeopardy</h1>
          <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
            ⚙️
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!mode ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="space-y-4 pt-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Name</label>
                <Input 
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Theme (optional)</label>
                <Input 
                  placeholder="e.g., Science, History..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>
              <Button onClick={startSoloGame} disabled={loading || !playerName.trim()} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Play Solo
              </Button>
              <Button onClick={startMultiplayerGame} disabled={loading || !playerName.trim()} className="w-full" size="lg" variant="outline">
                <FiUsers className="mr-2 h-5 w-5" />
                Create Multiplayer Room
              </Button>
              <Button onClick={() => setShowJoinDialog(true)} className="w-full" variant="secondary">
                Join Room with Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {mode === 'multiplayer' && room && (
              <div className="mb-6 flex justify-center gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Room Code</p>
                      <p className="text-2xl font-bold">{room.room_code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyRoomCode}>
                        <FiCopy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyInviteLink}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {mode === 'multiplayer' && (
              <div className="mb-6 max-w-md mx-auto">
                <RoomParticipants participants={participants} hostId={room?.host_id || ''} />
              </div>
            )}

            <div className="grid grid-cols-5 gap-2 mb-6">
              {board.categories?.map((cat: any, idx: number) => (
                <div key={idx}>
                  <div className="bg-primary text-primary-foreground p-4 rounded-t-lg text-center font-bold">
                    {cat.name}
                  </div>
                  {cat.questions?.map((q: any) => {
                    const key = `${cat.name}-${q.points}`;
                    const isAnswered = answeredQuestions.has(key);
                    return (
                      <Button
                        key={q.points}
                        onClick={() => handleQuestionClick(cat.name, q)}
                        disabled={isAnswered}
                        variant={isAnswered ? 'secondary' : 'outline'}
                        className="w-full h-16 mt-2"
                      >
                        ${q.points}
                      </Button>
                    );
                  })}
                </div>
              ))}
            </div>

            <Button onClick={() => { setBoard(null); setMode(null); }} variant="outline" className="mx-auto block">
              <FiRefreshCw className="mr-2" />
              New Game
            </Button>
          </>
        )}
      </div>

      <JoinRoomDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onJoin={handleJoinRoom}
        loading={loading}
      />

      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedQuestion?.category} - ${selectedQuestion?.points}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-lg font-semibold">{selectedQuestion?.question}</p>
            
            {showAnswer && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="font-bold mb-2">Answer:</p>
                <p>{selectedQuestion?.answer}</p>
              </div>
            )}

            {!showAnswer ? (
              <Button onClick={() => { sounds.reveal(); setShowAnswer(true); }} className="w-full">
                Reveal Answer
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCorrect} className="flex-1">
                  ✓ Correct
                </Button>
                <Button onClick={handleWrong} variant="outline" className="flex-1">
                  ✗ Wrong
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Settings</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Jeopardy-style game with AI-generated questions and categories. Click on dollar amounts to answer questions.
          </p>
          <Button onClick={() => setShowSettings(false)} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}