import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Clock, Moon, Volume2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoredSettings, updateSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/_authenticated/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Preferences — Settings — Opexnal" },
      {
        name: "description",
        content: "Control push, email and quiet mode notifications on Opexnal.",
      },
    ],
  }),
  component: SettingsNotificationsPage,
});

function SettingsNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.userId || "user_maya";

  const { data: settings } = useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getStoredSettings(userId),
  });

  const [pauseAll, setPauseAll] = useState(settings?.pauseAllNotifications ?? false);
  const [quietMode, setQuietMode] = useState(settings?.quietModeEnabled ?? false);
  const [bedtimeReminder, setBedtimeReminder] = useState(settings?.bedtimeReminderEnabled ?? true);
  const [securityAlerts, setSecurityAlerts] = useState(settings?.securityAlertsEmail ?? true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateSettings(userId, {
        pauseAllNotifications: pauseAll,
        quietModeEnabled: quietMode,
        bedtimeReminderEnabled: bedtimeReminder,
        securityAlertsEmail: securityAlerts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
      toast.success("Notification preferences updated.");
    },
    onError: () => {
      toast.error("Failed to update notification settings.");
    },
  });

  return (
    <AppShell activeTab="profile">
      <div className="min-h-screen bg-black text-white pb-20 max-w-xl mx-auto">
        <ScreenHeader title="Notifications" showBack onBack={() => navigate({ to: "/settings" })} />

        <div className="p-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Push Notifications
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Pause All</span>
                <p className="text-xs text-gray-400">Temporarily silence all push notifications</p>
              </div>
              <Switch checked={pauseAll} onCheckedChange={setPauseAll} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Quiet Mode</span>
                <p className="text-xs text-gray-400">
                  Automatically mute notifications overnight (11 PM - 7 AM)
                </p>
              </div>
              <Switch checked={quietMode} onCheckedChange={setQuietMode} />
            </div>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Sleep & Bedtime Reminder</span>
                <p className="text-xs text-gray-400">
                  Receive gentle alerts to wind down screen time
                </p>
              </div>
              <Switch checked={bedtimeReminder} onCheckedChange={setBedtimeReminder} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Security & Email
            </h3>

            <div className="p-4 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white">Security Alerts by Email</span>
                <p className="text-xs text-gray-400">
                  Immediate email whenever a new login or password reset occurs
                </p>
              </div>
              <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full h-11 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:from-[#6D28D9] hover:to-[#7E22CE] text-white font-semibold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2"
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
