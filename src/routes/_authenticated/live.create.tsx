import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Radio, Users, Shield, Video, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";

export const Route = createFileRoute("/_authenticated/live/create")({
  head: () => ({
    meta: [
      { title: "Go Live — Opexnal" },
      { name: "description", content: "Start a real-time livestream broadcast on Opexnal." },
    ],
  }),
  component: LiveCreatePage,
});

function LiveCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("public");

  const handleStartBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a broadcast title.");
      return;
    }
    toast.info("Broadcast prepared. Starting real-time stream...");
    navigate({ to: "/live" });
  };

  return (
    <AppShell activeTab="create">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Go Live" showBack onBack={() => navigate({ to: "/live" })} />

        <form onSubmit={handleStartBroadcast} className="p-4 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Broadcast Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you discussing live?"
              required
              className="w-full h-11 px-4 bg-[#121212] border border-[#262626] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Audience Visibility</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="public">Public (Anyone can tune in)</option>
              <option value="close_friends">Close Friends Only</option>
              <option value="subscribers">Subscribers Only</option>
            </select>
          </div>

          <div className="p-3 bg-[#121212] border border-[#222] rounded-xl text-xs text-gray-400 space-y-1">
            <span className="font-semibold text-gray-300">Live Safety Architecture:</span>
            <p className="text-[11px] leading-relaxed">
              Real-time comment filtering, moderator assignments, and community safety strikes apply
              to all livestreams.
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Start Live Broadcast</span>
          </button>
        </form>
      </div>
    </AppShell>
  );
}
