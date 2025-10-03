// Typed wrapper for Supabase client to bypass empty type definitions
import { supabase as baseSupabase } from '@/integrations/supabase/client';

// Export typed supabase client that bypasses the empty Database type
export const supabase = baseSupabase as any;
