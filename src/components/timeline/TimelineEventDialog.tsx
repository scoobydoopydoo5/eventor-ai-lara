import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimelineEvent {
  id?: string;
  title: string;
  description?: string;
  event_type: string;
  event_time: string;
  duration_minutes?: number;
}

interface TimelineEventDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: Omit<TimelineEvent, 'id'>) => void;
  event?: TimelineEvent;
  eventDate: string;
}

export function TimelineEventDialog({ open, onClose, onSave, event, eventDate }: TimelineEventDialogProps) {
  const [formData, setFormData] = useState<Omit<TimelineEvent, 'id'>>({
    title: '',
    description: '',
    event_type: 'main',
    event_time: '',
    duration_minutes: 60,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        event_time: event.event_time,
        duration_minutes: event.duration_minutes || 60,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        event_type: 'main',
        event_time: `${eventDate}T10:00:00`,
        duration_minutes: 60,
      });
    }
  }, [event, eventDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit' : 'Add'} Timeline Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="event_type">Event Type</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparation">Preparation</SelectItem>
                <SelectItem value="setup">Setup</SelectItem>
                <SelectItem value="main">Main Event</SelectItem>
                <SelectItem value="cleanup">Cleanup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="event_time">Date & Time</Label>
            <Input
              id="event_time"
              type="datetime-local"
              value={formData.event_time.slice(0, 16)}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value + ':00' })}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
