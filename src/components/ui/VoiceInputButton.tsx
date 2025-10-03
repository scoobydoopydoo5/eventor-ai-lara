import { useState, useRef } from 'react';
import { Button } from './button';
import { Mic, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const VoiceInputButton = ({ onTranscript, size = 'icon' }: VoiceInputButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to process audio');
        }

        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          onTranscript(data.text);
          toast({
            title: 'Success',
            description: 'Speech converted to text',
          });
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert speech to text',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {!isRecording ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={startRecording}
          disabled={isProcessing}
          className="shrink-0"
          title="Start voice input"
        >
          <Mic className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="default"
          size={size}
          onClick={stopRecording}
          className="shrink-0 animate-pulse bg-green-600 hover:bg-green-700"
          title="Done recording"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};
