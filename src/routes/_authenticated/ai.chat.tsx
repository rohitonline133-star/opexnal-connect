import { useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Send, Sparkles, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { OpexAiLogo } from "@/components/opexnal/logo";
import { useSession } from "@/hooks/use-session";
import { sendAiChatMessage, type ChatMessage } from "@/lib/ai-client";

export const Route = createFileRoute("/_authenticated/ai/chat")({
  head: () => ({
    meta: [
      { title: "AI Creator Co-pilot — Opexnal" },
      { name: "description", content: "Chat directly with Opexnal's creative AI strategist." },
    ],
  }),
  component: AiChatPage,
});

function AiChatPage() {
  const navigate = useNavigate();
  useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      sender: "ai",
      text: "Hello! I am your Opex AI co-pilot. Ask me for viral reels hooks, caption variations, or visual composition concepts.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: (m.sender === "user" ? "user" : "model") as "user" | "model",
        content: m.text,
      }));
      const resText = await sendAiChatMessage({ messages: history, prompt });
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: "ai",
          text: resText,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      toast.error("Failed to generate AI response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeTab="ai">
      <div className="min-h-screen bg-black text-white pb-28 max-w-xl mx-auto flex flex-col">
        <ScreenHeader
          title={
            <div className="flex items-center gap-2">
              <OpexAiLogo size={20} />
              <span>Opex AI Co-Pilot</span>
            </div>
          }
          showBack
          onBack={() => navigate({ to: "/ai" })}
        />

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  m.sender === "user" ? "bg-purple-600" : "bg-[#1f1f1f]"
                }`}
              >
                {m.sender === "user" ? <User className="w-3.5 h-3.5" /> : <OpexAiLogo size={20} />}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#8B5CF6] text-white rounded-tr-none"
                    : "bg-[#141414] border border-[#222] text-gray-200 rounded-tl-none whitespace-pre-line"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Opex AI is brainstorming...</span>
            </div>
          )}
        </div>

        {/* Floating Input Bar */}
        <form
          onSubmit={handleSend}
          className="fixed bottom-14 max-w-xl w-full px-4 py-2 bg-black/90 backdrop-blur-md border-t border-[#1c1c1c] flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for captions, reels hooks, or ideas..."
            disabled={loading}
            className="flex-1 h-11 px-4 bg-[#141414] border border-[#262626] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8B5CF6]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-11 h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
