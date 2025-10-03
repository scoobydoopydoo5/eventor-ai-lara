-- Create blogs table
CREATE TABLE public.event_blogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  blog_number integer NOT NULL,
  is_published boolean DEFAULT false,
  author_name text DEFAULT 'Event Organizer',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create blog comments table
CREATE TABLE public.blog_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid NOT NULL,
  author_name text NOT NULL,
  comment_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create blog reactions table (likes/dislikes)
CREATE TABLE public.blog_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid NOT NULL,
  user_identifier text NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blog_id, user_identifier)
);

-- Create event winner table
CREATE TABLE public.event_winners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL UNIQUE,
  winner_name text NOT NULL,
  custom_names jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add winner_enabled column to ticket_config
ALTER TABLE public.ticket_config
ADD COLUMN winner_enabled boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.event_blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_blogs
CREATE POLICY "Anyone can view published blogs"
ON public.event_blogs FOR SELECT
USING (is_published = true);

CREATE POLICY "Anyone can view all blogs"
ON public.event_blogs FOR SELECT
USING (true);

CREATE POLICY "Anyone can create blogs"
ON public.event_blogs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update blogs"
ON public.event_blogs FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete blogs"
ON public.event_blogs FOR DELETE
USING (true);

-- RLS Policies for blog_comments
CREATE POLICY "Anyone can view comments"
ON public.blog_comments FOR SELECT
USING (true);

CREATE POLICY "Anyone can create comments"
ON public.blog_comments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete comments"
ON public.blog_comments FOR DELETE
USING (true);

-- RLS Policies for blog_reactions
CREATE POLICY "Anyone can view reactions"
ON public.blog_reactions FOR SELECT
USING (true);

CREATE POLICY "Anyone can create reactions"
ON public.blog_reactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update reactions"
ON public.blog_reactions FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete reactions"
ON public.blog_reactions FOR DELETE
USING (true);

-- RLS Policies for event_winners
CREATE POLICY "Anyone can view winners"
ON public.event_winners FOR SELECT
USING (true);

CREATE POLICY "Anyone can create winners"
ON public.event_winners FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update winners"
ON public.event_winners FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete winners"
ON public.event_winners FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_event_blogs_updated_at
BEFORE UPDATE ON public.event_blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_winners_updated_at
BEFORE UPDATE ON public.event_winners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_event_blogs_event_id ON public.event_blogs(event_id);
CREATE INDEX idx_blog_comments_blog_id ON public.blog_comments(blog_id);
CREATE INDEX idx_blog_reactions_blog_id ON public.blog_reactions(blog_id);