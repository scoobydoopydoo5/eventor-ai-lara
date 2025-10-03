import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface TicketDesignCardProps {
  eventId: string;
}

export function TicketDesignCard({ eventId }: TicketDesignCardProps) {
  const [config, setConfig] = useState({
    adult_price: '',
    child_price: '',
    ticket_color: '#000000',
    show_qr_code: true,
    font_family: 'Arial',
    text_color: '#000000',
    bg_color: '',
    text_alignment: 'center',
    ticket_text: 'Event Ticket'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, [eventId]);

  const fetchConfig = async () => {
    const { data } = await (supabase as any)
      .from('ticket_config')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (data) {
      setConfig({
        adult_price: data.adult_price?.toString() || '',
        child_price: data.child_price?.toString() || '',
        ticket_color: data.ticket_color || '#000000',
        show_qr_code: data.show_qr_code,
        font_family: data.font_family || 'Arial',
        text_color: data.text_color || '#000000',
        bg_color: data.bg_color || '',
        text_alignment: data.text_alignment || 'center',
        ticket_text: data.ticket_text || 'Event Ticket'
      });
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await (supabase as any).from('ticket_config').upsert({
        event_id: eventId,
        adult_price: config.adult_price ? parseFloat(config.adult_price) : null,
        child_price: config.child_price ? parseFloat(config.child_price) : null,
        ticket_color: config.ticket_color,
        show_qr_code: config.show_qr_code,
        font_family: config.font_family,
        text_color: config.text_color,
        bg_color: config.bg_color,
        text_alignment: config.text_alignment,
        ticket_text: config.ticket_text
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Ticket design saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save ticket design', variant: 'destructive' });
    }
  };

  const handleAIDesign = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ticket-design', {
        body: { eventId }
      });

      if (error) throw error;

      setConfig(prev => ({ ...prev, ...data.design }));
      toast({ title: 'Success', description: 'AI design generated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate AI design', variant: 'destructive' });
    }
  };

  const handleAIPrice = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('suggest-ticket-price', {
        body: { eventId }
      });

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        adult_price: data.adultPrice.toString(),
        child_price: data.childPrice.toString()
      }));
      toast({ title: 'Success', description: 'AI pricing suggested' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to suggest pricing', variant: 'destructive' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>🎨 Ticket Design</CardTitle>
            <CardDescription>Customize ticket appearance and pricing</CardDescription>
          </CardHeader>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Design Your Ticket</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Adult Price</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={config.adult_price}
                  onChange={(e) => setConfig({ ...config, adult_price: e.target.value })}
                  placeholder="0.00"
                />
                <Button onClick={handleAIPrice} variant="outline" size="sm">AI Decide</Button>
              </div>
            </div>

            <div>
              <Label>Child Price</Label>
              <Input
                type="number"
                value={config.child_price}
                onChange={(e) => setConfig({ ...config, child_price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Background Color</Label>
              <Input
                type="color"
                value={config.bg_color}
                onChange={(e) => setConfig({ ...config, bg_color: e.target.value })}
              />
            </div>

            <div>
              <Label>Text Color</Label>
              <Input
                type="color"
                value={config.text_color}
                onChange={(e) => setConfig({ ...config, text_color: e.target.value })}
              />
            </div>

            <div>
              <Label>Font Family</Label>
              <Select value={config.font_family} onValueChange={(value) => setConfig({ ...config, font_family: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Text Alignment</Label>
              <Select value={config.text_alignment} onValueChange={(value) => setConfig({ ...config, text_alignment: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ticket Text</Label>
              <Textarea
                value={config.ticket_text}
                onChange={(e) => setConfig({ ...config, ticket_text: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show QR Code</Label>
              <Switch
                checked={config.show_qr_code}
                onCheckedChange={(checked) => setConfig({ ...config, show_qr_code: checked })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">Save Design</Button>
              <Button onClick={handleAIDesign} variant="outline">Let AI Design</Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Ticket Preview</Label>
            <div
              className="border rounded-lg p-6 min-h-[300px]"
              style={{
                backgroundColor: config.bg_color || '#ffffff',
                color: config.text_color,
                fontFamily: config.font_family,
                textAlign: config.text_alignment as any
              }}
            >
              <p className="text-xl font-bold mb-4">{config.ticket_text}</p>
              {config.show_qr_code && (
                <div className="flex justify-center my-4">
                  <QRCodeSVG value={`event-${eventId}`} size={128} />
                </div>
              )}
              <p className="text-sm mt-4">Adult: ${config.adult_price || '0.00'}</p>
              <p className="text-sm">Child: ${config.child_price || '0.00'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
