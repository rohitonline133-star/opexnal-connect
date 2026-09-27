import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, Type, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredSettings, updateSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/settings/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility — Settings — Opexnal" },
      {
        name: "description",
        content: "Accessibility, screen reader, captions and contrast controls on Opexnal.",
      },
    ],
  }),
  component: SettingsAccessibilityPage,
});

function SettingsAccessibilityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.userId || "user_maya";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getStoredSettings(userId),
  });

  const [autoCaptions, setAutoCaptions] = useState(settings?.autoGenerateCaptions ?? true);
  const [highContrast, setHighContrast] = useState(settings?.highContrastText ?? false);
  const [reducedMotion, setReducedMotion] = useState(settings?.reducedMotion ?? false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        autoGenerateCaptions: autoCaptions,
        highContrastText: highContrast,
        reducedMotion: reducedMotion,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success("Accessibility settings updated.");
    },
    onError: () => {
      toast.error("Failed to update accessibility settings.");
    },
  });

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Accessibility" showBack onBack={() => navigate({ to: "/settings" })} />

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Captions & Visuals
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Always Show Auto-Captions</span>
                <p className="text-xs text-gray-400">
                  Generate real-time subtitles on reels and videos
                </p>
              </div>
              <Switch checked={autoCaptions} onCheckedChange={setAutoCaptions} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">High Contrast UI</span>
                <p className="text-xs text-gray-400">
                  Increase border definition and text visibility
                </p>
              </div>
              <Switch checked={highContrast} onCheckedChange={setHighContrast} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Reduced Motion</span>
                <p className="text-xs text-gray-400">Minimize animations and transition effects</p>
              </div>
              <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
