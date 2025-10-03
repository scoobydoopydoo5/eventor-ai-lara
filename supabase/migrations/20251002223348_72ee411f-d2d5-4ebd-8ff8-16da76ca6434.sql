-- Add password field to events table for guest password protection
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS password TEXT;

-- Add user_id field for Clerk users (text to store clerk user id)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;