-- Create notes table for planner
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT,
  color TEXT NOT NULL DEFAULT '#fef08a',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Anyone can view notes"
  ON public.notes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create notes"
  ON public.notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update notes"
  ON public.notes
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete notes"
  ON public.notes
  FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();