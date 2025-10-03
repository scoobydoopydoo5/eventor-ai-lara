-- Add tags column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Add start_time and due_time columns for time tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_time time without time zone;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time time without time zone;

-- Create planner_settings table for user preferences
CREATE TABLE IF NOT EXISTS planner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  remove_completed_from_todo boolean DEFAULT false,
  show_completed_tasks boolean DEFAULT true,
  default_view text DEFAULT 'dashboard',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for planner_settings
ALTER TABLE planner_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for planner_settings
CREATE POLICY "Anyone can view planner settings"
  ON planner_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create planner settings"
  ON planner_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update planner settings"
  ON planner_settings FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete planner settings"
  ON planner_settings FOR DELETE
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_planner_settings_updated_at
  BEFORE UPDATE ON planner_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create kanban_columns table for custom columns
CREATE TABLE IF NOT EXISTS kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  color text DEFAULT '#000000',
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for kanban_columns
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

-- Create policies for kanban_columns
CREATE POLICY "Anyone can view kanban columns"
  ON kanban_columns FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create kanban columns"
  ON kanban_columns FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update kanban columns"
  ON kanban_columns FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete kanban columns"
  ON kanban_columns FOR DELETE
  USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_kanban_columns_updated_at
  BEFORE UPDATE ON kanban_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();