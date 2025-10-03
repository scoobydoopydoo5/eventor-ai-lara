-- Create trigger to automatically sync user_id with clerk_user_id in user_profiles
CREATE OR REPLACE FUNCTION public.sync_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If clerk_user_id is being set, automatically copy it to user_id
  IF NEW.clerk_user_id IS NOT NULL THEN
    NEW.user_id := NEW.clerk_user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT and UPDATE operations
DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_profiles;
CREATE TRIGGER sync_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_id();