import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ArrowLeft, Shirt, Send, Sparkles } from 'lucide-react';

export default function AttendeeOutfits() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchPlan();
    }
  }, [eventId]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('attendee_plans')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) throw error;
      
      // The plan_data contains the AI-generated data
      const pd: any = (data as any)?.plan_data || {};
      setPlan({
        ...data,
        plan_data: pd,
        outfit_suggestions: pd.outfit_suggestions || []
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('outfit-chat', {
        body: { 
          messages: [...chatMessages, userMessage],
          eventData: plan?.plan_data,
          attendeeData: {
            gender: plan?.plan_data?.gender,
            outfit_style: plan?.plan_data?.outfit_style
          }
        }
      });

      if (error) throw error;
      setChatMessages([...chatMessages, userMessage, { role: 'assistant', content: data.message }]);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
            <h1 className="text-2xl font-bold text-gradient">Outfit Suggestions</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Suggestions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shirt className="h-6 w-6 text-primary" />
              AI Outfit Ideas
            </h2>
            {plan?.outfit_suggestions?.map((outfit: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{outfit.name || `Option ${index + 1}`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{outfit.description}</p>
                  {outfit.items && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Items:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {outfit.items.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Chat */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ask AI About Outfits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto space-y-3 border rounded-lg p-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ask me anything about outfit ideas!</p>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted p-3 rounded-lg">Thinking...</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about outfits..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    />
                    <Button onClick={sendChatMessage} disabled={chatLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
