-- Create table for FAQs
CREATE TABLE public.event_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_faqs ENABLE ROW LEVEL SECURITY;

-- Create policies for FAQs
CREATE POLICY "Anyone can view FAQs" 
ON public.event_faqs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create FAQs" 
ON public.event_faqs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update FAQs" 
ON public.event_faqs 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete FAQs" 
ON public.event_faqs 
FOR DELETE 
USING (true);

-- Create table for Speeches
CREATE TABLE public.event_speeches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  speech_type TEXT NOT NULL,
  speech_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_speeches ENABLE ROW LEVEL SECURITY;

-- Create policies for Speeches
CREATE POLICY "Anyone can view speeches" 
ON public.event_speeches 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create speeches" 
ON public.event_speeches 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update speeches" 
ON public.event_speeches 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete speeches" 
ON public.event_speeches 
FOR DELETE 
USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_event_faqs_updated_at
BEFORE UPDATE ON public.event_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_speeches_updated_at
BEFORE UPDATE ON public.event_speeches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();