import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowRight, FiLoader, FiZap, FiFileText, FiArrowLeft } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';

export default function AttendeeCreateModes() {
  const { eventId } = useParams();
  const [mode, setMode] = useState<'normal' | 'quick' | 'super-quick' | null>(null);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [superQuickName, setSuperQuickName] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuickCreate = async () => {
    if (mode === 'quick' && !quickPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please describe your attendance plan",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'super-quick' && !superQuickName.trim()) {
      toast({
        title: "Empty name",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    toast({
      title: "Generating plan...",
      description: "AI is creating your attendee plan",
    });

    try {
      let finalEventId = eventId;
      let eventData;

      // Check if this is a custom event (not a valid UUID)
      if (eventId === 'custom') {
        // Create a new custom event
        const { data: newEvent, error: createError } = await (supabase as any)
          .from('events')
          .insert({
            name: mode === 'quick' ? 'Custom Event' : `${superQuickName}'s Event`,
            event_type: 'other',
            plan_mode: 'attendee',
            event_date: new Date(2025, new Date().getMonth(), new Date().getDate() + 4).toISOString().split('T')[0],
            user_id: null,
          })
          .select()
          .single();

        if (createError) throw createError;
        eventData = newEvent as any;
        finalEventId = (newEvent as any).id;
      } else {
        // Fetch existing event data
        const { data: existingEvent, error: eventError } = await (supabase as any)
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        eventData = existingEvent;
      }

      // Generate attendee plan
      const eventSummary = `${eventData.event_type} event on ${eventData.event_date} at ${eventData.location_name || 'TBA'}`;
      const { data: planData, error: planError } = await supabase.functions.invoke('generate-attendee-plan', {
        body: { 
          eventData,
          attendeeData: mode === 'quick' 
            ? { attendee_name: 'Guest', notes: quickPrompt, event_summary: eventSummary }
            : { attendee_name: superQuickName, event_summary: eventSummary }
        }
      });

      if (planError) throw planError;

      // Store plan
      const { error: insertError } = await (supabase as any)
        .from('attendee_plans')
        .insert({
          event_id: finalEventId,
          attendee_name: mode === 'quick' ? 'Guest' : superQuickName,
          plan_data: planData,
          outfit_suggestions: planData?.outfits || [],
          prep_checklist: planData?.prep || [],
          gift_ideas: planData?.gifts || [],
          budget_breakdown: planData?.budget || {},
        });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your attendee plan has been created",
      });
      
      navigate(`/attendee/${finalEventId}`);
    } catch (error: any) {
      console.error('Error creating attendee plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate plan",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">How would you like to plan your attendance?</h2>
        <p className="text-muted-foreground">Choose the method that works best for you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card
          className="p-6 cursor-pointer hover:border-primary transition-smooth"
          onClick={() => navigate(`/attendee-create/${eventId}`)}
        >
          <FiFileText className="h-12 w-12 mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Normal Mode</h3>
          <p className="text-sm text-muted-foreground">
            Fill in all details step by step
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-smooth"
          onClick={() => setMode('quick')}
        >
          <FiZap className="h-12 w-12 mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Quick Prompt</h3>
          <p className="text-sm text-muted-foreground">
            Describe your plans and let AI fill everything
          </p>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-smooth"
          onClick={() => setMode('super-quick')}
        >
          <FiLoader className="h-12 w-12 mb-4 text-primary" />
          <h3 className="font-semibold mb-2">Super-Quick</h3>
          <p className="text-sm text-muted-foreground">
            Just your name and AI generates everything
          </p>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient">Create Attendee Plan</h1>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {mode === null ? (
          <Card className="p-6 shadow-card animate-fade-in">
            {renderModeSelection()}
          </Card>
        ) : mode === 'quick' ? (
          <Card className="p-6 shadow-card animate-fade-in">
            <Button variant="ghost" onClick={() => setMode(null)} className="mb-4">
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Describe Your Plans</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tell us about how you plan to attend and what you need
                </p>
                <Textarea
                  placeholder="E.g., I'm attending with my partner, need outfit ideas for semi-formal, budget is $200..."
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  rows={6}
                />
              </div>
              <Button onClick={handleQuickCreate} disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Generate Plan
                    <FiArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 shadow-card animate-fade-in">
            <Button variant="ghost" onClick={() => setMode(null)} className="mb-4">
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Enter Your Name</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Just your name, AI will handle the rest
                </p>
                <Input
                  placeholder="E.g., John Smith"
                  value={superQuickName}
                  onChange={(e) => setSuperQuickName(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button onClick={handleQuickCreate} disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <FiLoader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Generate Plan
                    <FiArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
