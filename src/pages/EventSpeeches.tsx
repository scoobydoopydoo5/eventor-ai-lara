import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useBalloons } from '@/hooks/useBalloons';
import { TextToSpeechButton } from '@/components/ui/TextToSpeechButton';
import { ArrowLeft, Plus, Mic, Languages, Edit, Sparkles, Trash2, Copy } from 'lucide-react';

interface Speech {
  id: string;
  type: string;
  content: string;
}

export default function EventSpeeches() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { spendBalloons } = useBalloons();
  const [event, setEvent] = useState<any>(null);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('intro');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translateDialogOpen, setTranslateDialogOpen] = useState(false);
  const [translateSpeechId, setTranslateSpeechId] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('');

  const speechTypes = [
    { value: 'intro', label: 'Opening/Introduction' },
    { value: 'welcoming', label: 'Welcome Speech' },
    { value: 'formal', label: 'Formal Speech' },
    { value: 'informal', label: 'Informal Speech' },
    { value: 'toast', label: 'Toast' },
    { value: 'thanking', label: 'Thank You Speech' },
    { value: 'outro', label: 'Closing Speech' }
  ];

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchSpeeches();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({ title: 'Error', description: 'Failed to load event', variant: 'destructive' });
    }
  };

  const fetchSpeeches = async () => {
    try {
      const { data, error } = await supabase
        .from('event_speeches')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setSpeeches(data?.map(speech => ({
        id: speech.id,
        type: speech.speech_type,
        content: speech.speech_content
      })) || []);
    } catch (error) {
      console.error('Error fetching speeches:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!event) return;
    
    // Check and spend balloons (25 balloons for speech generation)
    const canProceed = await spendBalloons(25, `${selectedType.replace('_', ' ')} Speech Generation`);
    if (!canProceed) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-speech', {
        body: { eventData: event, speechType: selectedType }
      });

      if (error) throw error;

      const { data: insertedSpeech, error: insertError } = await supabase
        .from('event_speeches')
        .insert({
          event_id: eventId,
          speech_type: selectedType,
          speech_content: data.speech
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newSpeech: Speech = {
        id: insertedSpeech.id,
        type: selectedType,
        content: data.speech
      };

      setSpeeches([...speeches, newSpeech]);
      
      setIsAddDialogOpen(false);
      toast({ title: 'Success', description: 'Speech generated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const deleteSpeech = async (id: string) => {
    try {
      const { error } = await supabase.from('event_speeches').delete().eq('id', id);
      if (error) throw error;
      
      setSpeeches(speeches.filter(s => s.id !== id));
      toast({ title: 'Deleted', description: 'Speech deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete speech', variant: 'destructive' });
    }
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('event_speeches')
        .update({ speech_content: editContent })
        .eq('id', id);
      
      if (error) throw error;
      
      setSpeeches(speeches.map(s => s.id === id ? { ...s, content: editContent } : s));
      setEditingId(null);
      toast({ title: 'Saved', description: 'Speech updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save speech', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Speech copied to clipboard' });
  };

  const translateSpeech = async () => {
    if (!translateSpeechId || !targetLanguage) return;

    setTranslating(true);
    try {
      const speech = speeches.find(s => s.id === translateSpeechId);
      if (!speech) throw new Error('Speech not found');

      const { data, error } = await supabase.functions.invoke('translate-speech', {
        body: { text: speech.content, targetLanguage }
      });

      if (error) throw error;

      toast({ title: 'Translated', description: `Speech translated to ${targetLanguage}` });
      
      // Update the speech content with translation
      setEditingId(translateSpeechId);
      setEditContent(data.translatedText);
      setTranslateDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to translate', variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/event/${eventId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">Event Speeches</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <Dialog open={translateDialogOpen} onOpenChange={setTranslateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Translate Speech</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="German">German</SelectItem>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <SelectItem value="Portuguese">Portuguese</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                  <SelectItem value="Japanese">Japanese</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={translateSpeech} disabled={translating || !targetLanguage} className="w-full">
              <Languages className="h-4 w-4 mr-2" />
              {translating ? 'Translating...' : 'Translate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Manage Event Speeches</h2>
            <p className="text-muted-foreground">Generate AI-powered speeches for your event</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Speech
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Speech</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Speech Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {speechTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateSpeech} disabled={generating} className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate Speech'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {speeches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No speeches yet</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Speech
                </Button>
              </CardContent>
            </Card>
          ) : (
            speeches.map(speech => (
              <Card key={speech.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      {speechTypes.find(t => t.value === speech.type)?.label || speech.type}
                    </CardTitle>
                    <div className="flex gap-2">
                      <TextToSpeechButton text={speech.content} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTranslateSpeechId(speech.id);
                          setTranslateDialogOpen(true);
                        }}
                        title="Translate"
                      >
                        <Languages className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(speech.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(speech.id);
                          setEditContent(speech.content);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSpeech(speech.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === speech.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={8}
                        className="w-full"
                        enableVoiceInput
                        enableEnhance
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => saveEdit(speech.id)}>Save</Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-foreground">{speech.content}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}