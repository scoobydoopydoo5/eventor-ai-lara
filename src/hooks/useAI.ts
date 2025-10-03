import { useBalloons } from './useBalloons';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from './use-toast';

export const useAI = () => {
  const { spendBalloons } = useBalloons();
  const { toast } = useToast();

  const invokeAI = async (
    functionName: string,
    body: any,
    cost: number,
    description: string
  ) => {
    // Check and spend balloons first
    const canProceed = await spendBalloons(cost, description);
    if (!canProceed) return { data: null, error: new Error('Insufficient balloons') };

    // Call the AI function
    try {
      const { data, error } = await supabase.functions.invoke(functionName, { body });
      return { data, error };
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      toast({
        title: "Error",
        description: "AI generation failed",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  return { invokeAI };
};
