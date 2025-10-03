import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { useBalloons } from '@/hooks/useBalloons';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ArrowLeft, ChevronDown, Edit, Trash2, Save, X, Sparkles, Plus } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function EventFAQs() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { spendBalloons } = useBalloons();
  const [event, setEvent] = useState<any>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchFAQs();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({ title: 'Error', description: 'Failed to load event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('event_faqs')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setFaqs(data?.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer
      })) || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const generateFAQs = async () => {
    if (!event) return;
    
    // Check and spend balloons (15 balloons for FAQ generation)
    const canProceed = await spendBalloons(15, 'FAQ Generation');
    if (!canProceed) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-faqs', {
        body: { eventData: event }
      });

      if (error) throw error;

      // Delete existing FAQs
      await supabase.from('event_faqs').delete().eq('event_id', eventId);

      // Insert new FAQs
      const { data: insertedFAQs, error: insertError } = await supabase
        .from('event_faqs')
        .insert(
          data.faqs.map((faq: any) => ({
            event_id: eventId,
            question: faq.question,
            answer: faq.answer
          }))
        )
        .select();

      if (insertError) throw insertError;

      setFaqs(insertedFAQs?.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer
      })) || []);
      
      toast({ title: 'Success', description: 'FAQs generated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      const { error } = await supabase.from('event_faqs').delete().eq('id', id);
      if (error) throw error;
      
      setFaqs(faqs.filter(f => f.id !== id));
      toast({ title: 'Deleted', description: 'FAQ deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete FAQ', variant: 'destructive' });
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const saveEdit = async (id: string) => {
    try {
      // Check if this is a new FAQ (no DB id) or existing
      const isNew = !faqs.find(f => f.id === id)?.id.includes('-');
      
      if (isNew) {
        const { data, error } = await supabase
          .from('event_faqs')
          .insert({
            event_id: eventId,
            question: editQuestion,
            answer: editAnswer
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setFaqs(faqs.map(f => f.id === id ? { id: data.id, question: editQuestion, answer: editAnswer } : f));
      } else {
        const { error } = await supabase
          .from('event_faqs')
          .update({ question: editQuestion, answer: editAnswer })
          .eq('id', id);
        
        if (error) throw error;
        
        setFaqs(faqs.map(f => f.id === id ? { ...f, question: editQuestion, answer: editAnswer } : f));
      }
      
      setEditingId(null);
      toast({ title: 'Saved', description: 'FAQ updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save FAQ', variant: 'destructive' });
    }
  };

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addNewFAQ = () => {
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    };
    const updated = [...faqs, newFAQ];
    setFaqs(updated);
    startEdit(newFAQ);
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
            <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Event FAQs</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Manage FAQs for your event attendees</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={addNewFAQ}>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
            <Button onClick={generateFAQs} disabled={generating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : faqs.length > 0 ? 'Regenerate FAQs' : 'Generate FAQs'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No FAQs yet. Generate AI-powered FAQs for your event.</p>
                <Button onClick={generateFAQs} disabled={generating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate FAQs
                </Button>
              </CardContent>
            </Card>
          ) : (
            faqs.map(faq => (
              <Card key={faq.id}>
                {editingId === faq.id ? (
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Question</label>
                      <Input
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        placeholder="Enter question"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Answer</label>
                      <Textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows={4}
                        placeholder="Enter answer"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveEdit(faq.id)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <Collapsible
                    open={openItems.has(faq.id)}
                    onOpenChange={() => toggleItem(faq.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <CollapsibleTrigger className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`h-5 w-5 transition-transform ${
                                openItems.has(faq.id) ? 'rotate-180' : ''
                              }`}
                            />
                            <h3 className="text-lg font-semibold">{faq.question}</h3>
                          </div>
                        </CollapsibleTrigger>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFAQ(faq.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent className="mt-4 ml-8">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}