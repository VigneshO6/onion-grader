CREATE TABLE public.farmer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  farm_size_acres NUMERIC,
  onion_variety TEXT NOT NULL DEFAULT '',
  harvest_date DATE,
  storage_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_profiles TO authenticated;
GRANT ALL ON public.farmer_profiles TO service_role;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers manage their own profile" ON public.farmer_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.onion_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lot_id TEXT NOT NULL,
  total_onions INTEGER NOT NULL DEFAULT 0,
  grade_a_percent NUMERIC NOT NULL DEFAULT 0,
  urs_percent NUMERIC NOT NULL DEFAULT 0,
  reject_percent NUMERIC NOT NULL DEFAULT 0,
  avg_diameter_mm INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  defects JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  farmer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onion_reports TO authenticated;
GRANT ALL ON public.onion_reports TO service_role;
ALTER TABLE public.onion_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Farmers manage their own reports" ON public.onion_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX onion_reports_user_created_idx ON public.onion_reports (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER farmer_profiles_updated_at
BEFORE UPDATE ON public.farmer_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.farmer_profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();