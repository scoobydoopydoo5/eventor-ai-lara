import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase-typed";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface TaskSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export function TaskSettingsDialog({
  open,
  onOpenChange,
  eventId,
}: TaskSettingsDialogProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    strike_through_completed: true,
    keep_sections_expanded: false,
    divide_tasks_to_sections: true,
    read_only_mode: false,
    move_completed_to_section: false,
  });

  useEffect(() => {
    if (open && eventId) {
      loadSettings();
    }
  }, [open, eventId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("task_settings")
        .select("*")
        .eq("event_id", eventId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading task settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      const { data: existing } = await (supabase as any)
        .from("task_settings")
        .select("id")
        .eq("event_id", eventId)
        .single();

      if (existing) {
        const { error } = await (supabase as any)
          .from("task_settings")
          .update(settings)
          .eq("event_id", eventId);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("task_settings")
          .insert({ ...settings, event_id: eventId });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Task settings saved",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving task settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Task Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Strike Through Completed</Label>
              <p className="text-xs text-muted-foreground">
                Show completed tasks with strikethrough text
              </p>
            </div>
            <Switch
              checked={settings.strike_through_completed}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, strike_through_completed: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Keep Sections Expanded</Label>
              <p className="text-xs text-muted-foreground">
                All sections will stay expanded by default
              </p>
            </div>
            <Switch
              checked={settings.keep_sections_expanded}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, keep_sections_expanded: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Divide Tasks to Sections</Label>
              <p className="text-xs text-muted-foreground">
                Organize tasks into custom sections
              </p>
            </div>
            <Switch
              checked={settings.divide_tasks_to_sections}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, divide_tasks_to_sections: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Read-Only Mode</Label>
              <p className="text-xs text-muted-foreground">
                Can only check/uncheck tasks, no editing
              </p>
            </div>
            <Switch
              checked={settings.read_only_mode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, read_only_mode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Move Completed to Section</Label>
              <p className="text-xs text-muted-foreground">
                Move completed tasks to completed section
              </p>
            </div>
            <Switch
              checked={settings.move_completed_to_section}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, move_completed_to_section: checked })
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
