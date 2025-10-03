import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GuestFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

interface FlowStep {
  title: string;
  description: string;
  timeframe: string;
}

export function GuestFlowModal({ open, onOpenChange, eventId }: GuestFlowModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && eventId) {
      fetchGuestFlow();
    }
  }, [open, eventId]);

  const fetchGuestFlow = async () => {
    try {
      const { data: existingFlow } = await (supabase as any)
        .from('guest_flow')
        .select('flow_steps')
        .eq('event_id', eventId)
        .single();

      if (existingFlow) {
        setFlowSteps(existingFlow.flow_steps as unknown as FlowStep[]);
      } else {
        await generateGuestFlow();
      }
    } catch (error) {
      console.error('Error fetching guest flow:', error);
    }
  };

  const generateGuestFlow = async () => {
    setLoading(true);
    try {
      const { data: eventData } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      const { data, error } = await supabase.functions.invoke('generate-guest-flow', {
        body: { eventData }
      });

      if (error) throw error;

      const steps = data.flowSteps;
      setFlowSteps(steps);

      await (supabase as any).from('guest_flow').upsert({
        event_id: eventId,
        flow_steps: steps
      });

      toast({
        title: 'Success',
        description: 'Guest flow generated successfully'
      });
    } catch (error) {
      console.error('Error generating guest flow:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate guest flow',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < flowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Guest Flow Journey</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : flowSteps.length > 0 ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Step {currentStep + 1} of {flowSteps.length}
              </div>
              <h3 className="text-2xl font-bold mb-2">{flowSteps[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{flowSteps[currentStep].timeframe}</p>
              <p className="text-base">{flowSteps[currentStep].description}</p>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={handleBack}
                disabled={currentStep === 0}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentStep === flowSteps.length - 1}
              >
                Next
              </Button>
            </div>

            <div className="flex gap-2 justify-center">
              {flowSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Button onClick={generateGuestFlow}>Generate Guest Flow</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
