-- Create attendee_plans table for storing attendee planning data
CREATE TABLE IF NOT EXISTS public.attendee_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  attendee_name TEXT NOT NULL,
  plan_data JSONB,
  outfit_suggestions JSONB DEFAULT '[]'::jsonb,
  prep_checklist JSONB DEFAULT '[]'::jsonb,
  gift_ideas JSONB DEFAULT '[]'::jsonb,
  budget_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendee_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for attendee_plans
CREATE POLICY "Anyone can view attendee plans"
  ON public.attendee_plans FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create attendee plans"
  ON public.attendee_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update attendee plans"
  ON public.attendee_plans FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete attendee plans"
  ON public.attendee_plans FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_attendee_plans_updated_at
  BEFORE UPDATE ON public.attendee_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();