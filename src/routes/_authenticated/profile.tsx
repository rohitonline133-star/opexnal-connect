import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/opexnal/app-shell";
import { useSession } from "@/hooks/use-session";
import { getProfileById } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Opexnal" },
      {
        name: "description",
        content: "View and edit your Opexnal profile, posts, reels, and highlights.",
      },
      { property: "og:title", content: "Profile — Opexnal" },
      { property: "og:description", content: "View and edit your Opexnal profile." },
      { property: "og:type", content: "profile" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CurrentUserProfileRedirect,
});

function CurrentUserProfileRedirect() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["current-user-profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => getProfileById(user!.id),
  });

  useEffect(() => {
    if (loading || isLoading) return;

    if (profile?.username) {
      navigate({ to: "/u/$username", params: { username: profile.username }, replace: true });
    } else if (user?.id) {
      // Do not redirect an authenticated account to a seeded/demo identity.
      // Remain here until the real profile is loaded or created.
      return;
    } else {
      navigate({ to: "/auth", search: { mode: "login" }, replace: true });
    }
  }, [loading, isLoading, profile, user, navigate]);

  if (!loading && !isLoading && user?.id && !profile?.username) {
    return (
      <AppShell activeTab="profile">
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <p role="status" className="max-w-md text-center text-sm text-muted-foreground">
            Your profile could not be found yet. Opexnal will not redirect you to another user’s profile.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeTab="profile">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    </AppShell>
  );
}
