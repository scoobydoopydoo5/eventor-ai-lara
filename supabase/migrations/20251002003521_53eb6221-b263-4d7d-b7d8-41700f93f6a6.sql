-- Create game settings table
CREATE TABLE IF NOT EXISTS public.game_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  ai_trivia_enabled BOOLEAN DEFAULT true,
  jeopardy_enabled BOOLEAN DEFAULT true,
  quizizz_enabled BOOLEAN DEFAULT true,
  ice_breakers_enabled BOOLEAN DEFAULT true,
  jokes_enabled BOOLEAN DEFAULT true,
  emoji_guess_enabled BOOLEAN DEFAULT true,
  random_task_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Enable RLS
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read game settings
CREATE POLICY "Anyone can view game settings"
ON public.game_settings FOR SELECT
USING (true);

-- Allow anyone to insert/update game settings
CREATE POLICY "Anyone can manage game settings"
ON public.game_settings FOR ALL
USING (true);

-- Create game rooms table for multiplayer games
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  game_type TEXT NOT NULL,
  room_code TEXT NOT NULL,
  game_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, room_code)
);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game rooms"
ON public.game_rooms FOR SELECT
USING (true);

CREATE POLICY "Anyone can create game rooms"
ON public.game_rooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update game rooms"
ON public.game_rooms FOR UPDATE
USING (true);