-- Create user profiles table for Clerk users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user balloons table
CREATE TABLE IF NOT EXISTS public.user_balloons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create balloon transactions table
CREATE TABLE IF NOT EXISTS public.balloon_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pricing plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  balloon_amount INTEGER NOT NULL DEFAULT 0,
  daily_balloons INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balloons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balloon_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public access since we're using Clerk for auth)
CREATE POLICY "Anyone can view profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON public.user_profiles FOR UPDATE USING (true);

CREATE POLICY "Anyone can view balloons" ON public.user_balloons FOR SELECT USING (true);
CREATE POLICY "Anyone can insert balloons" ON public.user_balloons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update balloons" ON public.user_balloons FOR UPDATE USING (true);

CREATE POLICY "Anyone can view transactions" ON public.balloon_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transactions" ON public.balloon_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view pricing plans" ON public.pricing_plans FOR SELECT USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balloons_updated_at
  BEFORE UPDATE ON public.user_balloons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample pricing plans
INSERT INTO public.pricing_plans (name, price, balloon_amount, daily_balloons, features) VALUES
  ('Starter Bundle', 4.99, 50, 0, '["50 Balloons", "One-time purchase", "No expiry"]'::jsonb),
  ('Pro Bundle', 9.99, 120, 0, '["120 Balloons", "One-time purchase", "20% bonus"]'::jsonb),
  ('Premium Bundle', 19.99, 300, 0, '["300 Balloons", "One-time purchase", "50% bonus"]'::jsonb),
  ('Pro Monthly', 14.99, 0, 20, '["20 Daily Balloons", "Monthly subscription", "Priority support"]'::jsonb),
  ('Premium Monthly', 29.99, 0, 50, '["50 Daily Balloons", "Monthly subscription", "Priority support", "Exclusive features"]'::jsonb);