import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sliders, ShieldCheck, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/ai/settings")({
  head: () => ({
    meta: [
      { title: "Opex AI Preferences & Controls — Opexnal" },
      {
        name: "description",
        content: "Configure creator AI persona, safety thresholds, and autonomous suggestions.",
      },
    ],
  }),
  component: AiSettingsPage,
});

function AiSettingsPage() {
  const navigate = useNavigate();

  const [autoSuggestions, setAutoSuggestions] = useState(true);
  const [hashtagOptimization, setHashtagOptimization] = useState(true);
  const [safetyThreshold, setSafetyThreshold] = useState("strict");
  const [preferredTone, setPreferredTone] = useState("inspirational");

  const handleSave = () => {
    toast.success("AI preferences saved.");
  };

  return (
    <AppShell activeTab="ai">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="AI Settings & Rules" showBack onBack={() => navigate({ to: "/ai" })} />

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Creator Persona
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Default Tone of Voice</label>
              <select
                value={preferredTone}
                onChange={(e) => setPreferredTone(e.target.value)}
                className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="inspirational">Inspirational & Poetic</option>
                <option value="humorous">Humorous & Casual</option>
                <option value="educational">Informative & Technical</option>
                <option value="minimalist">Minimalist & Punchy</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">
                Automated Content Moderation
              </label>
              <select
                value={safetyThreshold}
                onChange={(e) => setSafetyThreshold(e.target.value)}
                className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="strict">
                  Strict (Blocks all profanity, slurs and high-risk terms)
                </option>
                <option value="standard">
                  Standard (Flags hate speech, scams, and dangerous claims)
                </option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Autonomous Assistance
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Smart Caption Suggestions</span>
                <p className="text-xs text-gray-400">
                  Suggest captions automatically when uploading media
                </p>
              </div>
              <Switch checked={autoSuggestions} onCheckedChange={setAutoSuggestions} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Hashtag Trend Analysis</span>
                <p className="text-xs text-gray-400">
                  Recommend hashtags based on real-time community engagement
                </p>
              </div>
              <Switch checked={hashtagOptimization} onCheckedChange={setHashtagOptimization} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg"
          >
            Save AI Preferences
          </button>
        </div>
      </div>
    </AppShell>
  );
}
