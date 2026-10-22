import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";
import { getProfileById, type Profile } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/settings/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Opexnal" },
      { name: "description", content: "Control who can follow, tag and mention you on Opexnal." },
      { property: "og:title", content: "Privacy — Opexnal" },
      { property: "og:description", content: "Control who can follow, tag and mention you." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const audienceOptions = [
  { value: "everyone", label: "Everyone" },
  { value: "followers", label: "People you follow" },
  { value: "nobody", label: "No one" },
];

function Privacy() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["profile", user?.id],
    queryFn: () => (user?.id ? getProfileById(user.id) : null),
    enabled: Boolean(user?.id),
  });

  async function update(patch: Partial<Pick<Profile, "is_private" | "show_activity_status" | "allow_tags_from" | "allow_mentions_from">>) {
    if (!user) return;
    const body: Record<string, unknown> = {};
    if (patch.is_private !== undefined) body.isPrivate = patch.is_private;
    if (patch.show_activity_status !== undefined) body.showActivityStatus = patch.show_activity_status;
    if (patch.allow_tags_from !== undefined) body.allowTagsFrom = patch.allow_tags_from;
    if (patch.allow_mentions_from !== undefined) body.allowMentionsFrom = patch.allow_mentions_from;
    try {
      const response = await fetch(apiUrl("/api/v1/users/me"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authClient.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to update privacy settings.");
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Privacy updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update privacy settings");
    }
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Privacy"
          left={
            <Link
              to="/settings"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      {isLoading || !profile ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <Label htmlFor="private-account" className="text-sm font-medium">
                Private account
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Only approved followers can see your posts.
              </p>
            </div>
            <Switch
              id="private-account"
              checked={profile.is_private}
              onCheckedChange={(checked) => update({ is_private: checked })}
            />
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <Label htmlFor="activity-status" className="text-sm font-medium">
                Show activity status
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Let people see when you were last active.
              </p>
            </div>
            <Switch
              id="activity-status"
              checked={profile.show_activity_status}
              onCheckedChange={(checked) => update({ show_activity_status: checked })}
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface px-4 py-3.5">
            <Label htmlFor="tags" className="text-sm font-medium">
              Who can tag you
            </Label>
            <Select
              value={profile.allow_tags_from}
              onValueChange={(value) => update({ allow_tags_from: value })}
            >
              <SelectTrigger id="tags" className="mt-2 h-11 rounded-xl bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-surface px-4 py-3.5">
            <Label htmlFor="mentions" className="text-sm font-medium">
              Who can mention you
            </Label>
            <Select
              value={profile.allow_mentions_from}
              onValueChange={(value) => update({ allow_mentions_from: value })}
            >
              <SelectTrigger id="mentions" className="mt-2 h-11 rounded-xl bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </AppShell>
  );
}
