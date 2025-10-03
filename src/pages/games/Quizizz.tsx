import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiCopy, FiUsers } from 'react-icons/fi';
import { Sparkles, Share2 } from 'lucide-react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { JoinRoomDialog } from '@/components/games/JoinRoomDialog';
import { RoomParticipants } from '@/components/games/RoomParticipants';

export default function Quizizz() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [mode, setMode] = useState<'solo' | 'multiplayer' | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | undefined>(undefined);
  
  const { 
    room, 
    participants, 
    createRoom, 
    joinRoom, 
    updateGameState, 
    updateParticipantScore 
  } = useGameRoom(currentRoomCode);

  const startMultiplayerGame = async () => {
    if (!playerName.trim() || !theme.trim()) {
      toast({ title: 'Error', description: 'Enter your name and theme', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const newRoom = await createRoom(eventId!, 'quizizz', playerName, theme);
      if (!newRoom) throw new Error('Failed to create room');
      
      setCurrentRoomCode(newRoom.room_code);
      const result = await joinRoom(newRoom.room_code, playerName, playerName);
      if (result) {
        setMyParticipantId(result.participant.id);
        setMode('multiplayer');
        await generateQuiz();
      }
    } catch (error: any) {
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

  const generateQuiz = async () => {
    if (!theme.trim()) {
      toast({ title: 'Error', description: 'Enter a theme first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { theme, count: 10 }
      });

      if (error) throw error;
      setQuestions(data.questions);
      setCurrentIndex(0);
      setShowResult(false);
      
      if (mode === 'multiplayer' && room) {
        await updateGameState(room.id, { questions: data.questions, currentIndex: 0 });
      }
      
      toast({ title: 'Success', description: 'Quiz generated!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startSoloGame = async () => {
    setMode('solo');
    await generateQuiz();
  };

  const handleAnswer = async (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === questions[currentIndex].correct;
    
    if (isCorrect && mode === 'multiplayer' && myParticipantId) {
      const myParticipant = participants.find(p => p.id === myParticipantId);
      if (myParticipant) {
        await updateParticipantScore(myParticipantId, myParticipant.score + 1);
      }
    }

    setTimeout(async () => {
      if (currentIndex < questions.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedAnswer(null);
        
        if (mode === 'multiplayer' && room) {
          await updateGameState(room.id, { ...room.game_state, currentIndex: nextIndex });
        }
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.room_code);
      toast({ title: 'Copied!', description: 'Room code copied to clipboard' });
    }
  };

  const copyInviteLink = () => {
    if (room) {
      const link = `${window.location.origin}/event/${eventId}/games/quizizz?room=${room.room_code}`;
      navigator.clipboard.writeText(link);
      toast({ title: 'Copied!', description: 'Invite link copied to clipboard' });
    }
  };

  useEffect(() => {
    if (room?.game_state?.questions) {
      setQuestions(room.game_state.questions);
    }
    if (room?.game_state?.currentIndex !== undefined) {
      setCurrentIndex(room.game_state.currentIndex);
    }
  }, [room]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
      setShowJoinDialog(true);
    }
  }, []);

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}/guests`)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">📝 Quiz Game</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!mode ? (
          <Card>
            <CardHeader>
              <CardTitle>🎮 Start New Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Name</label>
                <Input 
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <Input 
                  placeholder="e.g., Science, History, Movies..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>
              <Button onClick={startSoloGame} disabled={loading || !theme.trim()} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Play Solo
              </Button>
              <Button onClick={startMultiplayerGame} disabled={loading || !playerName.trim() || !theme.trim()} className="w-full" size="lg" variant="outline">
                <FiUsers className="mr-2 h-5 w-5" />
                Create Multiplayer Room
              </Button>
              <Button onClick={() => setShowJoinDialog(true)} className="w-full" variant="secondary">
                Join Room with Code
              </Button>
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Waiting for host to start quiz...</p>
            </CardContent>
          </Card>
        ) : !showResult ? (
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
              <div className="mb-6">
                <RoomParticipants participants={participants} hostId={room?.host_id || ''} />
              </div>
            )}
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Question {currentIndex + 1}/{questions.length}</CardTitle>
                  {mode === 'solo' && (
                    <span className="text-primary font-bold">Score: {participants.find(p => p.id === myParticipantId)?.score || 0}</span>
                  )}
                </div>
              </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-xl font-semibold">{currentQuestion?.question}</p>
              
              <div className="grid gap-3">
                {currentQuestion?.options.map((option: string, idx: number) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correct;
                  const showFeedback = selectedAnswer !== null;

                  return (
                    <Button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null}
                      variant="outline"
                      className={`h-auto p-4 text-left justify-start ${
                        showFeedback
                          ? isCorrect
                            ? 'bg-green-100 border-green-500'
                            : isSelected
                            ? 'bg-red-100 border-red-500'
                            : ''
                          : ''
                      }`}
                    >
                      <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][idx]}.</span>
                      {option}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </>
        ) : (
          <>
            {mode === 'multiplayer' && (
              <div className="mb-6">
                <RoomParticipants participants={participants} hostId={room?.host_id || ''} />
              </div>
            )}
            <Card>
              <CardContent className="text-center space-y-6 pt-6">
                <p className="text-4xl">🎉</p>
                <h2 className="text-3xl font-bold">Quiz Complete!</h2>
                {mode === 'multiplayer' && myParticipantId && (
                  <p className="text-2xl text-primary">
                    Your Score: {participants.find(p => p.id === myParticipantId)?.score || 0}/{questions.length}
                  </p>
                )}
                <Button onClick={() => { setQuestions([]); setMode(null); }} className="w-full">
                  Start New Quiz
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <JoinRoomDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onJoin={handleJoinRoom}
        loading={loading}
      />
    </div>
  );
}