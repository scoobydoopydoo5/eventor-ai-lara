import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';

export default function IceBreakers() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const generateIcebreakers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-icebreaker', {
        body: { type: 'general', count: 10 }
      });

      if (error) throw error;
      setIcebreakers(data.icebreakers);
      setCurrentIndex(0);
      toast({ title: 'Success', description: 'Ice breakers generated!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}/guests`)}>
            <FiArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">🎪 Ice Breakers</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {icebreakers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>🎮 Generate Ice Breakers</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={generateIcebreakers} disabled={loading} className="w-full" size="lg">
                <Sparkles className="mr-2 h-5 w-5" />
                {loading ? 'Generating...' : 'Generate Ice Breakers'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Ice Breaker {currentIndex + 1} of {icebreakers.length}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-2xl font-semibold text-center py-8">{icebreakers[currentIndex]}</p>
              
              <div className="flex gap-2">
                {currentIndex < icebreakers.length - 1 && (
                  <Button 
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="flex-1"
                  >
                    Next →
                  </Button>
                )}
                <Button onClick={generateIcebreakers} disabled={loading} variant="outline" className="flex-1">
                  <FiRefreshCw className="mr-2" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}