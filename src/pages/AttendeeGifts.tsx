import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ArrowLeft, Gift, Plus, Trash2, Send, Sparkles } from 'lucide-react';

export default function AttendeeGifts() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<any>(null);
  const [addedGifts, setAddedGifts] = useState<any[]>([]);
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
        gift_ideas: pd.gift_ideas || []
      });
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGift = (gift: any) => {
    setAddedGifts([...addedGifts, { ...gift, id: Date.now() }]);
    toast({ title: 'Gift added', description: 'Gift added to your list' });
  };

  const removeGift = (id: number) => {
    setAddedGifts(addedGifts.filter(g => g.id !== id));
  };

  const totalCost = addedGifts.reduce((sum, gift) => {
    const price = parseFloat(gift.average_price || gift.price || 0);
    return sum + price;
  }, 0);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gift-chat', {
        body: { 
          messages: [...chatMessages, userMessage],
          eventData: plan?.plan_data,
          attendeeData: {
            gender: plan?.plan_data?.gender,
            gift_budget: plan?.plan_data?.gift_budget
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
            <h1 className="text-2xl font-bold text-gradient">Gift Suggestions</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* AI Suggestions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              AI Suggestions
            </h2>
            {plan?.gift_ideas?.map((gift: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{gift.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{gift.description}</p>
                  {gift.where_to_buy && (
                    <p className="text-sm mb-2">
                      <strong>Where:</strong> {gift.where_to_buy}
                    </p>
                  )}
                  {gift.link && (
                    <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mb-2">
                      View Online →
                    </a>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">${gift.average_price || gift.price_range}</Badge>
                    <Button size="sm" onClick={() => addGift(gift)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Added Gifts & Chat */}
          <div className="space-y-6">
            {/* Added Gifts */}
            <Card>
              <CardHeader>
                <CardTitle>Your Gift List</CardTitle>
              </CardHeader>
              <CardContent>
                {addedGifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No gifts added yet</p>
                ) : (
                  <div className="space-y-3">
                    {addedGifts.map((gift) => (
                      <div key={gift.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex-1">
                          <p className="font-medium">{gift.name}</p>
                          <p className="text-sm text-muted-foreground">${gift.average_price || gift.price}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeGift(gift.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2 border-t font-bold flex justify-between">
                      <span>Total:</span>
                      <span>${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ask AI About Gifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64 overflow-y-auto space-y-3 border rounded-lg p-3">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ask me anything about gift ideas!</p>
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
                      placeholder="Ask about gifts..."
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
