import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gift, Star, Sparkles, SwitchCamera } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/gifts")({
  head: () => ({
    meta: [
      { title: "Virtual Gifts & Stars — Opexnal" },
      {
        name: "description",
        content: "Receive gifts and appreciation stars on reels and livestreams.",
      },
    ],
  }),
  component: GiftsPage,
});

function GiftsPage() {
  const navigate = useNavigate();
  const [reelsGifts, setReelsGifts] = useState(true);
  const [liveGifts, setLiveGifts] = useState(true);

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Gifts & Stars"
          showBack
          onBack={() => navigate({ to: "/monetization" })}
        />

        <div className="p-4 space-y-6">
          <div className="p-4 bg-gradient-to-r from-rose-950/40 to-black border border-rose-800/50 rounded-2xl flex items-center gap-3">
            <Gift className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white">Gifts on Reels & Live</h4>
              <p className="text-[11px] text-gray-400">
                Fans can buy stars and send virtual gifts to support your creative work.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Allow Gifts on Reels</span>
                <p className="text-xs text-gray-400">Show the Send Gift button on eligible reels</p>
              </div>
              <Switch checked={reelsGifts} onCheckedChange={setReelsGifts} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">
                  Allow Gifts on Live Streams
                </span>
                <p className="text-xs text-gray-400">
                  Display animated gift badges during broadcasts
                </p>
              </div>
              <Switch checked={liveGifts} onCheckedChange={setLiveGifts} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
