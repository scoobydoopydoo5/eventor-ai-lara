import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotesViewProps {
  event: any;
}

const noteColors = [
  '#fef08a', // yellow
  '#fecaca', // red
  '#bfdbfe', // blue
  '#bbf7d0', // green
  '#ddd6fe', // purple
  '#fed7aa', // orange
  '#fbcfe8', // pink
];

export function NotesView({ event }: NotesViewProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (event?.id) {
      loadNotes();
    }
  }, [event?.id]);

  const loadNotes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('notes')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      const randomColor = noteColors[Math.floor(Math.random() * noteColors.length)];
      const { error } = await (supabase as any)
        .from('notes')
        .insert({
          event_id: event.id,
          title: 'Untitled Note',
          content: '',
          color: randomColor,
        });

      if (error) throw error;
      await loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async (noteId: string, updates: any) => {
    try {
      const { error } = await (supabase as any)
        .from('notes')
        .update(updates)
        .eq('id', noteId);

      if (error) throw error;
      await loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      await loadNotes();
      toast({
        title: "Success",
        description: "Note deleted",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const handleGenerateNotes = async () => {
    setGenerating(true);
    try {
      // Call AI to generate notes (placeholder for now)
      const sampleNotes = [
        {
          title: 'Vendor Contacts',
          content: 'List of all confirmed vendors with contact information and booking details.',
          color: '#fef08a',
        },
        {
          title: 'Day-of Timeline',
          content: 'Hour-by-hour schedule for the event day including setup, guest arrival, and cleanup.',
          color: '#bfdbfe',
        },
        {
          title: 'Budget Tracking',
          content: 'Keep track of all expenses and compare against the initial budget estimates.',
          color: '#bbf7d0',
        },
      ];

      for (const note of sampleNotes) {
        await (supabase as any)
          .from('notes')
          .insert({
            event_id: event.id,
            ...note,
          });
      }

      await loadNotes();
      toast({
        title: "Success",
        description: "AI-generated notes created",
      });
    } catch (error) {
      console.error('Error generating notes:', error);
      toast({
        title: "Error",
        description: "Failed to generate notes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Notes & Reminders</h3>
        <div className="flex gap-2">
          <Button onClick={handleGenerateNotes} disabled={generating} variant="outline">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate Notes
              </>
            )}
          </Button>
          <Button onClick={handleAddNote}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card 
            key={note.id} 
            className="relative group transition-all hover:shadow-lg"
            style={{ backgroundColor: note.color + '40', borderColor: note.color }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <Input
                  value={note.title}
                  onChange={(e) => handleUpdateNote(note.id, { title: e.target.value })}
                  className="font-semibold border-0 p-0 h-auto bg-transparent focus-visible:ring-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={note.content || ''}
                onChange={(e) => handleUpdateNote(note.id, { content: e.target.value })}
                placeholder="Write your note here..."
                className="min-h-[120px] border-0 bg-transparent focus-visible:ring-0 resize-none"
              />
              <div className="flex gap-1 mt-2">
                {noteColors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: note.color === color ? '#000' : 'transparent',
                    }}
                    onClick={() => handleUpdateNote(note.id, { color })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {notes.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No notes yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create notes to keep track of important information and reminders
              </p>
              <Button onClick={handleAddNote}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
