import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { initialsFor } from "@/lib/profile";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Opexnal" },
      { name: "description", content: "Follow requests and new followers on your Opexnal account." },
      { property: "og:title", content: "Activity — Opexnal" },
      { property: "og:description", content: "Follow requests and new followers on Opexnal." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Activity,
});

type Person = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

function Activity() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const requests = useQuery({
    queryKey: ["follow-requests", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_requests")
        .select("id, created_at, requester:profiles!follow_requests_requester_id_fkey(id, username, display_name, avatar_url)")
        .eq("target_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; created_at: string; requester: Person }[];
    },
  });

  const followers = useQuery({
    queryKey: ["recent-followers", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("created_at, follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
        .eq("following_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data as unknown as { created_at: string; follower: Person }[];
    },
  });

  async function respond(requestId: string, accept: boolean) {
    const { error } = accept
      ? await supabase.rpc("accept_follow_request", { _request_id: requestId })
      : await supabase.from("follow_requests").delete().eq("id", requestId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(accept ? "Follower accepted" : "Request declined");
    await queryClient.invalidateQueries({ queryKey: ["follow-requests", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["recent-followers", user?.id] });
  }

  const loading = requests.isLoading || followers.isLoading;
  const empty = !loading && !requests.data?.length && !followers.data?.length;

  return (
    <AppShell header={<ScreenHeader title="Activity" />}>
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center px-8 py-24 text-center">
          <UserPlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-base font-semibold">Nothing yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow requests and new followers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6 px-4 py-4">
          {!!requests.data?.length && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Follow requests
              </h2>
              <ul className="space-y-2">
                {requests.data.map((request) => (
                  <li key={request.id} className="flex items-center gap-3">
                    <PersonLink person={request.requester} />
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" variant="brand" onClick={() => respond(request.id, true)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="surface" onClick={() => respond(request.id, false)}>
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!!followers.data?.length && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                New followers
              </h2>
              <ul className="space-y-2">
                {followers.data.map((row) => (
                  <li key={row.follower.id} className="flex items-center gap-3">
                    <PersonLink person={row.follower} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

function PersonLink({ person }: { person: Person }) {
  return (
    <Link
      to="/u/$username"
      params={{ username: person.username }}
      className="flex min-w-0 items-center gap-3"
    >
      <ProfileAvatar path={person.avatar_url} fallback={initialsFor(person)} className="h-11 w-11" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">@{person.username}</p>
        <p className="truncate text-xs text-muted-foreground">
          {person.display_name || "Opexnal member"}
        </p>
      </div>
    </Link>
  );
}
