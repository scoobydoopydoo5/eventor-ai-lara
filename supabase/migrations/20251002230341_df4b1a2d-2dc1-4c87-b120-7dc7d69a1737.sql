-- Add new columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'attendee',
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add username index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- Add a column to track if user has seen guest mode warning
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  has_seen_guest_warning BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (clerk_user_id = auth.jwt() ->> 'sub' OR true);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (clerk_user_id = auth.jwt() ->> 'sub' OR true);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (true);