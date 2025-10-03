import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-typed';
import { useToast } from '@/hooks/use-toast';

export interface Event {
  id: string;
  user_id: string;
  clerk_user_id?: string;
  password?: string;
  name: string;
  event_type: string;
  plan_mode: string;
  theme_preferences?: string;
  event_date: string;
  event_time?: string;
  estimated_guests?: number;
  estimated_budget?: number;
  currency?: string;
  location_name?: string;
  country?: string;
  state?: string;
  location_lat?: number;
  location_lng?: number;
  event_duration?: number;
  guest_age_range?: string;
  guest_gender?: string;
  color_theme?: string;
  weather_data?: any;
  ai_generated_description?: string;
  venue_recommendation?: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const createEvent = async (eventData: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>, clerkUserId?: string | null) => {
    try {
      // Filter out fields that don't exist in the database schema
      const {
        countryCode,
        stateCode,
        ...validEventData
      } = eventData as any;

      console.log('Creating event with data:', { ...validEventData, clerk_user_id: clerkUserId });

      const { data, error } = await (supabase as any)
        .from('events')
        .insert([{ 
          ...validEventData, 
          user_id: null, // Always null - using clerk_user_id for authenticated users
          clerk_user_id: clerkUserId || null // Null for guests, set for authenticated users
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error creating event:', error);
        throw error;
      }
      
      // Store in localStorage for guest users
      if (!clerkUserId) {
        const guestEvents = JSON.parse(localStorage.getItem('guestEvents') || '[]');
        guestEvents.push(data.id);
        localStorage.setItem('guestEvents', JSON.stringify(guestEvents));
      }
      
      await fetchEvents();
      console.log('Event created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error creating event:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const { error } = await (supabase as any)
        .from('events')
        .update(eventData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
