-- Create timer_settings table
CREATE TABLE IF NOT EXISTS public.timer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  timer_style TEXT DEFAULT 'digital',
  show_progress_bar BOOLEAN DEFAULT true,
  background_color TEXT DEFAULT '#3b82f6',
  font_color TEXT DEFAULT '#ffffff',
  font_family TEXT DEFAULT 'Inter',
  font_size INTEGER DEFAULT 64,
  show_months BOOLEAN DEFAULT false,
  show_days BOOLEAN DEFAULT true,
  show_hours BOOLEAN DEFAULT true,
  show_minutes BOOLEAN DEFAULT true,
  show_seconds BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Enable RLS on timer_settings
ALTER TABLE public.timer_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for timer_settings
CREATE POLICY "Anyone can view timer settings"
  ON public.timer_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert timer settings"
  ON public.timer_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update timer settings"
  ON public.timer_settings FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete timer settings"
  ON public.timer_settings FOR DELETE
  USING (true);

-- Add trigger for updated_at on timer_settings
CREATE TRIGGER update_timer_settings_updated_at
  BEFORE UPDATE ON public.timer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update kanban_columns table to add is_default column
ALTER TABLE public.kanban_columns ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;