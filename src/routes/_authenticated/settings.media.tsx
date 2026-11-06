import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredSettings, updateSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/settings/media")({
  head: () => ({
    meta: [
      { title: "Media Quality & Data Saver — Settings — Opexnal" },
      {
        name: "description",
        content: "Configure media upload quality and cellular data saver on Opexnal.",
      },
    ],
  }),
  component: SettingsMediaPage,
});

function SettingsMediaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, user } = useSession();
  const userId = user?.id || session?.user?.id || "";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    enabled: Boolean(userId),
    queryFn: () => getStoredSettings(userId),
  });

  const [dataSaver, setDataSaver] = useState(settings?.cellularDataSaver ?? false);
  const [highQualityUploads, setHighQualityUploads] = useState(
    settings?.highQualityUploads ?? true,
  );
  const [autoPlayVideos, setAutoPlayVideos] = useState(settings?.autoPlayVideosOnCellular ?? true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        cellularDataSaver: dataSaver,
        highQualityUploads: highQualityUploads,
        autoPlayVideosOnCellular: autoPlayVideos,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success(
        "Media preferences saved on this device. Delivery controls are not connected yet.",
      );
    },
    onError: () => {
      toast.error("Failed to save media settings.");
    },
  });

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Media Quality" showBack onBack={() => navigate({ to: "/settings" })} />

        <div className="p-4 space-y-6">
          <div className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              These preferences are saved on this device only. Video preloading, upload quality,
              and cellular autoplay are not yet enforced by Opexnal media delivery.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Cellular Data Usage
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Use Less Cellular Data</span>
                <p className="text-xs text-gray-400">
                  Preference only; video preloading is not yet controlled
                </p>
              </div>
              <Switch checked={dataSaver} onCheckedChange={setDataSaver} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Upload at Highest Quality</span>
                <p className="text-xs text-gray-400">
                  Preference only; upload quality controls are not yet connected
                </p>
              </div>
              <Switch checked={highQualityUploads} onCheckedChange={setHighQualityUploads} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Autoplay Reels on Cellular</span>
                <p className="text-xs text-gray-400">
                  Preference only; cellular autoplay is not yet controlled
                </p>
              </div>
              <Switch checked={autoPlayVideos} onCheckedChange={setAutoPlayVideos} />
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
            <span>Save Media Preferences</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
