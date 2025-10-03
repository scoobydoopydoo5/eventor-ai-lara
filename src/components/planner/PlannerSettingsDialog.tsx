import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlannerSettings } from '@/hooks/usePlannerSettings';

interface PlannerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PlannerSettings | null;
  onSettingsUpdate: (updates: Partial<PlannerSettings>) => void;
}

export function PlannerSettingsDialog({ 
  open, 
  onOpenChange, 
  settings,
  onSettingsUpdate 
}: PlannerSettingsDialogProps) {
  if (!settings) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Planner Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-completed" className="flex-1">
              <div className="font-medium">Show Completed Tasks</div>
              <div className="text-sm text-muted-foreground">
                Display completed tasks in all views
              </div>
            </Label>
            <Switch
              id="show-completed"
              checked={settings.show_completed_tasks}
              onCheckedChange={(checked) => 
                onSettingsUpdate({ show_completed_tasks: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="remove-completed" className="flex-1">
              <div className="font-medium">Remove Completed from Todo</div>
              <div className="text-sm text-muted-foreground">
                Move completed tasks out of the Todo column
              </div>
            </Label>
            <Switch
              id="remove-completed"
              checked={settings.remove_completed_from_todo}
              onCheckedChange={(checked) => 
                onSettingsUpdate({ remove_completed_from_todo: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
