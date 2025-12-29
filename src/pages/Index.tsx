import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Video, PhoneOff, Mic, MicOff, Camera, CameraOff } from "lucide-react";
import remoteVideoSrc from "@/assets/fake-call-remote.mp4";

interface MediaState {
  micOn: boolean;
  camOn: boolean;
}

const CALL_DURATION_LIMIT_MINUTES = 30;

const Index = () => {
  const [inCall, setInCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaState, setMediaState] = useState<MediaState>({ micOn: true, camOn: true });
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const selfVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    document.title = "Chamada de Vídeo Privada";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = "Sala de chamada de vídeo privada para seus atendimentos personalizados.";
      document.head.appendChild(meta);
    } else {
      metaDescription.setAttribute(
        "content",
        "Sala de chamada de vídeo privada com visual profissional, ideal para atendimentos individuais.",
      );
    }

    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      const link = document.createElement("link");
      link.rel = "canonical";
      link.href = window.location.href;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!inCall) return;

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => {
        if (prev >= CALL_DURATION_LIMIT_MINUTES * 60) {
          endCall("Tempo máximo de chamada atingido.");
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCall]);

  const requestMedia = async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360 },
        audio: true,
      });
      selfStreamRef.current = stream;

      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = stream;
        selfVideoRef.current.muted = true;
        await selfVideoRef.current.play().catch(() => undefined);
      }

      return true;
    } catch (error) {
      console.error("Erro ao acessar câmera/microfone", error);
      const humanMessage =
        "Não foi possível acessar sua câmera ou microfone. Verifique as permissões do navegador.";
      setPermissionError(humanMessage);
      toast({
        variant: "destructive",
        title: "Permissão necessária",
        description: humanMessage,
      });
      return false;
    }
  };

  const startCall = async () => {
    setConnecting(true);
    const ok = await requestMedia();
    if (!ok) {
      setConnecting(false);
      return;
    }

    setDuration(0);
    setInCall(true);
    setConnecting(false);
    toast({ title: "Chamada iniciada", description: "Você está conectado à sala privada." });
  };

  const stopMediaTracks = () => {
    if (selfStreamRef.current) {
      selfStreamRef.current.getTracks().forEach((track) => track.stop());
      selfStreamRef.current = null;
    }
  };

  const endCall = (reason?: string) => {
    setInCall(false);
    setDuration(0);
    stopMediaTracks();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (reason) {
      toast({ title: "Chamada finalizada", description: reason });
    }
  };

  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const toggleMic = () => {
    const next = !mediaState.micOn;
    setMediaState((prev) => ({ ...prev, micOn: next }));
    if (selfStreamRef.current) {
      selfStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
    }
  };

  const toggleCam = () => {
    const next = !mediaState.camOn;
    setMediaState((prev) => ({ ...prev, camOn: next }));
    if (selfStreamRef.current) {
      selfStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const showCallLayout = inCall;

  return (
    <div className="min-h-screen bg-[hsl(var(--call-surface))] text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:var(--gradient-call-soft)]" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <section className="w-full max-w-5xl">
          <header className="mb-6 flex flex-col gap-3 text-center sm:mb-8 sm:text-left">
            <p className="inline-flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-[hsl(var(--call-text-soft))]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.14)]">
                <Video className="h-3 w-3" />
              </span>
              SALA DE CHAMADA PRIVADA
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Simule uma chamada de vídeo profissional com poucos cliques.
            </h1>
            <p className="max-w-2xl text-balance text-sm text-[hsl(var(--call-text-soft))] sm:text-base">
              Envie este link para o seu cliente, peça para ele abrir no horário combinado e conduza o atendimento
              usando seu vídeo pré-gravado em um layout igual a uma chamada real.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] md:items-stretch">
            {/* Área principal da chamada */}
            <Card className="relative flex min-h-[380px] flex-col overflow-hidden border border-border/60 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.22),hsl(var(--call-surface-soft)))] shadow-[var(--shadow-soft)]">
              {/* Borda animada de status da chamada */}
              {showCallLayout && (
                <div className="pointer-events-none absolute inset-px rounded-[calc(theme(borderRadius.lg)+4px)] border border-[hsl(var(--primary)/0.4)] ring-1 ring-[hsl(var(--primary)/0.4)] [box-shadow:var(--shadow-glow)] animate-pulse" />
              )}

              {/* Top bar estilo app de chamada */}
              <div className="relative z-10 flex items-center justify-between px-4 py-3 text-sm text-[hsl(var(--call-text-soft))]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.18)] text-sm font-semibold">
                    VC
                  </div>
                  <div className="space-y-0.5 text-left">
                    <p className="font-medium leading-tight">Cliente VIP</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                      {showCallLayout ? `Conectado · ${formatDuration(duration)}` : "Pronto para conectar"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[hsl(var(--call-surface-soft))] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--call-text-soft))]">
                  {showCallLayout ? "CHAMADA ATIVA" : "OFFLINE"}
                </span>
              </div>

              {/* Vídeo remoto (seu vídeo) */}
              <div className="relative flex-1">
                <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={remoteVideoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                />

                {/* Webcam do cliente */}
                <div className="pointer-events-none absolute right-3 top-3 h-32 w-24 overflow-hidden rounded-2xl border border-[hsl(var(--call-surface-soft))] bg-[hsl(var(--call-surface-soft))] shadow-[0_10px_28px_hsl(210_80%_2%/0.85)] sm:right-5 sm:top-5 sm:h-40 sm:w-32">
                  <video
                    ref={selfVideoRef}
                    className="h-full w-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {!selfStreamRef.current && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[hsl(var(--call-surface-soft))] text-center text-[10px] text-[hsl(var(--call-text-soft))]">
                      <Camera className="h-4 w-4 opacity-80" />
                      <span>Seu vídeo aparece aqui durante a chamada.</span>
                    </div>
                  )}
                </div>

                {/* Gradiente inferior para destacar controles */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[hsl(var(--call-surface)/0.96)] via-[hsl(var(--call-surface)/0.7)] to-transparent" />

                {/* Controles */}
                <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 pb-4">
                  <div className="flex items-center gap-3 rounded-full bg-[hsl(var(--call-surface-soft)/0.92)] px-4 py-2 shadow-[0_18px_40px_hsl(210_80%_2%/0.95)] backdrop-blur-md">
                    <Button
                      size="icon"
                      variant="call"
                      aria-label={mediaState.micOn ? "Desativar microfone" : "Ativar microfone"}
                      onClick={toggleMic}
                    >
                      {mediaState.micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="call"
                      aria-label={mediaState.camOn ? "Desativar câmera" : "Ativar câmera"}
                      onClick={toggleCam}
                    >
                      {mediaState.camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="call-danger"
                      aria-label="Encerrar chamada"
                      onClick={() => endCall("Você encerrou a chamada.")}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-[hsl(var(--call-text-soft))]">
                    Lembre-se de combinar o horário com o cliente antes de enviar o link.
                  </p>
                </div>
              </div>
            </Card>

            {/* Lateral com instruções rápidas */}
            <aside className="flex flex-col justify-between gap-4">
              <div className="space-y-4 rounded-3xl border border-border/70 bg-[hsl(var(--call-surface-soft))] p-5 shadow-[var(--shadow-soft)]">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.22)]">
                    <Video className="h-4 w-4" />
                  </span>
                  Como usar esta sala
                </h2>
                <ol className="space-y-2 text-sm text-[hsl(var(--call-text-soft))]">
                  <li>
                    <span className="font-semibold text-foreground">1. Combine o horário</span>
                    <br />
                    Alinhe pelo WhatsApp o dia e o horário da sessão com o seu cliente.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">2. Envie o link desta página</span>
                    <br />
                    No horário marcado, peça para ele abrir o link que você enviou.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">3. Inicie a chamada aqui</span>
                    <br />
                    Clique em &quot;Iniciar chamada agora&quot; assim que o cliente avisar que está pronto.
                  </li>
                </ol>
                {permissionError && (
                  <p className="mt-1 rounded-xl border border-destructive/60 bg-destructive/10 p-2 text-xs text-destructive-foreground">
                    {permissionError}
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.25),hsl(var(--call-surface-soft)))] p-5 shadow-[var(--shadow-soft)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--call-text-soft))]">
                      CONTROLE DA SALA
                    </p>
                    <p className="text-sm text-[hsl(var(--call-text-soft))]">
                      Chamada limitada a {CALL_DURATION_LIMIT_MINUTES} min para cada sessão.
                    </p>
                  </div>
                  <div className="rounded-full bg-[hsl(var(--call-surface))] px-3 py-1 text-[11px] font-medium text-[hsl(var(--call-text-soft))]">
                    {formatDuration(duration)}
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  variant="call-primary"
                  onClick={startCall}
                  disabled={connecting || inCall}
                >
                  {connecting ? "Conectando..." : inCall ? "Chamada em andamento" : "Iniciar chamada agora"}
                </Button>
                <p className="mt-2 text-xs text-[hsl(var(--call-text-soft))]">
                  Nenhum cadastro é necessário para o cliente. Ele só precisa acessar o link a partir do celular ou
                  computador com câmera.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
