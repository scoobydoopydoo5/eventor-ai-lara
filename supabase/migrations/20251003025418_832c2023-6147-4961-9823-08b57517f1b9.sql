-- -- Add checked_in status to event_attendees
ALTER TABLE public.event_attendees 
ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Add card visibility settings to event_settings
ALTER TABLE public.event_settings 
ADD COLUMN IF NOT EXISTS visible_cards JSONB DEFAULT '["details", "planner", "memories", "full-plan", "tasks", "budget", "invites", "timeline", "vendors", "guests", "tickets", "food", "souvenirs", "weather", "sponsors", "speeches", "faqs", "blogs", "chat", "themes", "decor", "flights"]'::jsonb;