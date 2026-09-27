import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { History, Sparkles, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/ai/history")({
  head: () => ({
    meta: [
      { title: "AI Generation History — Opexnal" },
      {
        name: "description",
        content: "Review past prompts, generated captions and reel concepts.",
      },
    ],
  }),
  component: AiHistoryPage,
});

function AiHistoryPage() {
  const navigate = useNavigate();

  const historyItems = [
    {
      id: "ai_h1",
      tool: "Viral Caption Generator",
      prompt: "Golden hour coffee roast in Bangalore",
      result:
        "Golden light hits different when the beans are freshly roasted. ☕✨ #BangaloreCafes",
      time: "2 hours ago",
    },
    {
      id: "ai_h2",
      tool: "Reel Hook Generator",
      prompt: "Coding aesthetic workspace",
      result:
        "Stop scrolling if your desk setup looks like this... here is how I built it for under $200.",
      time: "Yesterday",
    },
  ];

  return (
    <AppShell activeTab="ai">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="AI Prompt History" showBack onBack={() => navigate({ to: "/ai" })} />

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#121212] border border-[#262626] rounded-2xl space-y-2 text-xs"
              >
                <div className="flex justify-between items-center text-gray-400">
                  <span className="font-semibold text-purple-400">{item.tool}</span>
                  <span className="text-[10px]">{item.time}</span>
                </div>
                <p className="text-gray-300 font-medium">"{item.prompt}"</p>
                <div className="p-2.5 bg-black/60 rounded-xl border border-[#222] text-gray-200 text-[11px] leading-relaxed">
                  {item.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
