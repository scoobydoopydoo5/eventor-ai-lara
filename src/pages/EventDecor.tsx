import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLoader, FiExternalLink, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/ThemeSelector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

export default function EventDecor() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [decorations, setDecorations] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchEventAndDecorations();
  }, [eventId]);

  const fetchEventAndDecorations = async () => {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      setEvent(eventData);

      const { data: decorData } = await supabase
        .from('event_decorations')
        .select('*')
        .eq('event_id', eventId);
      
      if (!decorData || decorData.length === 0) {
        await generateDecorations();
      } else {
        setDecorations(decorData);
      }
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDecorations = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-decorations', {
        body: { event }
      });

      if (error) throw error;

      const decorToInsert = data.decorations.map((decor: any) => ({
        ...decor,
        event_id: eventId
      }));

      const { data: inserted } = await supabase
        .from('event_decorations')
        .insert(decorToInsert)
        .select();

      if (inserted) {
        setDecorations(inserted);
        toast({
          title: "Success",
          description: "Decorations generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error generating decorations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate decorations",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
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
            <h1 className="text-2xl font-bold text-gradient">Decorations</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-muted-foreground">
            AI-generated decoration suggestions for your event
          </p>
          <Button onClick={generateDecorations} disabled={generating}>
            {generating ? (
              <><FiLoader className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              "Regenerate"
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {decorations.map((decor) => (
            <Card key={decor.id}>
              <Collapsible
                open={openSections[decor.id]}
                onOpenChange={() => toggleSection(decor.id)}
              >
                <CardHeader className="cursor-pointer" onClick={() => toggleSection(decor.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between">
                      <CardTitle>{decor.category}</CardTitle>
                      {openSections[decor.id] ? (
                        <FiChevronDown className="h-5 w-5" />
                      ) : (
                        <FiChevronRight className="h-5 w-5" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {decor.content}
                    </p>

                    <div>
                      <h4 className="font-semibold mb-3">Where to Buy:</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {decor.purchase_links?.map((link: any, idx: number) => (
                          <Card key={idx} className="p-4">
                            <div className="space-y-2">
                              <h5 className="font-medium">{link.name}</h5>
                              <p className="text-sm text-muted-foreground">{link.description}</p>
                              <Button size="sm" variant="outline" asChild>
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                  Visit Store <FiExternalLink className="ml-2 h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
