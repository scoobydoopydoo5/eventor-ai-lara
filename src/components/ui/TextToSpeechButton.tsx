import { useState, useRef } from 'react';
import { Button } from './button';
import { Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';

interface TextToSpeechButtonProps {
  text: string;
  voice?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
}

export const TextToSpeechButton = ({ 
  text, 
  voice = 'alloy', 
  size = 'icon',
  variant = 'ghost' 
}: TextToSpeechButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    if (!text || text.trim().length === 0) {
      toast({
        title: 'No text',
        description: 'There is no text to read',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }

        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to play audio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handlePlayPause}
      disabled={isLoading || !text || text.trim().length === 0}
      className="shrink-0"
      title={isPlaying ? 'Stop audio' : 'Play as audio'}
    >
      {isPlaying ? (
        <VolumeX className="h-4 w-4 animate-pulse" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};
