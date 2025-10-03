import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface PlannerSettings {
  viewMode: 'comfortable' | 'compact' | 'spacious';
  showCompletedTasks: boolean;
  autoRefresh: boolean;
  theme: 'light' | 'dark' | 'system';
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PlannerSettings;
  onSettingsChange: (settings: PlannerSettings) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: keyof PlannerSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Planner Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="viewMode">View Mode</Label>
              <Select
                value={localSettings.viewMode}
                onValueChange={(value) => handleSettingChange('viewMode', value)}
              >
                <SelectTrigger id="viewMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="showCompleted" className="cursor-pointer">
                Show Completed Tasks
              </Label>
              <Switch
                id="showCompleted"
                checked={localSettings.showCompletedTasks}
                onCheckedChange={(checked) => handleSettingChange('showCompletedTasks', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoRefresh" className="cursor-pointer">
                Auto-refresh Data
              </Label>
              <Switch
                id="autoRefresh"
                checked={localSettings.autoRefresh}
                onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={localSettings.theme}
                onValueChange={(value) => handleSettingChange('theme', value)}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
