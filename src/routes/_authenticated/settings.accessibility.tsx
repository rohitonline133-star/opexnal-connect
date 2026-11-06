import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, Type, Sparkles, Save, Loader2, Info } from "lucide-react";
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
  const { session, user } = useSession();
  const userId = user?.id || session?.user?.id || "";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    enabled: Boolean(userId),
    queryFn: () => getStoredSettings(userId),
  });

  const [autoCaptions, setAutoCaptions] = useState(settings?.autoGenerateCaptions ?? true);
  const [highContrast, setHighContrast] = useState(settings?.highContrastText ?? false);
  const [reducedMotion, setReducedMotion] = useState(settings?.reducedMotion ?? false);

  useEffect(() => {
    if (!settings) return;
    setAutoCaptions(settings.autoGenerateCaptions);
    setHighContrast(settings.highContrastText ?? false);
    setReducedMotion(settings.reducedMotion ?? false);
  }, [settings]);

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
      toast.success("Accessibility preferences saved on this device.");
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
          <div className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-xs text-gray-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>These preferences are stored on this device. Automatic captions and app-wide high-contrast or reduced-motion enforcement are not fully connected yet.</p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Captions & Visuals
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Always Show Auto-Captions</span>
                <p className="text-xs text-gray-400">
                  Preference only; real-time caption generation is not connected
                </p>
              </div>
              <Switch checked={autoCaptions} onCheckedChange={setAutoCaptions} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">High Contrast UI</span>
                <p className="text-xs text-gray-400">
                  Preference only; app-wide high-contrast styling is not yet applied
                </p>
              </div>
              <Switch checked={highContrast} onCheckedChange={setHighContrast} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Reduced Motion</span>
                <p className="text-xs text-gray-400">Preference only; app-wide reduced-motion handling is not yet applied</p>
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
