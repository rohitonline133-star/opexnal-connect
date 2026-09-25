import { useState } from "react";
import {
  BarChart2,
  HelpCircle,
  Flame,
  Clock,
  Camera,
  ShoppingBag,
  Check,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 1. Interactive Poll Sticker
export function PollSticker({
  question = "Which design direction?",
  optionA = "Dark Glassmorphism",
  optionB = "Clean Minimal Paper",
}: {
  question?: string;
  optionA?: string;
  optionB?: string;
}) {
  const [votedOption, setVotedOption] = useState<"a" | "b" | null>(null);
  const [votesA, setVotesA] = useState(38);
  const [votesB, setVotesB] = useState(62);

  const total = votesA + votesB;
  const pctA = Math.round((votesA / total) * 100);
  const pctB = 100 - pctA;

  function handleVote(opt: "a" | "b") {
    if (votedOption) return;
    setVotedOption(opt);
    if (opt === "a") setVotesA((v) => v + 1);
    else setVotesB((v) => v + 1);
    toast.success("Vote recorded in story poll!");
  }

  return (
    <div className="w-full max-w-[260px] rounded-2xl border border-white/20 bg-black/60 p-3 text-white backdrop-blur-md shadow-lg">
      <p className="text-center text-xs font-bold leading-tight pb-2">{question}</p>
      <div className="space-y-1.5">
        {/* Option A */}
        <button
          type="button"
          onClick={() => handleVote("a")}
          className={cn(
            "relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-3 py-2 text-xs font-semibold transition-all text-left",
            votedOption === "a"
              ? "border-primary bg-primary/20 text-white"
              : "border-white/20 hover:border-white/40 bg-white/10",
          )}
        >
          {votedOption && (
            <div
              className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-500"
              style={{ width: `${pctA}%` }}
            />
          )}
          <span className="relative z-10 truncate pr-2">{optionA}</span>
          {votedOption && <span className="relative z-10 text-[11px] font-bold">{pctA}%</span>}
        </button>

        {/* Option B */}
        <button
          type="button"
          onClick={() => handleVote("b")}
          className={cn(
            "relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-3 py-2 text-xs font-semibold transition-all text-left",
            votedOption === "b"
              ? "border-primary bg-primary/20 text-white"
              : "border-white/20 hover:border-white/40 bg-white/10",
          )}
        >
          {votedOption && (
            <div
              className="absolute inset-y-0 left-0 bg-primary/30 transition-all duration-500"
              style={{ width: `${pctB}%` }}
            />
          )}
          <span className="relative z-10 truncate pr-2">{optionB}</span>
          {votedOption && <span className="relative z-10 text-[11px] font-bold">{pctB}%</span>}
        </button>
      </div>
    </div>
  );
}

// 2. Interactive Question Box Sticker
export function QuestionSticker({
  prompt = "Ask me anything about design & tech!",
}: {
  prompt?: string;
}) {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!response.trim()) return;
    setSubmitted(true);
    toast.success("Question submitted to creator inbox!");
  }

  return (
    <div className="w-full max-w-[260px] overflow-hidden rounded-2xl border border-white/20 bg-card/90 shadow-xl backdrop-blur-md">
      <div className="brand-gradient-bg p-2.5 text-center text-primary-foreground">
        <p className="text-xs font-bold leading-tight">{prompt}</p>
      </div>
      <div className="p-2.5">
        {submitted ? (
          <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-emerald-500">
            <Check className="h-4 w-4" />
            <span>Sent!</span>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <Input
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type something..."
              className="h-8 rounded-lg text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="h-8 w-8 shrink-0 rounded-lg brand-gradient-bg text-primary-foreground"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. Emoji Slider Sticker
export function EmojiSliderSticker({
  question = "How hyped are you for this launch?",
  emoji = "🔥",
}: {
  question?: string;
  emoji?: string;
}) {
  const [value, setValue] = useState(65);
  const [locked, setLocked] = useState(false);

  return (
    <div className="w-full max-w-[260px] rounded-2xl border border-white/20 bg-black/60 p-3 text-white backdrop-blur-md shadow-lg text-center">
      <p className="text-xs font-bold leading-tight pb-2">{question}</p>
      <div className="relative py-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={locked}
          onChange={(e) => {
            setValue(Number(e.target.value));
          }}
          onMouseUp={() => {
            setLocked(true);
            toast.success(`Rated ${value}%!`);
          }}
          onTouchEnd={() => {
            setLocked(true);
            toast.success(`Rated ${value}%!`);
          }}
          className="w-full accent-pink-500 cursor-pointer"
        />
        <div
          className="absolute -top-1 pointer-events-none text-lg transition-transform"
          style={{ left: `calc(${value}% - 12px)` }}
        >
          {emoji}
        </div>
      </div>
    </div>
  );
}

// 4. "Add Yours" Chain Sticker
export function AddYoursSticker({
  prompt = "Drop your 2026 workspace setup 💻",
  participants = 1420,
}: {
  prompt?: string;
  participants?: number;
}) {
  return (
    <div className="flex w-full max-w-[260px] items-center justify-between rounded-2xl border border-white/25 bg-black/70 p-2.5 text-white backdrop-blur-md shadow-xl">
      <div className="min-w-0 pr-2">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pink-400">
          <Sparkles className="h-3 w-3" />
          <span>Add Yours</span>
        </div>
        <p className="truncate text-xs font-bold leading-snug">{prompt}</p>
        <span className="text-[10px] text-white/60">{participants.toLocaleString()} stories</span>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => toast.info("Opens camera with this viral Add Yours sticker prompt!")}
        className="shrink-0 rounded-xl brand-gradient-bg text-primary-foreground text-[11px] font-bold h-7 px-2.5"
      >
        <Camera className="mr-1 h-3 w-3" />
        Add
      </Button>
    </div>
  );
}

// 5. Shopping Product Tag Pill
export function ProductTagPill({
  title = "Matte Keyboard",
  price = "$129",
  onClick,
}: {
  title?: string;
  price?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
    >
      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
      <span>{title}</span>
      <span className="rounded bg-white/20 px-1 py-0.2 text-[10px] font-mono text-white/90">
        {price}
      </span>
    </button>
  );
}
