import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TaskSettings {
  id?: string;
  event_id: string;
  keep_completed_in_list: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useTaskSettings = (eventId: string) => {
  const [settings, setSettings] = useState<TaskSettings>({
    event_id: eventId,
    keep_completed_in_list: true,
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('task_settings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching task settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<TaskSettings>) => {
    try {
      if (settings.id) {
        const { error } = await (supabase as any)
          .from('task_settings')
          .update(newSettings)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from('task_settings')
          .insert({ ...newSettings, event_id: eventId })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating task settings:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchSettings();
    }
  }, [eventId]);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings,
  };
};
