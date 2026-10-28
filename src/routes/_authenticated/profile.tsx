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
    if (loading) return;

    if (!user?.id) {
      navigate({ to: "/auth", search: { mode: "login" }, replace: true });
      return;
    }

    if (isLoading) return;

    const realUsername =
      profile?.username ||
      user?.user_metadata?.username ||
      user?.username ||
      (user?.email && user.email.includes("@")
        ? user.email
            .split("@")[0]
            ?.toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
        : null) ||
      user.id
        .replace(/^user_/, "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");

    if (realUsername) {
      navigate({ to: "/u/$username", params: { username: realUsername }, replace: true });
    } else {
      navigate({ to: "/auth", search: { mode: "login" }, replace: true });
    }
  }, [loading, isLoading, profile, user, navigate]);

  return (
    <AppShell activeTab="profile">
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    </AppShell>
  );
}
