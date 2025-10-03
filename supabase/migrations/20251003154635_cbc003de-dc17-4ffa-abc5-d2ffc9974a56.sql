-- Idempotent policy creation for survey publishing fix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'survey_questions' AND policyname = 'Anyone can insert questions'
  ) THEN
    CREATE POLICY "Anyone can insert questions"
    ON public.survey_questions
    FOR INSERT
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'surveys' AND policyname = 'Users can update surveys without creator'
  ) THEN
    CREATE POLICY "Users can update surveys without creator"
    ON public.surveys
    FOR UPDATE
    USING (creator_id IS NULL OR creator_id = ((current_setting('request.jwt.claims', true))::json ->> 'sub'))
    WITH CHECK (creator_id IS NULL OR creator_id = ((current_setting('request.jwt.claims', true))::json ->> 'sub'));
  END IF;
END $$;