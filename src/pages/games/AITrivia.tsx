import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';

import { sounds } from '@/utils/soundEffects';

export default function AITrivia() {
  const { eventId, roomCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-trivia', {
        body: { theme: theme || 'general knowledge', count: 10 }
      });

      if (error) throw error;
      setQuestions(data.questions);
      setCurrentIndex(0);
      setShowAnswer(false);
      sounds.gameStart();
      toast({ title: 'Success', description: 'Questions generated!' });
    } catch (error: any) {
      sounds.wrong();
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}/guests`)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">🧠 AI Trivia</h1>
          <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
            ⚙️
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {questions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>🎮 Start New Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme (optional)</label>
                <Input 
                  placeholder="e.g., Science, History, Pop Culture..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>
              <Button onClick={generateQuestions} disabled={loading} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {loading ? 'Generating...' : 'Start Trivia'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Question {currentIndex + 1} of {questions.length}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xl font-semibold">{currentQuestion?.question}</p>
                
                {showAnswer && (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="font-bold text-primary mb-2">Answer:</p>
                    <p className="text-lg">{currentQuestion?.answer}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!showAnswer && (
                    <Button onClick={() => { sounds.reveal(); setShowAnswer(true); }} className="flex-1">
                      Reveal Answer
                    </Button>
                  )}
                  {currentIndex < questions.length - 1 && (
                    <Button 
                      onClick={() => {
                        sounds.next();
                        setCurrentIndex(currentIndex + 1);
                        setShowAnswer(false);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Next Question →
                    </Button>
                  )}
                </div>

                {currentIndex === questions.length - 1 && showAnswer && (
                  <div className="text-center space-y-4">
                    <p className="text-2xl font-bold text-primary">🎉 Game Complete!</p>
                    <Button onClick={() => { sounds.gameStart(); generateQuestions(); }} disabled={loading}>
                      <FiRefreshCw className="mr-2" />
                      Play Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={() => setQuestions([])} variant="outline" className="w-full">
              Start New Game
            </Button>
          </>
        )}
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI Trivia generates questions using AI. You can customize the theme before starting a new game.
            </p>
            <Button onClick={() => setShowSettings(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}