-- Trigger types regeneration
-- This comment ensures types are regenerated for all existing tables

-- Verify all tables exist and are accessible
DO $$ 
BEGIN
  -- This is a no-op migration to trigger types regeneration
  -- All tables should already exist from previous migrations
  RAISE NOTICE 'Types regeneration triggered';
END $$;