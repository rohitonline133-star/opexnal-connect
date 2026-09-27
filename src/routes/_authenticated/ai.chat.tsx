import { useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Send, Sparkles, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
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
  const { session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Hello! I am your Opexnal AI co-pilot. Ask me for viral reels hooks, caption variations, or visual composition concepts.",
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
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.content }));
      const res = await sendAiChatMessage(prompt, history);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: res.text,
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
        <ScreenHeader title="Opex AI Co-Pilot" showBack onBack={() => navigate({ to: "/ai" })} />

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  m.role === "user" ? "bg-purple-600" : "bg-[#1f1f1f] text-[#8B5CF6]"
                }`}
              >
                {m.role === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#8B5CF6] text-white rounded-tr-none"
                    : "bg-[#141414] border border-[#222] text-gray-200 rounded-tl-none whitespace-pre-line"
                }`}
              >
                {m.content}
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
