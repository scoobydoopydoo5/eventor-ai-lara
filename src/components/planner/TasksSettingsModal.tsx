import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTaskSettings } from '@/hooks/useTaskSettings';
import { useToast } from '@/hooks/use-toast';

interface TasksSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function TasksSettingsModal({ open, onOpenChange, eventId }: TasksSettingsModalProps) {
  const { settings, updateSettings, loading } = useTaskSettings(eventId);
  const { toast } = useToast();

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    try {
      await updateSettings({ [key]: value });
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="keep-completed">Keep Completed Tasks in List</Label>
              <p className="text-sm text-muted-foreground">
                Show completed tasks in the todo list instead of hiding them
              </p>
            </div>
            <Switch
              id="keep-completed"
              checked={settings?.keep_completed_in_list ?? true}
              onCheckedChange={(checked) => handleToggleSetting('keep_completed_in_list', checked)}
              disabled={loading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
