-- Cria tabela de configuração para vídeo e áudio da chamada
CREATE TABLE public.call_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT,
  audio_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insere configuração padrão
INSERT INTO public.call_config (id, video_url, audio_url) 
VALUES ('00000000-0000-0000-0000-000000000000', NULL, NULL);

-- Habilita RLS
ALTER TABLE public.call_config ENABLE ROW LEVEL SECURITY;

-- Permite leitura para todos (para exibir chamada)
CREATE POLICY "Qualquer um pode ler call_config"
ON public.call_config FOR SELECT
USING (true);

-- Apenas usuários autenticados podem atualizar
CREATE POLICY "Apenas autenticados podem atualizar call_config"
ON public.call_config FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Cria função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_call_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar automaticamente
CREATE TRIGGER update_call_config_timestamp
BEFORE UPDATE ON public.call_config
FOR EACH ROW
EXECUTE FUNCTION public.update_call_config_updated_at();

-- Cria bucket de storage para uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-media', 'call-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage: qualquer um pode ver
CREATE POLICY "Qualquer um pode ver arquivos de mídia"
ON storage.objects FOR SELECT
USING (bucket_id = 'call-media');

-- Apenas autenticados podem fazer upload
CREATE POLICY "Apenas autenticados podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'call-media' AND auth.uid() IS NOT NULL);

-- Apenas autenticados podem deletar
CREATE POLICY "Apenas autenticados podem deletar"
ON storage.objects FOR DELETE
USING (bucket_id = 'call-media' AND auth.uid() IS NOT NULL);