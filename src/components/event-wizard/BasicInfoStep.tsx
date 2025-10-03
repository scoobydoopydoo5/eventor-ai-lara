import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface BasicInfoStepProps {
  data: any;
  onChange: (data: any) => void;
}

const modes = ['Organizer', 'Attendee', 'Lite', 'Quick Ideas'];
const eventTypes = [
  'Birthday Party',
  'Wedding',
  'Conference',
  'Workshop',
  'Meetup',
  'Corporate Event',
  'Festival',
  'Other',
];
const themes = ['Crazy', 'Coding', 'Formal'];

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="eventName">Event Name</Label>
        <Input
          id="eventName"
          placeholder="My Awesome Event"
          value={data.eventName || ''}
          onChange={(e) => onChange({ ...data, eventName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode">Mode</Label>
        <Select
          value={data.mode}
          onValueChange={(value) => onChange({ ...data, mode: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {modes.map((mode) => (
              <SelectItem key={mode} value={mode.toLowerCase()}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventType">Event Type</Label>
        <Select
          value={data.eventType}
          onValueChange={(value) => onChange({ ...data, eventType: value })}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={data.theme}
          onValueChange={(value) => onChange({ ...data, theme: value })}
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
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="notes">Notes to AI</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-primary"
          >
            <Sparkles className="h-4 w-4" />
            AI Fill
          </Button>
        </div>
        <Textarea
          id="notes"
          placeholder="Tell AI about your vision for this event..."
          rows={4}
          value={data.notes || ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
