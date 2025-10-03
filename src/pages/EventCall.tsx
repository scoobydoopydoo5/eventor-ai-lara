import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-typed";
import { ArrowLeft, Mic, MicOff, Phone, Sparkles } from "lucide-react";
import { useSpeechSynthesis } from "react-speech-kit";

const EventCall = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [callStartTime, setCallStartTime] = useState<number>(Date.now());
  const [currentTranscript, setCurrentTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchEventData();
    requestMicPermission();
  }, [eventId]);

  const fetchEventData = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load event data",
        variant: "destructive",
      });
      return;
    }
    setEventData(data);
  };

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      toast({
        title: "Microphone Ready",
        description: "You can now talk to Evento",
      });
    } catch (error) {
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice chat",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      setCurrentTranscript("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording",
        variant: "destructive",
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
      const fileReader = new FileReader();
      fileReader.readAsDataURL(audioBlob);
      fileReader.onloadend = async () => {
        const base64Audio = (fileReader.result as string).split(',')[1];
        
        // Step 1: Transcribe user audio
        const { data: transcription, error: transcriptError } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (transcriptError) throw transcriptError;

        const userMessage = { role: 'user', content: transcription.text };
        setCurrentTranscript(transcription.text);
        setMessages(prev => [...prev, userMessage]);
        
        setIsProcessing(false);

        // Step 2: Get AI response (streaming)
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [...messages, userMessage],
              eventData,
              chatType: 'general'
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to get AI response');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    aiResponse += content;
                    setMessages(prev => {
                      const newMessages = [...prev];
                      if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                        newMessages[newMessages.length - 1].content = aiResponse;
                      } else {
                        newMessages.push({ role: 'assistant', content: aiResponse });
                      }
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }

        // Step 3: Convert AI response to speech and play it
        setIsSpeaking(true);
        const { data: speechData, error: speechError } = await supabase.functions.invoke('text-to-speech', {
          body: { text: aiResponse, voice: 'alloy' }
        });

        if (speechError) throw speechError;

        const audio = new Audio(`data:audio/mp3;base64,${speechData.audioContent}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentTranscript("");
          // Auto-start recording again for continuous conversation
          startRecording();
        };
        
        audio.play();
      };
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process your message",
        variant: "destructive",
      });
      setIsProcessing(false);
      setIsSpeaking(false);
      setCurrentTranscript("");
    }
  };

  const endCall = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
    const duration = Math.floor((Date.now() - callStartTime) / 1000);
    
    const summary = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    await supabase.from('event_call_history').insert({
      event_id: eventId,
      summary,
      duration_seconds: duration
    });

    const { data: session } = await supabase
      .from('event_chat_sessions')
      .insert({
        event_id: eventId,
        title: `Call ${new Date().toLocaleString()}`,
        chat_type: 'general'
      })
      .select()
      .single();

    if (session) {
      for (const msg of messages) {
        await supabase.from('event_chat_messages').insert({
          session_id: session.id,
          role: msg.role,
          content: msg.content
        });
      }
    }

    toast({
      title: "Call Ended",
      description: `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
    });

    navigate(`/event/${eventId}/chat`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate(`/event/${eventId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Call with Evento</h1>
          <Button variant="destructive" onClick={endCall}>
            <Phone className="mr-2 h-4 w-4" />
            End Call
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="text-center">
            <div className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="h-24 w-24 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Evento</h2>
            <p className="text-lg text-muted-foreground">
              {isRecording ? "Listening..." : isProcessing ? "Transcribing..." : isSpeaking ? "Speaking..." : "Ready to talk"}
            </p>
            {currentTranscript && (
              <p className="text-sm text-muted-foreground mt-2 italic">"{currentTranscript}"</p>
            )}
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={isProcessing || isSpeaking}
                className="h-20 w-20 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="h-20 w-20 rounded-full animate-pulse"
              >
                <MicOff className="h-8 w-8" />
              </Button>
            )}
          </div>

          <div className="w-full max-w-2xl bg-card border border-border rounded-lg p-6 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-4">Conversation</h3>
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center">No messages yet. Start talking!</p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-8'
                        : 'bg-secondary text-secondary-foreground mr-8'
                    }`}
                  >
                    <p className="font-semibold mb-1">{msg.role === 'user' ? 'You' : 'Evento'}</p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCall;
