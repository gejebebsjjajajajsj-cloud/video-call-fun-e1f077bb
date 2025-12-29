import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Upload, Video, Music } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [currentConfig, setCurrentConfig] = useState<{ video_url: string | null; audio_url: string | null } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        loadCurrentConfig();
      }
      setCheckingAuth(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCurrentConfig = async () => {
    const { data, error } = await supabase
      .from("call_config")
      .select("video_url, audio_url")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (!error && data) {
      setCurrentConfig(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logout realizado", description: "Até logo!" });
    navigate("/auth");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let videoUrl = currentConfig?.video_url || null;
      let audioUrl = currentConfig?.audio_url || null;

      // Upload do vídeo
      if (videoFile) {
        const videoFileName = `video-${Date.now()}.mp4`;
        const { data: videoData, error: videoError } = await supabase.storage
          .from("call-media")
          .upload(videoFileName, videoFile, { upsert: true });

        if (videoError) throw videoError;

        const { data: { publicUrl } } = supabase.storage
          .from("call-media")
          .getPublicUrl(videoFileName);

        videoUrl = publicUrl;
      }

      // Upload do áudio
      if (audioFile) {
        const audioFileName = `audio-${Date.now()}.mp3`;
        const { data: audioData, error: audioError } = await supabase.storage
          .from("call-media")
          .upload(audioFileName, audioFile, { upsert: true });

        if (audioError) throw audioError;

        const { data: { publicUrl } } = supabase.storage
          .from("call-media")
          .getPublicUrl(audioFileName);

        audioUrl = publicUrl;
      }

      // Atualizar configuração no banco
      const { error: updateError } = await supabase
        .from("call_config")
        .update({ video_url: videoUrl, audio_url: audioUrl })
        .eq("id", "00000000-0000-0000-0000-000000000000");

      if (updateError) throw updateError;

      toast({
        title: "Configuração salva!",
        description: "Vídeo e áudio atualizados com sucesso.",
      });

      setVideoFile(null);
      setAudioFile(null);
      loadCurrentConfig();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    }

    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração da Chamada</CardTitle>
            <CardDescription>
              Faça upload do vídeo (MP4) e áudio (MP3) para personalizar a experiência da chamada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Vídeo de Fundo (MP4)
                </Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                {currentConfig?.video_url && (
                  <p className="text-sm text-muted-foreground">Vídeo atual configurado</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Áudio da Modelo (MP3)
                </Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/mpeg,audio/mp3"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                />
                {currentConfig?.audio_url && (
                  <p className="text-sm text-muted-foreground">Áudio atual configurado</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || (!videoFile && !audioFile)}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
