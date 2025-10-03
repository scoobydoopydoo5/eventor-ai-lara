import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function AttendeeEtiquette() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchTips();
    }
  }, [eventId]);

  const fetchTips = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      const { data, error } = await supabase.functions.invoke('generate-etiquette-tips', {
        body: { eventData }
      });

      if (error) throw error;
      setTips(data.tips || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading tips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/attendee/${eventId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Etiquette Tips</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {tip.category || `Tip ${index + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.isArray(tip.tips) ? (
                    tip.tips.map((t: string, idx: number) => (
                      <p key={idx} className="text-sm text-muted-foreground">• {t}</p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{tip.content || tip}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
