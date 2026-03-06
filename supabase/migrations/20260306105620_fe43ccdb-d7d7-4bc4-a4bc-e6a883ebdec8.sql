-- Table to persist SPR vaccine availability status
CREATE TABLE public.spr_servicios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zona TEXT NOT NULL,
  distrito TEXT NOT NULL,
  servicio TEXT NOT NULL,
  disponibilidad BOOLEAN NOT NULL DEFAULT false,
  despachado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (distrito, servicio)
);

-- Enable RLS
ALTER TABLE public.spr_servicios ENABLE ROW LEVEL SECURITY;

-- Public read/write access (internal monitoring tool)
CREATE POLICY "Anyone can read spr_servicios"
  ON public.spr_servicios FOR SELECT USING (true);

CREATE POLICY "Anyone can insert spr_servicios"
  ON public.spr_servicios FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update spr_servicios"
  ON public.spr_servicios FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_spr_servicios_updated_at
  BEFORE UPDATE ON public.spr_servicios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();