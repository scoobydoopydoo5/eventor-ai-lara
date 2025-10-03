-- Create vendors table to store added vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price TEXT,
  rating TEXT,
  availability TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view vendors"
  ON public.vendors FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update vendors"
  ON public.vendors FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete vendors"
  ON public.vendors FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to store card positions
CREATE TABLE IF NOT EXISTS public.event_card_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  card_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_identifier, event_id)
);

-- Enable RLS
ALTER TABLE public.event_card_positions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view card positions"
  ON public.event_card_positions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert card positions"
  ON public.event_card_positions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update card positions"
  ON public.event_card_positions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete card positions"
  ON public.event_card_positions FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_event_card_positions_updated_at
  BEFORE UPDATE ON public.event_card_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();