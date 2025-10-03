-- Create task_settings table if not exists
CREATE TABLE IF NOT EXISTS public.task_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  keep_completed_in_list BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id)
);

ALTER TABLE public.task_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task settings" ON public.task_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert task settings" ON public.task_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update task settings" ON public.task_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete task settings" ON public.task_settings FOR DELETE USING (true);

-- Create themes table
CREATE TABLE IF NOT EXISTS public.event_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL,
  theme_description TEXT NOT NULL,
  color_palette JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view themes" ON public.event_themes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert themes" ON public.event_themes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update themes" ON public.event_themes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete themes" ON public.event_themes FOR DELETE USING (true);

-- Create flights table
CREATE TABLE IF NOT EXISTS public.event_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  airline TEXT NOT NULL,
  flight_number TEXT,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  departure_location TEXT NOT NULL,
  arrival_location TEXT NOT NULL,
  stops INTEGER DEFAULT 0,
  price TEXT,
  booking_link TEXT,
  flight_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.event_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flights" ON public.event_flights FOR SELECT USING (true);
CREATE POLICY "Anyone can insert flights" ON public.event_flights FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete flights" ON public.event_flights FOR DELETE USING (true);

-- Create decorations table
CREATE TABLE IF NOT EXISTS public.event_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  purchase_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.event_decorations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view decorations" ON public.event_decorations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert decorations" ON public.event_decorations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update decorations" ON public.event_decorations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete decorations" ON public.event_decorations FOR DELETE USING (true);

-- Add residency_country to user_profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'user_profiles' 
                 AND column_name = 'residency_country') THEN
    ALTER TABLE public.user_profiles ADD COLUMN residency_country TEXT;
  END IF;
END $$;