import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  SwitchCamera,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from "lucide-react";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CallModalProps {
  peerName: string;
  peerUsername: string;
  peerAvatar: string | null;
  callType: "video" | "audio";
  onEndCall: () => void;
}

export function CallModal({
  peerName,
  peerUsername,
  peerAvatar,
  callType: initialCallType,
  onEndCall,
}: CallModalProps) {
  const [callType, setCallType] = useState<"video" | "audio">(initialCallType);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(initialCallType === "video");
  const [speakerOn, setSpeakerOn] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request camera if video call
  useEffect(() => {
    let active = true;
    if (videoEnabled && typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Camera permission denied or not available, video fallback used
        });
    }

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [videoEnabled]);

  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  }

  function toggleVideo() {
    setVideoEnabled((v) => {
      const next = !v;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
      }
      return next;
    });
  }

  if (minimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-2xl border border-primary/40 bg-card p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
        <ProfileAvatar
          path={peerAvatar}
          fallback={peerName.slice(0, 2).toUpperCase()}
          className="h-10 w-10 ring-2 ring-emerald-500 animate-pulse"
        />
        <div className="min-w-0 pr-2">
          <p className="text-xs font-semibold truncate">{peerName}</p>
          <p className="text-[11px] text-emerald-500 font-medium">
            {formatDuration(seconds)} · {callType === "video" ? "Video" : "Audio"}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setMinimized(false)}
          className="h-8 w-8 rounded-xl"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="destructive"
          onClick={onEndCall}
          className="h-8 w-8 rounded-xl"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-lg animate-in fade-in">
      <div className="relative flex h-full max-h-[720px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black shadow-2xl">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 text-white z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              End-to-End Encrypted
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Main Stage */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-6 text-center">
          {videoEnabled ? (
            <div className="absolute inset-0 overflow-hidden">
              {/* Simulated remote video with ambient lighting */}
              <div className="h-full w-full bg-neutral-950 flex items-center justify-center relative">
                <img
                  src={
                    peerAvatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80"
                  }
                  alt={peerName}
                  className="h-full w-full object-cover opacity-80 filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              </div>

              {/* Picture in Picture: Local Video */}
              <div className="absolute bottom-24 right-4 h-36 w-24 overflow-hidden rounded-2xl border-2 border-white/20 bg-neutral-800 shadow-xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover transform -scale-x-100"
                />
                <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                  You
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                {/* Audio pulse ring animations */}
                <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping opacity-40" />
                <div className="absolute -inset-8 rounded-full bg-primary/10 animate-pulse opacity-60" />
                <ProfileAvatar
                  path={peerAvatar}
                  fallback={peerName.slice(0, 2).toUpperCase()}
                  className="h-32 w-32 rounded-full border-4 border-primary/50 shadow-2xl relative z-10"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">{peerName}</h3>
                <p className="text-sm text-white/60">@{peerUsername}</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
                  <span>Connected</span>
                  <span>·</span>
                  <span>{formatDuration(seconds)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Remote Info Overlay in Video mode */}
        {videoEnabled && (
          <div className="absolute bottom-28 left-6 z-10 text-white">
            <h3 className="text-lg font-bold drop-shadow-md">{peerName}</h3>
            <p className="text-xs text-white/80 font-mono drop-shadow">{formatDuration(seconds)}</p>
          </div>
        )}

        {/* Call Controls Bar */}
        <div className="relative z-10 flex items-center justify-around bg-black/70 p-6 backdrop-blur-md">
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
              muted
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Toggle Video */}
          <button
            type="button"
            onClick={toggleVideo}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
              !videoEnabled
                ? "bg-white/10 text-white/60 hover:bg-white/20"
                : "bg-primary text-primary-foreground shadow-lg",
            )}
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          {/* Speaker Button */}
          <button
            type="button"
            onClick={() => setSpeakerOn(!speakerOn)}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
              speakerOn ? "bg-white/20 text-white" : "bg-white/10 text-white/60",
            )}
          >
            {speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onEndCall}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-700 active:scale-95 transition-all"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
