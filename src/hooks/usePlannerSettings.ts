import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

export interface PlannerSettings {
  id?: string;
  event_id: string;
  remove_completed_from_todo: boolean;
  show_completed_tasks: boolean;
  default_view: string;
  play_tictactoe_loading: boolean;
}

export const usePlannerSettings = (eventId: string) => {
  const [settings, setSettings] = useState<PlannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('planner_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const defaultSettings = {
          event_id: eventId,
          remove_completed_from_todo: false,
          show_completed_tasks: true,
          default_view: 'dashboard',
          play_tictactoe_loading: false,
        };
        
        const { data: newData, error: createError } = await (supabase as any)
          .from('planner_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newData);
      }
    } catch (error) {
      console.error('Error fetching planner settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [eventId]);

  const updateSettings = async (updates: Partial<PlannerSettings>) => {
    if (!settings?.id) return;

    try {
      const { error } = await (supabase as any)
        .from('planner_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating planner settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};
