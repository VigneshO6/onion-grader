ALTER TABLE public.onion_reports
  ADD COLUMN IF NOT EXISTS onion_type text NOT NULL DEFAULT 'big',
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS condition_confidence numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_status text NOT NULL DEFAULT '';