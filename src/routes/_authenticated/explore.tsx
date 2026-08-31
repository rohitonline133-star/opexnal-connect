import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Loader2, Search } from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { initialsFor } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explore people — Opexnal" },
      { name: "description", content: "Search Opexnal for creators, friends and communities." },
      { property: "og:title", content: "Explore people — Opexnal" },
      {
        property: "og:description",
        content: "Search Opexnal for creators, friends and communities.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const [term, setTerm] = useState("");
  const query = term.trim().toLowerCase();

  const { data, isFetching } = useQuery({
    queryKey: ["search-people", query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_verified, is_private")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq("is_deactivated", false)
        .order("followers_count", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell header={<ScreenHeader title="Explore" />}>
      <div className="px-4 py-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search people"
            aria-label="Search people"
            maxLength={50}
            className="h-11 rounded-xl bg-surface pl-10"
          />
        </div>

        <div className="mt-4 space-y-1">
          {query.length < 2 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Type at least two characters to find people on Opexnal.
            </p>
          )}
          {isFetching && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          {query.length >= 2 && !isFetching && data?.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">No people found.</p>
          )}
          {data?.map((person) => (
            <Link
              key={person.id}
              to="/u/$username"
              params={{ username: person.username }}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-secondary"
            >
              <ProfileAvatar
                path={person.avatar_url}
                fallback={initialsFor(person)}
                className="h-11 w-11"
              />
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate text-sm font-medium">
                  @{person.username}
                  {person.is_verified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-label="Verified" />
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {person.display_name || "Opexnal member"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
