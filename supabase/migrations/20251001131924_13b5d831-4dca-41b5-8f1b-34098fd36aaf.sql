-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  plan_mode TEXT NOT NULL CHECK (plan_mode IN ('organizer', 'attendee', 'lite_setup', 'quick_ideas')),
  event_type TEXT NOT NULL,
  theme_preferences TEXT,
  estimated_guests INTEGER,
  estimated_budget DECIMAL(10,2),
  guest_age_range TEXT,
  guest_gender TEXT,
  color_theme TEXT,
  currency TEXT DEFAULT 'USD',
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_name TEXT,
  country TEXT,
  state TEXT,
  event_duration INTEGER,
  event_date DATE NOT NULL,
  event_time TIME,
  special_notes TEXT,
  weather_data JSONB,
  venue_recommendation TEXT,
  ai_generated_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT,
  due_date DATE,
  start_date DATE,
  assigned_to TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_items table
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  estimated_cost DECIMAL(10,2) NOT NULL,
  actual_cost DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invites table
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  email_template TEXT,
  short_message TEXT,
  long_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timeline_events table
CREATE TABLE public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can view their own events" 
ON public.events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.events FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks for their events" 
ON public.tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = tasks.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can create tasks for their events" 
ON public.tasks FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = tasks.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can update tasks for their events" 
ON public.tasks FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = tasks.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete tasks for their events" 
ON public.tasks FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = tasks.event_id 
  AND events.user_id = auth.uid()
));

-- Create RLS policies for budget_items
CREATE POLICY "Users can view budget items for their events" 
ON public.budget_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = budget_items.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can create budget items for their events" 
ON public.budget_items FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = budget_items.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can update budget items for their events" 
ON public.budget_items FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = budget_items.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete budget items for their events" 
ON public.budget_items FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = budget_items.event_id 
  AND events.user_id = auth.uid()
));

-- Create RLS policies for invites
CREATE POLICY "Users can view invites for their events" 
ON public.invites FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = invites.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can create invites for their events" 
ON public.invites FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = invites.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can update invites for their events" 
ON public.invites FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = invites.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete invites for their events" 
ON public.invites FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = invites.event_id 
  AND events.user_id = auth.uid()
));

-- Create RLS policies for timeline_events
CREATE POLICY "Users can view timeline events for their events" 
ON public.timeline_events FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = timeline_events.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can create timeline events for their events" 
ON public.timeline_events FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = timeline_events.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can update timeline events for their events" 
ON public.timeline_events FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = timeline_events.event_id 
  AND events.user_id = auth.uid()
));

CREATE POLICY "Users can delete timeline events for their events" 
ON public.timeline_events FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = timeline_events.event_id 
  AND events.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invites_updated_at
BEFORE UPDATE ON public.invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at
BEFORE UPDATE ON public.timeline_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();