-- Fix RLS policies for surveys table to allow guests to create surveys
DROP POLICY IF EXISTS "Creators can create surveys" ON surveys;

-- Allow anyone (including guests) to create surveys
CREATE POLICY "Anyone can create surveys" 
ON surveys 
FOR INSERT 
WITH CHECK (true);

-- Keep the existing policies for viewing
-- (Anyone can view published surveys, Creators can view their own surveys)