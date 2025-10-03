-- Add public/private status and invite code to events table
ALTER TABLE public.events 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN invite_code text UNIQUE,
ADD COLUMN short_description text;

-- Create event_attendees table
CREATE TABLE public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  attendee_name text NOT NULL,
  attendee_type text NOT NULL DEFAULT 'regular', -- regular, vip, free_invited
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create event_favorites table
CREATE TABLE public.event_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_identifier text NOT NULL, -- Can be user ID or session ID
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_identifier)
);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_attendees
CREATE POLICY "Anyone can view attendees"
ON public.event_attendees FOR SELECT USING (true);

CREATE POLICY "Anyone can create attendees"
ON public.event_attendees FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update attendees"
ON public.event_attendees FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete attendees"
ON public.event_attendees FOR DELETE USING (true);

-- RLS Policies for event_favorites
CREATE POLICY "Anyone can view favorites"
ON public.event_favorites FOR SELECT USING (true);

CREATE POLICY "Anyone can create favorites"
ON public.event_favorites FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete favorites"
ON public.event_favorites FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_event_favorites_event_id ON public.event_favorites(event_id);
CREATE INDEX idx_events_is_public ON public.events(is_public);

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  characters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;