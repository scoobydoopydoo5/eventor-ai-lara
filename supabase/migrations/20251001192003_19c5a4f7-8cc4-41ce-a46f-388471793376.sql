-- Make user_id nullable in events table
ALTER TABLE public.events ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing RLS policies on events
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- Create new public policies for events
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Anyone can create events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events" ON public.events FOR DELETE USING (true);

-- Drop existing RLS policies on budget_items
DROP POLICY IF EXISTS "Users can view budget items for their events" ON public.budget_items;
DROP POLICY IF EXISTS "Users can create budget items for their events" ON public.budget_items;
DROP POLICY IF EXISTS "Users can update budget items for their events" ON public.budget_items;
DROP POLICY IF EXISTS "Users can delete budget items for their events" ON public.budget_items;

-- Create new public policies for budget_items
CREATE POLICY "Anyone can view budget items" ON public.budget_items FOR SELECT USING (true);
CREATE POLICY "Anyone can create budget items" ON public.budget_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update budget items" ON public.budget_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete budget items" ON public.budget_items FOR DELETE USING (true);

-- Drop existing RLS policies on tasks
DROP POLICY IF EXISTS "Users can view tasks for their events" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks for their events" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks for their events" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their events" ON public.tasks;

-- Create new public policies for tasks
CREATE POLICY "Anyone can view tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can create tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE USING (true);

-- Drop existing RLS policies on timeline_events
DROP POLICY IF EXISTS "Users can view timeline events for their events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can create timeline events for their events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can update timeline events for their events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users can delete timeline events for their events" ON public.timeline_events;

-- Create new public policies for timeline_events
CREATE POLICY "Anyone can view timeline events" ON public.timeline_events FOR SELECT USING (true);
CREATE POLICY "Anyone can create timeline events" ON public.timeline_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update timeline events" ON public.timeline_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete timeline events" ON public.timeline_events FOR DELETE USING (true);

-- Drop existing RLS policies on invites
DROP POLICY IF EXISTS "Users can view invites for their events" ON public.invites;
DROP POLICY IF EXISTS "Users can create invites for their events" ON public.invites;
DROP POLICY IF EXISTS "Users can update invites for their events" ON public.invites;
DROP POLICY IF EXISTS "Users can delete invites for their events" ON public.invites;

-- Create new public policies for invites
CREATE POLICY "Anyone can view invites" ON public.invites FOR SELECT USING (true);
CREATE POLICY "Anyone can create invites" ON public.invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invites" ON public.invites FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete invites" ON public.invites FOR DELETE USING (true);