-- Fix tasks status check constraint to allow proper values
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'in-progress', 'completed'));

-- Add a notes column for additional task information
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes text;

-- Add a url column for venue/resource links
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS url text;