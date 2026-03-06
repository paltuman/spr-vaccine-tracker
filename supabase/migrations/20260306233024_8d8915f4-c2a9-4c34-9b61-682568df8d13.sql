
CREATE TABLE public.lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Anyone can read lotes
CREATE POLICY "Anyone can read lotes" ON public.lotes FOR SELECT USING (true);

-- Only authenticated users can insert lotes
CREATE POLICY "Authenticated users can insert lotes" ON public.lotes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can delete lotes
CREATE POLICY "Authenticated users can delete lotes" ON public.lotes FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
