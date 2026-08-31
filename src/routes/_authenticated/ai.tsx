import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send, Sparkles, Wand2, Lightbulb, Flame, RefreshCw } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "Opexnal AI — Assistant & Creative Studio" },
      {
        name: "description",
        content: "Explore AI creative assistants, smart suggestions, and post ideas on Opexnal.",
      },
      { property: "og:title", content: "Opexnal AI — Assistant & Creative Studio" },
      {
        property: "og:description",
        content: "Explore AI creative assistants, smart suggestions, and post ideas on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIPage,
});

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  "✨ Generate viral captions for my photo",
  "🔥 Find trending hashtags for tech & design",
  "💡 Give me 3 creative reel ideas for this week",
  "✍️ Write an engaging bio for my creator profile",
];

function AIPage() {
  const { user } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello ${user?.user_metadata?.username ? `@${user.user_metadata.username}` : "there"}! Welcome to Opexnal AI. Ask me to generate captions, brainstorm post concepts, suggest trending hashtags, or optimize your profile.`,
      timestamp: "Just now",
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      let reply =
        "Here's an idea to boost your engagement: focus on a strong first 3-second hook, crisp visual framing, and 3-5 relevant niche hashtags!";
      const lower = text.toLowerCase();
      if (lower.includes("caption")) {
        reply =
          "Here are 3 engaging captions:\n\n1. Built with passion, crafted for the vision. ✨\n2. Quiet execution speaks louder than loud promises. 🚀\n3. Behind every great result is relentless repetition. Drop your thoughts below! 👇";
      } else if (lower.includes("hashtag") || lower.includes("tag")) {
        reply =
          "Top trending tags right now:\n#Opexnal #CreatorEconomy #TechInnovation #BuildInPublic #DigitalDesign #MinimalistAesthetic";
      } else if (lower.includes("reel") || lower.includes("video")) {
        reply =
          "3 Video Concepts:\n1. 'A Day in the Life' 15-second fast cuts with ambient audio.\n2. Before vs After transformation of your project.\n3. 3 quick mistakes to avoid in your industry.";
      } else if (lower.includes("bio")) {
        reply =
          "Profile Bio Draft:\n🚀 Building the future of digital experiences.\n✨ Design • Strategy • Tech\n👇 Explore my latest work below";
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 600);
  };

  return (
    <AppShell header={<ScreenHeader title="Opexnal AI" />}>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto px-4 py-4">
        {/* Header Hero Banner */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">AI Creative Co-Pilot</h2>
              <p className="text-xs text-muted-foreground">
                Smart captioning, hashtag recommendations & creative prompts.
              </p>
            </div>
          </div>
        </div>

        {/* Quick prompt pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                  m.sender === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-br-none shadow-sm"
                    : "bg-secondary/70 border border-border/60 text-foreground rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-9">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Opexnal AI is generating...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-3 flex items-center gap-2 pt-2 border-t border-border/40"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Opexnal AI for captions, ideas, hashtags..."
            className="h-11 rounded-xl bg-secondary/50 border-border/80 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="brand"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl shadow-md shadow-primary/20"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
