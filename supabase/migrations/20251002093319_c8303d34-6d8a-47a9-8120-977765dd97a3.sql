-- Create chat sessions table
CREATE TABLE public.event_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  chat_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.event_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.event_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call history table
CREATE TABLE public.event_call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  summary TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_call_history ENABLE ROW LEVEL SECURITY;

-- Policies for chat sessions (public access for now)
CREATE POLICY "Anyone can view chat sessions" 
ON public.event_chat_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create chat sessions" 
ON public.event_chat_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update chat sessions" 
ON public.event_chat_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete chat sessions" 
ON public.event_chat_sessions 
FOR DELETE 
USING (true);

-- Policies for chat messages
CREATE POLICY "Anyone can view chat messages" 
ON public.event_chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create chat messages" 
ON public.event_chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete chat messages" 
ON public.event_chat_messages 
FOR DELETE 
USING (true);

-- Policies for call history
CREATE POLICY "Anyone can view call history" 
ON public.event_call_history 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create call history" 
ON public.event_call_history 
FOR INSERT 
WITH CHECK (true);

-- Trigger for updating chat sessions
CREATE TRIGGER update_event_chat_sessions_updated_at
BEFORE UPDATE ON public.event_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();