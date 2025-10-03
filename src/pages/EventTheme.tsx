import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiStar } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

export default function EventTheme() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    fetchEventAndThemes();
  }, [eventId]);

  const fetchEventAndThemes = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      setEvent(eventData);

      const { data: themesData } = await supabase
        .from('event_themes')
        .select('*')
        .eq('event_id', eventId)
        .order('is_starred', { ascending: false });
      
      if (!themesData || themesData.length === 0) {
        await generateThemes(eventData);
      } else {
        setThemes(themesData);
      }
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateThemes = async (eventData?: any) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-themes', {
        body: { event: eventData || event }
      });

      if (error) throw error;

      const themesToInsert = data.themes.map((theme: any) => ({
        ...theme,
        event_id: eventId,
        color_palette: theme.color_palette || [],
        suggestions: theme.suggestions || []
      }));

      const { data: inserted } = await supabase
        .from('event_themes')
        .insert(themesToInsert)
        .select();

      if (inserted) {
        setThemes(inserted);
        toast({
          title: "Success",
          description: "Themes generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating themes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate themes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleStar = async (themeId: string, currentStarred: boolean) => {
    try {
      const { error } = await supabase
        .from('event_themes')
        .update({ is_starred: !currentStarred })
        .eq('id', themeId);

      if (error) throw error;

      setThemes(prev => prev.map(t => 
        t.id === themeId ? { ...t, is_starred: !currentStarred } : t
      ));

      toast({
        title: currentStarred ? "Unstarred" : "Starred!",
        description: currentStarred ? "Theme removed from favorites" : "Theme added to favorites",
      });
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/event/${eventId}`)}
            >
              <FiArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Event Themes</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-muted-foreground">
            AI-generated theme suggestions for your event
          </p>
          <Button onClick={() => generateThemes()} disabled={generating}>
            {generating ? (
              <><FiLoader className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              "Regenerate"
            )}
          </Button>
        </div>

        {themes.length > 0 ? (
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {themes.map((theme) => (
                <CarouselItem key={theme.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold">{theme.theme_name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStar(theme.id, theme.is_starred)}
                        >
                          <FiStar 
                            className={`h-5 w-5 ${theme.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                          />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {theme.theme_description}
                      </p>

                      {theme.color_palette && theme.color_palette.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Color Palette</h4>
                          <div className="flex gap-2">
                            {theme.color_palette.map((color: string, idx: number) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-full border-2 border-border"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {theme.suggestions && theme.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Suggestions</h4>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            {theme.suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No themes generated yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
