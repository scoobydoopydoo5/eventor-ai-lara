import { FiSettings } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface TimelineSettingsDialogProps {
  includePrep: boolean;
  onTogglePrep: (value: boolean) => void;
  onRegenerate: () => void;
  loading?: boolean;
}

export function TimelineSettingsDialog({
  includePrep,
  onTogglePrep,
  onRegenerate,
  loading,
}: TimelineSettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FiSettings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timeline Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Include Preparation Timeline</Label>
              <p className="text-sm text-muted-foreground">
                Show 2-3 days of prep activities before the event
              </p>
            </div>
            <Switch checked={includePrep} onCheckedChange={onTogglePrep} />
          </div>
          
          <Button onClick={onRegenerate} disabled={loading} className="w-full">
            {loading ? 'Regenerating...' : 'Regenerate Timeline'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
