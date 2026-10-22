import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wifi, Video, Image, Save, Loader2 } from "lucide-react";
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
  const { session } = useSession();
  const userId = session?.userId || "user_maya";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getStoredSettings(userId),
  });

  const [dataSaver, setDataSaver] = useState(settings?.cellularDataSaver ?? false);
  const [highQualityUploads, setHighQualityUploads] = useState(
    settings?.uploadHighestQuality ?? true,
  );
  const [autoPlayVideos, setAutoPlayVideos] = useState(settings?.autoplayVideos !== "never");

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        cellularDataSaver: dataSaver,
        uploadHighestQuality: highQualityUploads,
        autoplayVideos: autoPlayVideos ? "always" : "never",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success("Media settings saved.");
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
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Cellular Data Usage
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Use Less Cellular Data</span>
                <p className="text-xs text-gray-400">When data saver is on, videos won't preload</p>
              </div>
              <Switch checked={dataSaver} onCheckedChange={setDataSaver} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Upload at Highest Quality</span>
                <p className="text-xs text-gray-400">
                  Always upload 4K and uncompressed audio even on mobile
                </p>
              </div>
              <Switch checked={highQualityUploads} onCheckedChange={setHighQualityUploads} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Autoplay Reels on Cellular</span>
                <p className="text-xs text-gray-400">
                  Stream reels automatically without tapping play
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
