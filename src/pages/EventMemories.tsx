import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-typed';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function EventMemories() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateImage, isGenerating } = useImageGeneration();
  const [event, setEvent] = useState<any>(null);
  const [memories, setMemories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEventAndMemories();
  }, [eventId]);

  const fetchEventAndMemories = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Get memories from event_memories table or memory_images field
      const storedMemories = eventData.memory_images || [];
      setMemories(storedMemories);

      // Auto-generate 3 memories if none exist
      if (storedMemories.length === 0) {
        await generateInitialMemories(eventData);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInitialMemories = async (eventData: any) => {
    const prompts = [
      `A beautiful moment from ${eventData.name}, ${eventData.event_type} event with ${eventData.theme_preferences || 'elegant'} theme`,
      `Attendees enjoying ${eventData.name} at ${eventData.location_name}, celebrating and having fun`,
      `Stunning view of ${eventData.name} venue decorated for ${eventData.event_type}, atmospheric lighting`
    ];

    const generatedImages: string[] = [];
    for (const prompt of prompts) {
      const image = await generateImage(prompt, eventData);
      if (image) generatedImages.push(image);
    }

    if (generatedImages.length > 0) {
      await saveMemories(generatedImages);
      setMemories(generatedImages);
    }
  };

  const handleGenerateMemory = async () => {
    if (!event) return;

    const prompt = `A memorable moment from ${event.name}, ${event.event_type} event, capturing the atmosphere and joy`;
    const image = await generateImage(prompt, event);
    
    if (image) {
      const newMemories = [...memories, image];
      await saveMemories(newMemories);
      setMemories(newMemories);
      toast({
        title: 'Memory Generated',
        description: 'New memory image created successfully',
      });
    }
  };

  const handleUploadMemory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newMemories = [...memories, reader.result as string];
        await saveMemories(newMemories);
        setMemories(newMemories);
        setUploading(false);
        toast({
          title: 'Memory Uploaded',
          description: 'Image uploaded successfully',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading:', error);
      setUploading(false);
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  const saveMemories = async (memoryImages: string[]) => {
    if (!eventId) return;

    await (supabase as any)
      .from('events')
      .update({ memory_images: memoryImages })
      .eq('id', eventId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{event?.name} - Memories</h1>
              <p className="text-sm text-muted-foreground">
                AI-generated and uploaded memories from your event
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Memories Gallery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {memories.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent>
                  {memories.map((image, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <Card className="overflow-hidden">
                        <img
                          src={image}
                          alt={`Memory ${index + 1}`}
                          className="w-full h-64 object-cover"
                        />
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No memories yet. Generate or upload some!
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateMemory}
                disabled={isGenerating || uploading}
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Memory
              </Button>
              <Button
                variant="outline"
                disabled={isGenerating || uploading}
                className="flex-1"
                onClick={() => document.getElementById('memory-upload')?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Image
              </Button>
              <input
                id="memory-upload"
                type="file"
                accept="image/*"
                onChange={handleUploadMemory}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
