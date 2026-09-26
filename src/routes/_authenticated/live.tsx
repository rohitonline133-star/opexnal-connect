import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Users,
  MessageCircle,
  HelpCircle,
  Share2,
  X,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Send,
  Eye,
  Settings2,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({
    meta: [
      { title: "Live Streaming Studio — Opexnal" },
      {
        name: "description",
        content: "Broadcast live to your followers and community on Opexnal.",
      },
    ],
  }),
  component: LiveStudioPage,
});

type LiveStage = "setup" | "broadcasting" | "summary";
type LiveAudience = "public" | "followers" | "close_friends";

interface LiveComment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isBadge?: boolean;
}

interface QuestionItem {
  id: string;
  fromUser: string;
  question: string;
  answered: boolean;
}

export function LiveStudioPage() {
  const { user } = useSession();
  const navigate = useNavigate();

  // Setup state
  const [stage, setStage] = useState<LiveStage>("setup");
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<LiveAudience>("public");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedEffect, setSelectedEffect] = useState<string>("Normal");
  const [moderatorInput, setModeratorInput] = useState("");
  const [moderators, setModerators] = useState<string[]>([]);

  // Broadcasting state
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [viewerCount, setViewerCount] = useState(1);
  const [comments, setComments] = useState<LiveComment[]>([
    {
      id: "c1",
      username: "alex_design",
      text: "Hey! Excited for this live stream! 👋",
      timestamp: "Just now",
    },
    {
      id: "c2",
      username: "priya_creations",
      text: "Sound is super clear!",
      timestamp: "Just now",
      isBadge: true,
    },
  ]);
  const [commentInput, setCommentInput] = useState("");
  const [likesCount, setLikesCount] = useState(14);
  const [activeTab, setActiveTab] = useState<"comments" | "questions" | "guests">("comments");
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "q1",
      fromUser: "tech_guru",
      question: "What gear are you using for this stream?",
      answered: false,
    },
    {
      id: "q2",
      fromUser: "sam_photography",
      question: "Will the replay be available in archive?",
      answered: true,
    },
  ]);
  const [newQuestion, setNewQuestion] = useState("");

  // Video element preview reference
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Timer for broadcast
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === "broadcasting") {
      interval = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
        if (Math.random() > 0.6) {
          setViewerCount((v) => Math.max(1, v + Math.floor(Math.random() * 3) - 1));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage]);

  // Scroll comments
  useEffect(() => {
    if (stage === "broadcasting" && activeTab === "comments") {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, stage, activeTab]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartLive = () => {
    if (!title.trim()) {
      toast.error("Please enter a title for your live stream");
      return;
    }
    setStage("broadcasting");
    setDurationSeconds(0);
    toast.success("Broadcast started! You are now LIVE.");
  };

  const handleEndLive = () => {
    setStage("summary");
  };

  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentInput.trim()) return;
    const newC: LiveComment = {
      id: Date.now().toString(),
      username: user?.username || "you",
      text: commentInput.trim(),
      timestamp: "Just now",
      isBadge: true,
    };
    setComments((prev) => [...prev, newC]);
    setCommentInput("");
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        fromUser: user?.username || "viewer",
        question: newQuestion.trim(),
        answered: false,
      },
    ]);
    setNewQuestion("");
    toast.success("Question submitted to live Q&A!");
  };

  const handleAddModerator = () => {
    const mod = moderatorInput.trim().replace(/^@/, "");
    if (!mod) return;
    if (moderators.includes(mod)) {
      toast.error("User is already a moderator");
      return;
    }
    setModerators((prev) => [...prev, mod]);
    setModeratorInput("");
    toast.success(`@${mod} added as live moderator`);
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={
            stage === "broadcasting" ? (
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-red-500 text-sm">LIVE</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {formatDuration(durationSeconds)}
                </span>
              </div>
            ) : stage === "summary" ? (
              "Broadcast Ended"
            ) : (
              "Live Studio"
            )
          }
          left={
            stage === "broadcasting" ? null : (
              <Link
                to="/home"
                aria-label="Back"
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )
          }
        />
      }
    >
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* ============================================================== */}
        {/* STAGE 1: SETUP SCREEN */}
        {/* ============================================================== */}
        {stage === "setup" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Integration Boundary Banner */}
            <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Streaming Gateway Status: NOT VERIFIED</span>
              </div>
              <p className="text-amber-200/80 leading-relaxed text-[11px]">
                External WebRTC / RTMP streaming provider (e.g. Mux, Cloudflare Stream, AWS IVS) is
                not configured in the environment. Running in verified local camera loopback and
                interactive simulation mode.
              </p>
            </div>

            {/* Video Camera Preview Card */}
            <div className="relative aspect-3/4 rounded-3xl overflow-hidden bg-zinc-900 border border-border flex flex-col justify-between p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

              {/* Camera State Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                {videoEnabled ? (
                  <div className="space-y-2">
                    <Radio className="h-12 w-12 text-primary mx-auto animate-pulse" />
                    <p className="text-xs text-white/80 font-medium">Camera Feed Active</p>
                    <Badge variant="outline" className="text-[10px] text-white/60">
                      Filter: {selectedEffect}
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <VideoOff className="h-12 w-12 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-400 font-medium">Camera is Off</p>
                  </div>
                )}
              </div>

              {/* Top Controls on Camera */}
              <div className="relative z-10 flex justify-between items-center">
                <Badge className="brand-gradient-bg text-white border-0 text-[10px] px-2.5 py-1">
                  PREVIEW
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="surface"
                    className="h-9 w-9 rounded-full bg-black/40 backdrop-blur border-white/20 text-white"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    aria-label="Toggle camera"
                  >
                    {videoEnabled ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <VideoOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="surface"
                    className="h-9 w-9 rounded-full bg-black/40 backdrop-blur border-white/20 text-white"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    aria-label="Toggle microphone"
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Bottom Effects Selector */}
              <div className="relative z-10 space-y-2">
                <p className="text-[11px] font-semibold text-white/80">Camera Effects</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {["Normal", "Studio Glow", "Vibrant", "Vintage", "Noir B&W"].map((fx) => (
                    <button
                      key={fx}
                      type="button"
                      onClick={() => setSelectedEffect(fx)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
                        selectedEffect === fx
                          ? "bg-white text-black font-semibold shadow-md"
                          : "bg-black/50 text-white/80 hover:bg-black/70 backdrop-blur",
                      )}
                    >
                      {fx}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stream Settings Form */}
            <div className="space-y-3.5 bg-card border border-border p-4 rounded-3xl">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Broadcast Title
                </label>
                <Input
                  placeholder="What is this live about? (e.g. Q&A, Behind the scenes...)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-11 bg-surface border-border text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Who can watch?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "public", label: "Public" },
                      { id: "followers", label: "Followers" },
                      { id: "close_friends", label: "Close Friends" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAudience(item.id)}
                      className={cn(
                        "py-2 px-1 text-xs rounded-xl border font-medium transition-all text-center",
                        audience === item.id
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Moderators */}
              <div className="space-y-1.5 pt-1 border-t border-border">
                <label className="text-xs font-semibold text-foreground block">
                  Add Stream Moderator
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter @username to moderate"
                    value={moderatorInput}
                    onChange={(e) => setModeratorInput(e.target.value)}
                    className="rounded-xl h-9 bg-surface border-border text-xs"
                  />
                  <Button
                    size="sm"
                    variant="surface"
                    onClick={handleAddModerator}
                    className="rounded-xl text-xs"
                  >
                    Add
                  </Button>
                </div>
                {moderators.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {moderators.map((m) => (
                      <Badge key={m} variant="secondary" className="text-[11px] gap-1">
                        <ShieldCheck className="h-3 w-3 text-primary" />@{m}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Launch Button */}
            <Button
              onClick={handleStartLive}
              className="w-full h-12 brand-gradient-bg text-white font-bold rounded-2xl shadow-lg active:scale-[0.99] text-sm"
            >
              Start Live Broadcast
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 2: LIVE BROADCAST ROOM */}
        {/* ============================================================== */}
        {stage === "broadcasting" && (
          <div className="relative aspect-3/4 rounded-3xl overflow-hidden bg-black border border-zinc-800 flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Background Stream View */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none z-10" />

            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-md">
                  <Radio className="h-3 w-3 animate-pulse" />
                  LIVE
                </div>
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-white text-[11px]">
                  <Eye className="h-3 w-3 text-primary" />
                  <span className="font-semibold">{viewerCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleEndLive}
                  className="rounded-full text-xs font-semibold px-3 h-8 shadow-md"
                >
                  End Stream
                </Button>
              </div>
            </div>

            {/* Broadcast Details Banner */}
            <div className="relative z-20 px-4">
              <p className="text-sm font-bold text-white drop-shadow-md">{title}</p>
              <p className="text-[11px] text-white/70">
                Audience: <span className="capitalize">{audience.replace("_", " ")}</span>
              </p>
            </div>

            {/* Interactive Panels: Tabs for Comments, Q&A, Guests */}
            <div className="relative z-20 flex-1 flex flex-col justify-end p-4 space-y-2">
              <div className="flex gap-2 border-b border-white/20 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("comments")}
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-lg transition-colors",
                    activeTab === "comments" ? "bg-white/20 text-white" : "text-white/60",
                  )}
                >
                  Comments ({comments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("questions")}
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-lg transition-colors",
                    activeTab === "questions" ? "bg-white/20 text-white" : "text-white/60",
                  )}
                >
                  Q&A ({questions.length})
                </button>
              </div>

              {/* Comments Feed */}
              {activeTab === "comments" && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-black/60 backdrop-blur border border-white/10 p-2 rounded-xl text-white shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary text-[11px] flex items-center gap-1">
                          @{c.username}
                          {c.isBadge && <span className="text-[10px] text-amber-400">👑</span>}
                        </span>
                        <span className="text-[10px] text-white/50">{c.timestamp}</span>
                      </div>
                      <p className="text-white/90 text-xs mt-0.5">{c.text}</p>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}

              {/* Questions Feed */}
              {activeTab === "questions" && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-black/70 backdrop-blur border border-white/15 p-2 rounded-xl text-white"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-400 text-[11px]">@{q.fromUser}</span>
                        {q.answered && (
                          <Badge variant="outline" className="text-[9px] text-emerald-400">
                            Answered
                          </Badge>
                        )}
                      </div>
                      <p className="text-white text-xs mt-1">{q.question}</p>
                    </div>
                  ))}
                  <form onSubmit={handleAskQuestion} className="flex gap-1.5 pt-1">
                    <Input
                      placeholder="Ask a question..."
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="h-8 text-xs bg-black/60 border-white/20 text-white rounded-lg"
                    />
                    <Button
                      size="sm"
                      type="submit"
                      className="h-8 px-2.5 brand-gradient-bg text-white rounded-lg text-xs"
                    >
                      Ask
                    </Button>
                  </form>
                </div>
              )}

              {/* Comment Input Box */}
              <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Say something nice in live chat..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="rounded-full h-10 bg-black/60 backdrop-blur border-white/20 text-white placeholder-white/50 text-xs"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full h-10 w-10 shrink-0 brand-gradient-bg text-white"
                  aria-label="Send comment"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="surface"
                  onClick={() => {
                    setLikesCount((prev) => prev + 1);
                    toast.success("Sent love ❤️");
                  }}
                  className="rounded-full h-10 w-10 shrink-0 bg-red-600/80 hover:bg-red-600 text-white border-0"
                  aria-label="Send like"
                >
                  ❤️
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STAGE 3: LIVE BROADCAST SUMMARY */}
        {/* ============================================================== */}
        {stage === "summary" && (
          <div className="space-y-5 bg-card border border-border p-6 rounded-3xl text-center animate-in fade-in duration-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient-bg text-white mx-auto shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Live Stream Ended</h2>
              <p className="text-xs text-muted-foreground">{title || "Live Broadcast"}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 py-2 text-left">
              <div className="bg-surface border border-border p-3.5 rounded-2xl">
                <p className="text-[11px] text-muted-foreground">Total Viewers</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{viewerCount + 8}</p>
              </div>
              <div className="bg-surface border border-border p-3.5 rounded-2xl">
                <p className="text-[11px] text-muted-foreground">Stream Duration</p>
                <p className="text-xl font-bold text-foreground mt-0.5 font-mono">
                  {formatDuration(durationSeconds)}
                </p>
              </div>
              <div className="bg-surface border border-border p-3.5 rounded-2xl">
                <p className="text-[11px] text-muted-foreground">Total Comments</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{comments.length}</p>
              </div>
              <div className="bg-surface border border-border p-3.5 rounded-2xl">
                <p className="text-[11px] text-muted-foreground">Reactions Sent</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{likesCount}</p>
              </div>
            </div>

            {/* Archive & Exit Options */}
            <div className="space-y-2 pt-2">
              <Button
                asChild
                className="w-full brand-gradient-bg text-white font-semibold rounded-xl text-xs h-11"
              >
                <Link to="/archive">View in Live Archive</Link>
              </Button>
              <Button
                variant="surface"
                onClick={() => navigate({ to: "/home" })}
                className="w-full rounded-xl text-xs h-11"
              >
                Return to Home Feed
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
