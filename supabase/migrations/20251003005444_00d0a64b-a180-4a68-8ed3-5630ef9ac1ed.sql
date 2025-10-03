-- Add user_id column to user_profiles to mirror clerk_user_id
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_id text;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);