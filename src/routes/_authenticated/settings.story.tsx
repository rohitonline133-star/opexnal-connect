import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Archive, Download, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredSettings, updateSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/settings/story")({
  head: () => ({
    meta: [
      { title: "Story & Live Settings — Opexnal" },
      {
        name: "description",
        content: "Configure story archiving, replies and sharing permissions on Opexnal.",
      },
    ],
  }),
  component: SettingsStoryPage,
});

function SettingsStoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, user } = useSession();
  const userId = user?.id || session?.userId || "";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    enabled: Boolean(userId),
    queryFn: () => getStoredSettings(userId),
  });

  const [saveToArchive, setSaveToArchive] = useState(settings?.storiesArchiveAutoSave ?? true);
  const [saveToGallery, setSaveToGallery] = useState(settings?.saveStoryToCameraRoll ?? false);
  const [allowReshare, setAllowReshare] = useState(settings?.allowStoryResharing ?? true);
  const [allowReplies, setAllowReplies] = useState(settings?.storyReplyPermission ?? "everyone");

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        storiesArchiveAutoSave: saveToArchive,
        saveStoryToCameraRoll: saveToGallery,
        allowStoryResharing: allowReshare,
        storyReplyPermission: allowReplies,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success("Story settings saved.");
    },
    onError: () => {
      toast.error("Failed to save story settings.");
    },
  });

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader
          title="Story & Live Settings"
          showBack
          onBack={() => navigate({ to: "/settings" })}
        />

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Saving & Archive
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Save Story to Archive</span>
                <p className="text-xs text-gray-400">
                  Automatically save stories after their 24-hour expiration
                </p>
              </div>
              <Switch checked={saveToArchive} onCheckedChange={setSaveToArchive} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">
                  Save to Camera Roll / Gallery
                </span>
                <p className="text-xs text-gray-400">
                  Save posted stories directly to your phone storage
                </p>
              </div>
              <Switch checked={saveToGallery} onCheckedChange={setSaveToGallery} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Sharing & Replies
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Allow Sharing to Messages</span>
                <p className="text-xs text-gray-400">
                  Allow viewers to share your story in direct messages
                </p>
              </div>
              <Switch checked={allowReshare} onCheckedChange={setAllowReshare} />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-gray-300">
                Allow Story Replies From
              </label>
              <select
                value={allowReplies}
                onChange={(e) =>
                  setAllowReplies(e.target.value as "everyone" | "following" | "off")
                }
                className="w-full h-11 px-3 bg-[#121212] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="everyone">Everyone</option>
                <option value="following">People You Follow Back</option>
                <option value="off">Off (Disable Story Replies)</option>
              </select>
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
