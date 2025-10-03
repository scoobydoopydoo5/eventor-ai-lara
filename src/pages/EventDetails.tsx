import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ArrowLeft, Save, AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EventPasswordModal } from '@/components/EventPasswordModal';
import { useClerkAuth } from '@/contexts/ClerkAuthContext';
import { ImageGeneratorUploader } from '@/components/ui/ImageGeneratorUploader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useClerkAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    event_date: '',
    short_description: '',
    theme_preferences: '',
    location_name: '',
    event_duration: 0,
    event_image: '',
  });

  useEffect(() => {
    if (eventId) {
      fetchEvent();
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
      setFormData({
        name: data.name || '',
        event_date: data.event_date || '',
        short_description: data.short_description || '',
        theme_preferences: data.theme_preferences || '',
        location_name: data.location_name || '',
        event_duration: data.event_duration || 0,
        event_image: data.event_image || '',
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({ title: 'Error', description: 'Failed to load event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if key details changed
    const hasKeyChanges = 
      formData.name !== event.name ||
      formData.event_date !== event.event_date ||
      formData.theme_preferences !== event.theme_preferences ||
      formData.location_name !== event.location_name ||
      formData.event_duration !== event.event_duration;

    if (hasKeyChanges) {
      setShowWarning(true);
      return;
    }

    await saveChanges();
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update(formData)
        .eq('id', eventId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Event details updated successfully' });
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({ title: 'Error', description: 'Failed to update event', variant: 'destructive' });
    } finally {
      setSaving(false);
      setShowWarning(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    // Check if event is in owned_events localStorage
    const ownedEvents = JSON.parse(localStorage.getItem('owned_events') || '[]');
    if (!userId && !ownedEvents.includes(eventId)) {
      toast({ 
        title: 'Error', 
        description: 'You cannot set a password because this event is not confirmed to be yours.',
        variant: 'destructive'
      });
      setShowPasswordModal(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ password })
        .eq('id', eventId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Event password set successfully' });
      setShowPasswordModal(false);
      fetchEvent();
    } catch (error) {
      console.error('Error setting password:', error);
      toast({ title: 'Error', description: 'Failed to set password', variant: 'destructive' });
    }
  };

  const handleRemovePassword = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ password: null })
        .eq('id', eventId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Event password removed' });
      fetchEvent();
    } catch (error) {
      console.error('Error removing password:', error);
      toast({ title: 'Error', description: 'Failed to remove password', variant: 'destructive' });
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
            <h1 className="text-2xl font-bold text-gradient">Edit Event Details</h1>
          </div>
          <ThemeSelector />
        </div>
      </header>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Important Changes Detected
            </DialogTitle>
            <DialogDescription>
              You've changed key event details (name, date, theme, location, or duration).
              This may affect your event plan, timeline, budget, and other AI-generated content.
              You should regenerate these after saving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Cancel
            </Button>
            <Button onClick={saveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EventPasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        isSettingPassword
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!userId && (
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Guest Mode:</strong> Set a password to protect your event from unauthorized edits.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Changing key details like date, theme, or location may require regenerating your event plan and timeline.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!userId && (
              <div className="space-y-2 pb-4 border-b">
                <Label>Event Password Protection</Label>
                <div className="flex gap-2">
                  {event?.password ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowPasswordModal(true)}
                        className="flex-1"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleRemovePassword}
                        className="flex-1"
                      >
                        Remove Password
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Set Password
                    </Button>
                  )}
                </div>
                {event?.password && (
                  <p className="text-sm text-muted-foreground">
                    Password protection is enabled for this event
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter event name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief description of your event"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme_preferences">Theme</Label>
              <Input
                id="theme_preferences"
                value={formData.theme_preferences}
                onChange={(e) => setFormData({ ...formData, theme_preferences: e.target.value })}
                placeholder="Event theme"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_name">Location</Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_duration">Duration (hours)</Label>
              <Input
                id="event_duration"
                type="number"
                value={formData.event_duration}
                onChange={(e) => setFormData({ ...formData, event_duration: Number(e.target.value) })}
                placeholder="Event duration in hours"
              />
            </div>

            <ImageGeneratorUploader
              prompt={`A beautiful event image for ${formData.name || 'an event'}, ${formData.theme_preferences || 'elegant theme'}, ${formData.event_duration || ''}${formData.event_duration ? ' hours' : ''}`}
              context={formData}
              currentImage={formData.event_image}
              onImageChange={(url) => setFormData({ ...formData, event_image: url })}
              label="Event Cover Image (Optional)"
            />
            {formData.event_image && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, event_image: '' })}
                className="w-full mt-2"
              >
                Remove Image
              </Button>
            )}

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/event/${eventId}`)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}