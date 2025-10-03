import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

export interface BudgetItem {
  id: string;
  event_id: string;
  item_name: string;
  category: string;
  estimated_cost: number;
  actual_cost?: number;
  quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useBudget = (eventId: string) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBudgetItems = async () => {
    if (!eventId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('budget_items')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (error) {
      console.error('Error fetching budget items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetItems();
  }, [eventId]);

  const createBudgetItem = async (itemData: Omit<BudgetItem, 'id' | 'event_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('budget_items')
        .insert([{ ...itemData, event_id: eventId }])
        .select()
        .single();

      if (error) throw error;
      await fetchBudgetItems();
      return data;
    } catch (error) {
      console.error('Error creating budget item:', error);
      toast({
        title: "Error",
        description: "Failed to create budget item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBudgetItem = async (id: string, itemData: Partial<BudgetItem>) => {
    try {
      const { error } = await (supabase as any)
        .from('budget_items')
        .update(itemData)
        .eq('id', id);

      if (error) throw error;
      await fetchBudgetItems();
    } catch (error) {
      console.error('Error updating budget item:', error);
      toast({
        title: "Error",
        description: "Failed to update budget item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBudgetItem = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('budget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBudgetItems();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast({
        title: "Error",
        description: "Failed to delete budget item",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    budgetItems,
    loading,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    refetch: fetchBudgetItems,
  };
};
