import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FiStar, FiLoader } from 'react-icons/fi';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

interface EnhancedBasicInfoStepProps {
  data: any;
  onChange: (data: any) => void;
}

const modes = ['Organizer', 'Attendee', 'Lite Setup', 'Quick Ideas'];
const eventTypes = ['Hackathon', 'Party', 'Wedding', 'Conference', 'Birthday', 'Corporate', 'Festival', 'Workshop', 'Other'];
const themes = ['Crazy', 'Coding', 'Formal', 'Casual', 'Beach', 'Vintage', 'Modern', 'Tropical', 'Winter', 'Sports', 'Other'];

export function EnhancedBasicInfoStep({ data, onChange }: EnhancedBasicInfoStepProps) {
  const [enhancing, setEnhancing] = useState(false);
  const [showOtherEventType, setShowOtherEventType] = useState(data.event_type === 'other');
  const [showOtherTheme, setShowOtherTheme] = useState(data.theme_preferences === 'other');
  const { toast } = useToast();

  const handleEnhanceName = async () => {
    if (!data.name) return;
    
    setEnhancing(true);
    try {
      const { data: result } = await supabase.functions.invoke('ai-enhance', {
        body: {
          text: data.name,
          context: `Event type: ${data.event_type || 'general'}, Theme: ${data.theme_preferences || 'none'}`,
          type: 'event_name'
        }
      });

      if (result?.result) {
        onChange({ ...data, name: result.result });
        toast({
          title: "Enhanced!",
          description: "Event name has been enhanced with AI",
        });
      }
    } catch (error) {
      console.error('Error enhancing name:', error);
      toast({
        title: "Error",
        description: "Failed to enhance event name",
        variant: "destructive",
      });
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name *</Label>
        <div className="flex gap-2">
          <Input
            id="name"
            placeholder="Enter event name"
            value={data.name || ''}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            required
            enableVoiceInput
            enableEnhance
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleEnhanceName}
            disabled={!data.name || enhancing}
            className="shrink-0"
          >
            {enhancing ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiStar className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode">Plan Mode *</Label>
        <Select
          value={data.plan_mode}
          onValueChange={(value) => onChange({ ...data, plan_mode: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {modes.map((mode) => (
              <SelectItem key={mode} value={mode.toLowerCase().replace(' ', '-')}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType">Event Type *</Label>
        <Select
          value={showOtherEventType ? 'other' : data.event_type}
          onValueChange={(value) => {
            if (value === 'other') {
              setShowOtherEventType(true);
              onChange({ ...data, event_type: '' });
            } else {
              setShowOtherEventType(false);
              onChange({ ...data, event_type: value });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type.toLowerCase()}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showOtherEventType && (
          <Input
            placeholder="Specify event type"
            value={data.event_type || ''}
            onChange={(e) => onChange({ ...data, event_type: e.target.value })}
            className="mt-2"
            enableVoiceInput
            enableEnhance
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Theme Preferences</Label>
        <Select
          value={showOtherTheme ? 'other' : data.theme_preferences}
          onValueChange={(value) => {
            if (value === 'other') {
              setShowOtherTheme(true);
              onChange({ ...data, theme_preferences: '' });
            } else {
              setShowOtherTheme(false);
              onChange({ ...data, theme_preferences: value });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {themes.map((theme) => (
              <SelectItem key={theme} value={theme.toLowerCase()}>
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showOtherTheme && (
          <Input
            placeholder="Specify theme"
            value={data.theme_preferences || ''}
            onChange={(e) => onChange({ ...data, theme_preferences: e.target.value })}
            className="mt-2"
            enableVoiceInput
            enableEnhance
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Special Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any special requirements or notes for the event..."
          value={data.special_notes || ''}
          onChange={(e) => onChange({ ...data, special_notes: e.target.value })}
          rows={4}
          enableVoiceInput
          enableEnhance
        />
      </div>
    </div>
  );
}
