import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';

export default function AttendeeGuide() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [guide, setGuide] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchGuide();
    }
  }, [eventId]);

  const fetchGuide = async () => {
    try {
      const { data: planData } = await supabase
        .from('attendee_plans')
        .select('*')
        .eq('event_id', eventId)
        .single();

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      const { data, error } = await supabase.functions.invoke('generate-guest-guide', {
        body: { eventData, attendeeData: planData }
      });

      if (error) throw error;
      setGuide(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading guide...</p>
      </div>
    );
  }

  const currentStepData = guide?.steps?.[currentStep];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/attendee/${eventId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Guest Guide</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                {currentStepData?.title}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {guide?.steps?.length || 0}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-muted-foreground">{currentStepData?.description}</p>
              
              {currentStepData?.tips && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Tips:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentStepData.tips.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentStepData?.checklist && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Checklist:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentStepData.checklist.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={() => setCurrentStep(Math.min((guide?.steps?.length || 1) - 1, currentStep + 1))}
                disabled={currentStep === (guide?.steps?.length || 1) - 1}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
