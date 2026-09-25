import { useEffect, useRef, useState } from "react";
import {
  Radio,
  Users,
  Heart,
  MessageSquare,
  Share2,
  X,
  UserPlus,
  Video,
  Mic,
  MicOff,
  SwitchCamera,
  Sparkles,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { cn } from "@/lib/utils";

interface LiveStudioModalProps {
  creatorUsername: string;
  creatorAvatar: string | null;
  onClose: () => void;
}

interface LiveComment {
  id: string;
  user: string;
  text: string;
  avatar?: string;
  isHost?: boolean;
}

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}

const SAMPLE_COMMENTS = [
  {
    user: "aanya_design",
    text: "Hey! Loved the new reel setup 🔥",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
  },
  {
    user: "rohan_dev",
    text: "What font did you use on slide 3?",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  },
  {
    user: "priya_art",
    text: "Greetings from Mumbai!! 🇮🇳❤️",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
  },
  {
    user: "tech_radar",
    text: "Audio quality sounds super crisp today!",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80",
  },
  {
    user: "vikram_m",
    text: "Can you invite @aanya_design to join? 🎙️",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
  },
];

const HEART_COLORS = ["#ec4899", "#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6"];

export function LiveStudioModal({ creatorUsername, creatorAvatar, onClose }: LiveStudioModalProps) {
  const [viewers, setViewers] = useState(84);
  const [likes, setLikes] = useState(312);
  const [comments, setComments] = useState<LiveComment[]>([
    { id: "c1", user: "opexnal_bot", text: "Broadcasting live to your followers! Say hello 👋" },
  ]);
  const [inputText, setInputText] = useState("");
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [guestInvited, setGuestInvited] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [ended, setEnded] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  useEffect(() => {
    let active = true;
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => {
          if (!active) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          // Camera permission fallback
        });
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Periodic viewer tick and sample incoming comments
  useEffect(() => {
    if (ended) return;
    const interval = setInterval(() => {
      // Random viewer fluctuation
      setViewers((v) => Math.max(50, v + Math.floor(Math.random() * 5) - 2));

      // Occasionally add a sample comment
      if (Math.random() > 0.45) {
        const sample = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
        if (sample) {
          setComments((prev) => [
            ...prev.slice(-15),
            {
              id: `c_${Date.now()}_${Math.random()}`,
              user: sample.user,
              text: sample.text,
              avatar: sample.avatar,
            },
          ]);
        }
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [ended]);

  function triggerHeart() {
    setLikes((l) => l + 1);
    const newHeart: FloatingHeart = {
      id: Date.now() + Math.random(),
      x: 60 + Math.random() * 30, // % from right
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)] ?? "#EC4899",
    };
    setHearts((prev) => [...prev.slice(-12), newHeart]);
  }

  function handleSendComment() {
    if (!inputText.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c_${Date.now()}`, user: creatorUsername, text: inputText.trim(), isHost: true },
    ]);
    setInputText("");
  }

  function handleEndStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setEnded(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-md">
      <div className="relative flex h-full max-h-[760px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        {ended ? (
          /* Live Stream Ended Summary */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-white space-y-6 animate-in zoom-in-95">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient-bg shadow-xl">
              <Radio className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Live Video Ended</h2>
              <p className="text-xs text-white/60 mt-1">
                Great broadcast! Here are your live session highlights:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-primary">{viewers + 64}</p>
                <p className="text-xs text-white/60 mt-0.5">Peak Viewers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-pink-500">{likes}</p>
                <p className="text-xs text-white/60 mt-0.5">Total Hearts</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-emerald-400">+{Math.floor(viewers * 0.15)}</p>
                <p className="text-xs text-white/60 mt-0.5">New Followers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-bold text-blue-400">{comments.length}</p>
                <p className="text-xs text-white/60 mt-0.5">Comments</p>
              </div>
            </div>

            <Button
              type="button"
              onClick={onClose}
              className="w-full max-w-xs rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
            >
              Done & Return to Feed
            </Button>
          </div>
        ) : (
          <>
            {/* Live Video Camera / Studio background */}
            <div className="absolute inset-0 overflow-hidden bg-neutral-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />
            </div>

            {/* Top Live Header */}
            <div className="relative z-10 flex items-center justify-between p-4 text-white">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-pulse">
                  <Radio className="h-3.5 w-3.5" />
                  LIVE
                </span>
                <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Users className="h-3.5 w-3.5 text-white/80" />
                  {viewers}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGuestInvited(true);
                    toast.success("Invited @aanya_design to join live stream as co-host!");
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm transition-colors",
                    guestInvited
                      ? "bg-emerald-500 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white",
                  )}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {guestInvited ? "Co-host Added" : "Invite Guest"}
                </button>
                <button
                  type="button"
                  onClick={handleEndStream}
                  className="rounded-full bg-red-600/90 p-1.5 text-white hover:bg-red-700"
                  aria-label="End Live"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Floating Hearts Container */}
            <div className="pointer-events-none absolute bottom-24 right-4 z-20 h-72 w-24 overflow-hidden">
              {hearts.map((h) => (
                <div
                  key={h.id}
                  className="absolute bottom-0 animate-float-heart"
                  style={{
                    right: `${100 - h.x}%`,
                    color: h.color,
                  }}
                >
                  <Heart className="h-7 w-7 fill-current filter drop-shadow-md" />
                </div>
              ))}
            </div>

            {/* Middle Spacer */}
            <div className="flex-1" />

            {/* Live Comments Stream */}
            <div className="relative z-10 p-4 max-h-56 overflow-y-auto space-y-2 no-scrollbar">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 text-xs text-white animate-in slide-in-from-bottom-2 duration-200"
                >
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt={c.user}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/40 flex items-center justify-center font-bold text-[10px]">
                      {c.user.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <p className="leading-snug bg-black/40 px-2.5 py-1 rounded-xl backdrop-blur-sm max-w-[85%]">
                    <span
                      className={cn(
                        "font-bold mr-1.5",
                        c.isHost ? "text-primary" : "text-white/90",
                      )}
                    >
                      {c.isHost ? "Host" : c.user}
                    </span>
                    <span className="text-white/80">{c.text}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Live Action Bar */}
            <div className="relative z-10 flex items-center gap-2 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Comment as host..."
                className="h-10 rounded-full border-white/20 bg-white/10 text-xs text-white placeholder:text-white/50 backdrop-blur-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendComment();
                }}
              />
              <button
                type="button"
                onClick={handleSendComment}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <Send className="h-4 w-4" />
              </button>

              {/* Like / Send Heart Button */}
              <button
                type="button"
                onClick={triggerHeart}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg active:scale-125 transition-transform"
              >
                <Heart className="h-5 w-5 fill-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
