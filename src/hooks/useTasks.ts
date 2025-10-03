import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  start_date?: string;
  due_date?: string;
  start_time?: string;
  due_time?: string;
  assigned_to?: string;
  position: number;
  url?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const useTasks = (eventId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*')
        .eq('event_id', eventId)
        .order('position', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [eventId]);

  const createTask = async (taskData: Omit<Task, 'id' | 'event_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .insert([{ ...taskData, event_id: eventId }])
        .select()
        .single();

      if (error) throw error;
      await fetchTasks();
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    try {
      const { error } = await (supabase as any)
        .from('tasks')
        .update(taskData)
        .eq('id', id);

      if (error) throw error;
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};
