import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';

export default function Jokes() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [joke, setJoke] = useState('');
  const [loading, setLoading] = useState(false);

  const generateJoke = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-joke', {
        body: { theme: 'general' }
      });

      if (error) throw error;
      setJoke(data.joke);
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
          <h1 className="text-2xl font-bold text-gradient">😂 AI Jokes</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Joke Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {joke && (
              <div className="bg-primary/10 p-6 rounded-lg">
                <p className="text-lg whitespace-pre-wrap">{joke}</p>
              </div>
            )}
            
            <Button onClick={generateJoke} disabled={loading} className="w-full" size="lg">
              {loading ? (
                'Generating...'
              ) : joke ? (
                <>
                  <FiRefreshCw className="mr-2" />
                  Another One
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Joke
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}