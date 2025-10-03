import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useBalloons } from '@/hooks/useBalloons';

interface EmergencyCardProps {
  event: any;
}

export function EmergencyCard({ event }: EmergencyCardProps) {
  const [open, setOpen] = useState(false);
  const [emergency, setEmergency] = useState('');
  const [planB, setPlanB] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { spendBalloons } = useBalloons();

  const generatePlanB = async () => {
    if (!emergency.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe the emergency situation',
        variant: 'destructive',
      });
      return;
    }

    // Check and spend balloons (50 balloons for emergency plan)
    const canProceed = await spendBalloons(50, 'Generate Emergency Plan B');
    if (!canProceed) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-emergency-plan', {
        body: { 
          event,
          emergency: emergency.trim()
        }
      });

      if (error) throw error;

      setPlanB(data.plan);
      toast({
        title: 'Success',
        description: 'Emergency Plan B generated!',
      });
    } catch (error: any) {
      console.error('Error generating Plan B:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate emergency plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setOpen(true)}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Emergency Plan B
          </CardTitle>
          <CardDescription>
            Generate backup plans for unexpected situations
          </CardDescription>
        </CardHeader>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Emergency Plan B Generator
            </DialogTitle>
            <DialogDescription>
              Describe what went wrong and get an AI-generated backup plan based on your event details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What's the emergency?
              </label>
              <Textarea
                placeholder="E.g., The venue cancelled last minute, main speaker got sick, caterer didn't show up..."
                value={emergency}
                onChange={(e) => setEmergency(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={generatePlanB} 
              disabled={loading || !emergency.trim()}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? 'Generating Plan B...' : 'Generate Emergency Plan B'}
            </Button>

            {planB && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Your Emergency Plan B:
                </h4>
                <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{planB}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
