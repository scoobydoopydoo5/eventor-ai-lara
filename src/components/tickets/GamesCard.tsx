import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

interface GamesCardProps {
  eventId: string;
}

export function GamesCard({ eventId }: GamesCardProps) {
  const [settings, setSettings] = useState({
    ai_trivia_enabled: true,
    jeopardy_enabled: true,
    quizizz_enabled: true,
    ice_breakers_enabled: true,
    jokes_enabled: true,
    emoji_guess_enabled: true,
    random_task_enabled: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [eventId]);

  const fetchSettings = async () => {
    const { data, error } = await (supabase as any)
      .from('game_settings' as any)
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (!error && data) {
      setSettings(data as any);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await (supabase as any).from('game_settings' as any).upsert({
        event_id: eventId,
        ...settings
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Game settings saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const games = [
    { key: 'ai_trivia_enabled', label: 'AI Trivia', desc: 'AI-generated trivia questions' },
    { key: 'jeopardy_enabled', label: 'Online Jeopardy', desc: 'Jeopardy-style game' },
    { key: 'quizizz_enabled', label: 'Online Quizizz', desc: 'Multiple choice quiz game' },
    { key: 'ice_breakers_enabled', label: 'AI Ice-Breakers', desc: 'Ice breaker activities' },
    { key: 'jokes_enabled', label: 'AI Jokes', desc: 'AI-generated jokes' },
    { key: 'emoji_guess_enabled', label: 'Guess from Emojis', desc: 'Emoji puzzle game' },
    { key: 'random_task_enabled', label: 'Random Task', desc: 'Random attendee tasks' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>🎮 Game Management</CardTitle>
            <CardDescription>Enable or disable games</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Game Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {games.map((game) => (
            <div key={game.key} className="flex items-center justify-between">
              <div>
                <Label>{game.label}</Label>
                <p className="text-sm text-muted-foreground">{game.desc}</p>
              </div>
              <Switch
                checked={settings[game.key as keyof typeof settings]}
                onCheckedChange={(checked) => setSettings({ ...settings, [game.key]: checked })}
              />
            </div>
          ))}

          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}