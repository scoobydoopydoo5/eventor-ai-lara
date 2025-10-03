import { useState } from 'react';
import { Button } from './button';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';

interface EnhanceTextButtonProps {
  text: string;
  onEnhanced: (enhancedText: string) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const EnhanceTextButton = ({ text, onEnhanced, size = 'icon' }: EnhanceTextButtonProps) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    if (!text || text.trim().length === 0) return;

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-text', {
        body: { text }
      });

      if (error) throw error;

      if (data?.enhancedText) {
        onEnhanced(data.enhancedText);
        toast({
          title: 'Success',
          description: 'Text enhanced successfully',
        });
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
      toast({
        title: 'Error',
        description: 'Failed to enhance text',
        variant: 'destructive',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={handleEnhance}
      disabled={!text || text.trim().length === 0 || isEnhancing}
      className="shrink-0"
      title="Enhance text with AI"
    >
      <Sparkles className={`h-4 w-4 ${isEnhancing ? 'animate-spin' : ''}`} />
    </Button>
  );
};
