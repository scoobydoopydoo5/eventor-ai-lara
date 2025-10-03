-- Add memory_images and event_image columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS memory_images TEXT[],
ADD COLUMN IF NOT EXISTS event_image TEXT;

-- Add image_url column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to budget_items table
ALTER TABLE public.budget_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_events_memory_images ON public.events USING GIN(memory_images);
