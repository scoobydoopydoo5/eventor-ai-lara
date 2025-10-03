import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Timer } from 'lucide-react';
import { format } from 'date-fns';

interface TimerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: any;
  onEventUpdate: () => void;
}

const colorPresets = [
  '#3b82f6', // blue
  '#10b981', // green  
  '#8b5cf6', // purple
  '#ef4444', // red
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1', // indigo
  '#6b7280', // gray
];

const fontColorPresets = [
  '#ffffff', // white
  '#000000', // black
  '#64748b', // slate
  '#94a3b8', // slate-light
  '#f8fafc', // slate-lightest
];

export function TimerSettingsDialog({ open, onOpenChange, event, onEventUpdate }: TimerSettingsDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    timer_style: 'digital',
    show_progress_bar: true,
    background_color: '#3b82f6',
    font_color: '#ffffff',
    font_family: 'Inter',
    font_size: 64,
    show_months: false,
    show_days: true,
    show_hours: true,
    show_minutes: true,
    show_seconds: true,
  });
  const [eventDate, setEventDate] = useState<Date | undefined>(
    event?.event_date ? new Date(event.event_date) : undefined
  );
  const [customBgColor, setCustomBgColor] = useState('');
  const [customFontColor, setCustomFontColor] = useState('');

  useEffect(() => {
    if (open && event?.id) {
      loadSettings();
    }
  }, [open, event?.id]);

  const loadSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('timer_settings')
        .select('*')
        .eq('event_id', event.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading timer settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: existing } = await (supabase as any)
        .from('timer_settings')
        .select('id')
        .eq('event_id', event.id)
        .single();

      if (existing) {
        const { error } = await (supabase as any)
          .from('timer_settings')
          .update(settings)
          .eq('event_id', event.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('timer_settings')
          .insert({ ...settings, event_id: event.id });

        if (error) throw error;
      }

      // Update event date if changed
      if (eventDate && eventDate.toISOString().split('T')[0] !== event.event_date) {
        const { error } = await (supabase as any)
          .from('events')
          .update({ event_date: eventDate.toISOString().split('T')[0] })
          .eq('id', event.id);

        if (error) throw error;
        onEventUpdate();
      }

      toast({
        title: "Success",
        description: "Timer settings saved",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving timer settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Timer Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Date */}
          <div className="space-y-2">
            <Label>Event Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Timer Style */}
          <div className="space-y-2">
            <Label>Timer Style</Label>
            <Select
              value={settings.timer_style}
              onValueChange={(value) => setSettings({ ...settings, timer_style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="digital">Digital Timer</SelectItem>
                <SelectItem value="sand">Sand Timer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display Options */}
          <div className="space-y-2">
            <Label>Display Options</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Progress Bar</span>
              <Switch
                checked={settings.show_progress_bar}
                onCheckedChange={(checked) => setSettings({ ...settings, show_progress_bar: checked })}
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  className="w-10 h-10 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: settings.background_color === color ? '#fff' : 'transparent',
                    boxShadow: settings.background_color === color ? '0 0 0 2px currentColor' : 'none'
                  }}
                  onClick={() => setSettings({ ...settings, background_color: color })}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={customBgColor || settings.background_color}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    setSettings({ ...settings, background_color: e.target.value });
                  }}
                  className="w-10 h-10 rounded-full border-2 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Font Color */}
          <div className="space-y-2">
            <Label>Font Color</Label>
            <div className="flex flex-wrap gap-2">
              {fontColorPresets.map((color) => (
                <button
                  key={color}
                  className="w-10 h-10 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: settings.font_color === color ? '#666' : '#ccc',
                  }}
                  onClick={() => setSettings({ ...settings, font_color: color })}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={customFontColor || settings.font_color}
                  onChange={(e) => {
                    setCustomFontColor(e.target.value);
                    setSettings({ ...settings, font_color: e.target.value });
                  }}
                  className="w-10 h-10 rounded-full border-2 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={settings.font_family}
              onValueChange={(value) => setSettings({ ...settings, font_family: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Poppins">Poppins</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label>Font Size: {settings.font_size}px</Label>
            <Slider
              value={[settings.font_size]}
              onValueChange={([value]) => setSettings({ ...settings, font_size: value })}
              min={32}
              max={128}
              step={4}
            />
          </div>

          {/* Time Format */}
          <div className="space-y-2">
            <Label>Time Format</Label>
            <p className="text-xs text-muted-foreground">
              When a unit is disabled, its time will be converted to the next smaller unit
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Months</span>
                <Switch
                  checked={settings.show_months}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_months: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Days</span>
                <Switch
                  checked={settings.show_days}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_days: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Hours</span>
                <Switch
                  checked={settings.show_hours}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_hours: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Minutes</span>
                <Switch
                  checked={settings.show_minutes}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_minutes: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Seconds</span>
                <Switch
                  checked={settings.show_seconds}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_seconds: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
