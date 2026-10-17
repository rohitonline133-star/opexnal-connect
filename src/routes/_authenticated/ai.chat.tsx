import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Send, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      sender: "ai",
      text: "Hello! I am your Opexnal AI co-pilot. Ask me for viral reels hooks, caption variations, or visual composition concepts.",
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
      const history = [...messages, userMsg].map((message) => ({
        role: message.sender === "user" ? ("user" as const) : ("model" as const),
        content: message.text,
      }));
      const response = await sendAiChatMessage({ messages: history, prompt });
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_${Date.now()}`,
          sender: "ai",
          text: response,
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
      <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-black pb-28 text-white">
        <ScreenHeader title="Opex AI Co-Pilot" showBack onBack={() => navigate({ to: "/ai" })} />

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${message.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${message.sender === "user" ? "bg-purple-600" : "bg-[#1f1f1f] text-[#8B5CF6]"}`}
              >
                {message.sender === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${message.sender === "user" ? "rounded-tr-none bg-[#8B5CF6] text-white" : "whitespace-pre-line rounded-tl-none border border-[#222] bg-[#141414] text-gray-200"}`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Opex AI is brainstorming...</span>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="fixed bottom-14 flex w-full max-w-xl gap-2 border-t border-[#1c1c1c] bg-black/90 px-4 py-2 backdrop-blur-md"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for captions, reels hooks, or ideas..."
            disabled={loading}
            className="h-11 flex-1 rounded-xl border border-[#262626] bg-[#141414] px-4 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
