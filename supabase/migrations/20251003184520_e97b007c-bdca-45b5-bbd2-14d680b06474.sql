-- Create game_room_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.game_room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_id TEXT,
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, participant_name)
);

-- Enable RLS on participants table
ALTER TABLE public.game_room_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view participants" ON public.game_room_participants;
  DROP POLICY IF EXISTS "Anyone can join rooms" ON public.game_room_participants;
  DROP POLICY IF EXISTS "Anyone can update their participant" ON public.game_room_participants;
  DROP POLICY IF EXISTS "Anyone can leave rooms" ON public.game_room_participants;
END $$;

-- Create policies for game_room_participants
CREATE POLICY "Anyone can view participants" ON public.game_room_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON public.game_room_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update their participant" ON public.game_room_participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can leave rooms" ON public.game_room_participants FOR DELETE USING (true);

-- Enable realtime for participants table
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_room_participants;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_room_participants_room ON public.game_room_participants(room_id);