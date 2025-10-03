import { useState } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/lib/supabase-typed';
import { useBalloons } from './useBalloons';

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { spendBalloons } = useBalloons();

  const generateImage = async (prompt: string, context?: any) => {
    const canProceed = await spendBalloons(20, 'AI Image Generation');
    if (!canProceed) return null;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, context }
      });

      if (error) throw error;

      return data?.image;
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const searchOnlineImage = async (query: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('search-image', {
        body: { query }
      });

      if (error) throw error;
      return data?.imageUrl;
    } catch (error) {
      console.error('Error searching image:', error);
      return null;
    }
  };

  const getImageWithFallback = async (query: string, prompt?: string) => {
    // Try online search first
    const onlineImage = await searchOnlineImage(query);
    if (onlineImage) return { url: onlineImage, source: 'online' };

    // Fallback to AI generation
    if (prompt) {
      const aiImage = await generateImage(prompt);
      if (aiImage) return { url: aiImage, source: 'ai' };
    }

    return null;
  };

  return { generateImage, searchOnlineImage, getImageWithFallback, isGenerating };
};
