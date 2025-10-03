-- Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER NOT NULL DEFAULT 0,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey questions table
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'text', 'rating')),
  options JSONB,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE,
  respondent_id TEXT,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  credits_awarded BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surveys
CREATE POLICY "Anyone can view published surveys"
  ON public.surveys FOR SELECT
  USING (is_published = true);

CREATE POLICY "Creators can view their own surveys"
  ON public.surveys FOR SELECT
  USING (creator_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Creators can create surveys"
  ON public.surveys FOR INSERT
  WITH CHECK (creator_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Creators can update their own surveys"
  ON public.surveys FOR UPDATE
  USING (creator_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for survey questions
CREATE POLICY "Anyone can view questions for published surveys"
  ON public.survey_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_questions.survey_id 
    AND surveys.is_published = true
  ));

CREATE POLICY "Creators can manage their survey questions"
  ON public.survey_questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_questions.survey_id 
    AND surveys.creator_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- RLS Policies for survey responses
CREATE POLICY "Anyone can submit responses to published surveys"
  ON public.survey_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_responses.survey_id 
    AND surveys.is_published = true
  ));

CREATE POLICY "Users can view their own responses"
  ON public.survey_responses FOR SELECT
  USING (respondent_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Survey creators can view responses"
  ON public.survey_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_responses.survey_id 
    AND surveys.creator_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Create indexes
CREATE INDEX idx_surveys_creator ON public.surveys(creator_id);
CREATE INDEX idx_survey_questions_survey ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_respondent ON public.survey_responses(respondent_id);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_surveys_timestamp
BEFORE UPDATE ON public.surveys
FOR EACH ROW
EXECUTE FUNCTION update_surveys_updated_at();