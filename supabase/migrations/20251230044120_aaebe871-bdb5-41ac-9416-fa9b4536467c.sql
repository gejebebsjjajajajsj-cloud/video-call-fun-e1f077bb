-- Add site_id to separate configs per site/host
ALTER TABLE public.call_config
ADD COLUMN IF NOT EXISTS site_id text NOT NULL DEFAULT '';

-- Ensure one config per site
CREATE UNIQUE INDEX IF NOT EXISTS call_config_site_id_key
ON public.call_config(site_id);