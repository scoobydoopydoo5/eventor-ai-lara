-- Refresh database types
-- This migration ensures all table types are properly synchronized

-- Add a comment to trigger types regeneration
COMMENT ON TABLE public.events IS 'Core events table for event management';
