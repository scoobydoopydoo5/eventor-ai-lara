import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

interface SettingsCardProps {
  eventId: string;
}

export function SettingsCard({ eventId }: SettingsCardProps) {
  const [settings, setSettings] = useState({
    ice_breakers_enabled: true,
    external_invites_enabled: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [eventId]);

  const fetchSettings = async () => {
    const { data } = await (supabase as any)
      .from('event_settings')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (data) {
      setSettings({
        ice_breakers_enabled: data.ice_breakers_enabled,
        external_invites_enabled: data.external_invites_enabled
      });
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await (supabase as any).from('event_settings').upsert({
        event_id: eventId,
        ...settings
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Settings saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>⚙️ Event Settings</CardTitle>
            <CardDescription>Configure event features</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Event Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ice Breakers</Label>
              <p className="text-sm text-muted-foreground">Enable ice breaker activities</p>
            </div>
            <Switch
              checked={settings.ice_breakers_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, ice_breakers_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>External Invites</Label>
              <p className="text-sm text-muted-foreground">Allow external guest invitations</p>
            </div>
            <Switch
              checked={settings.external_invites_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, external_invites_enabled: checked })}
            />
          </div>

          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
