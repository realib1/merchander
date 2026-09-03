CREATE TABLE public.platform_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  platform_name text NOT NULL DEFAULT 'Merchander',
  support_email text,
  default_currency text DEFAULT 'GHS',
  maintenance_mode boolean NOT NULL DEFAULT false,
  disable_new_signups boolean NOT NULL DEFAULT false,
  integrations jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS: Only platform staff with the correct role can view or edit
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform staff can view settings" 
ON public.platform_settings FOR SELECT 
TO authenticated USING (private.is_platform_staff());

CREATE POLICY "Platform staff can update settings" 
ON public.platform_settings FOR UPDATE 
TO authenticated USING (private.is_platform_staff());

-- Insert the singleton row
INSERT INTO public.platform_settings (id) VALUES (1);
