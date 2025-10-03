import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';

import { sounds } from '@/utils/soundEffects';

export default function EmojiGuess() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState('movies');
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);

  const generatePuzzles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-emoji-game', {
        body: { theme, count: 10 }
      });

      if (error) throw error;
      setPuzzles(data.puzzles);
      setCurrentIndex(0);
      setShowAnswer(false);
      sounds.gameStart();
      toast({ title: 'Success', description: 'Puzzles generated!' });
    } catch (error: any) {
      sounds.wrong();
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const currentPuzzle = puzzles[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}/guests`)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">🔤 Guess from Emojis</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {puzzles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>🎮 Start New Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="movies">Movies</option>
                  <option value="songs">Songs</option>
                  <option value="books">Books</option>
                  <option value="famous people">Famous People</option>
                </select>
              </div>
              <Button onClick={generatePuzzles} disabled={loading} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {loading ? 'Generating...' : 'Start Game'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Puzzle {currentIndex + 1} of {puzzles.length}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <p className="text-6xl mb-4">{currentPuzzle?.emojis}</p>
                <p className="text-sm text-muted-foreground">Guess what this represents!</p>
              </div>
              
              {showAnswer && (
                <div className="bg-primary/10 p-4 rounded-lg text-center">
                  <p className="font-bold text-primary mb-2">Answer:</p>
                  <p className="text-xl">{currentPuzzle?.answer}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!showAnswer && (
                  <Button onClick={() => { sounds.reveal(); setShowAnswer(true); }} className="flex-1">
                    Reveal Answer
                  </Button>
                )}
                {currentIndex < puzzles.length - 1 && (
                  <Button 
                    onClick={() => {
                      sounds.next();
                      setCurrentIndex(currentIndex + 1);
                      setShowAnswer(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Next Puzzle →
                  </Button>
                )}
              </div>

              {currentIndex === puzzles.length - 1 && showAnswer && (
                <div className="text-center">
                  <Button onClick={() => { sounds.gameStart(); generatePuzzles(); }} disabled={loading}>
                    <FiRefreshCw className="mr-2" />
                    Play Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}