import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { ProfileAvatar } from "@/components/opexnal/avatar";
import { getStoryTray } from "@/lib/stories";
import { initialsFor } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function StoryTray({ viewerId = "" }: { viewerId?: string | null }) {
  const currentViewerId = viewerId || "";
  const { data, isLoading } = useQuery({
    queryKey: ["story-tray", currentViewerId],
    queryFn: () => getStoryTray(currentViewerId),
  });

  const groups = data ?? [];
  const mine = currentViewerId ? groups.find((g) => g.author.id === currentViewerId) : null;
  const others = currentViewerId ? groups.filter((g) => g.author.id !== currentViewerId) : groups;

  return (
    <div className="border-b border-border">
      <ul className="flex gap-4 overflow-x-auto px-4 py-3">
        <li className="shrink-0">
          {mine ? (
            <Link
              to="/stories/$userId"
              params={{ userId: mine.author.id }}
              className="flex w-16 flex-col items-center gap-1.5"
            >
              <MyStoryBadge
                avatarUrl={mine.author.avatar_url}
                fallback={initialsFor(mine.author)}
                ring={mine.hasUnseen}
              />
              <span className="w-16 truncate text-center text-xs text-muted-foreground">
                Your story
              </span>
            </Link>
          ) : (
            <Link to="/stories/new" className="flex w-16 flex-col items-center gap-1.5">
              <MyStoryBadge avatarUrl={null} fallback="Me" ring={false} />
              <span className="w-16 truncate text-center text-xs text-muted-foreground">
                Your story
              </span>
            </Link>
          )}
        </li>

        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="shrink-0">
              <div className="h-16 w-16 animate-pulse rounded-full bg-secondary" />
            </li>
          ))}

        {others.map((group) => (
          <li key={group.author.id} className="shrink-0">
            <Link
              to="/stories/$userId"
              params={{ userId: group.author.id }}
              className="flex w-16 flex-col items-center gap-1.5"
            >
              <ProfileAvatar
                path={group.author.avatar_url}
                fallback={initialsFor(group.author)}
                className={cn("h-16 w-16", !group.hasUnseen && "opacity-70")}
                ring={group.hasUnseen}
              />
              <span className="w-16 truncate text-center text-xs text-muted-foreground">
                {group.author.username}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MyStoryBadge({
  avatarUrl,
  fallback,
  ring,
}: {
  avatarUrl: string | null;
  fallback: string;
  ring: boolean;
}) {
  return (
    <span className="relative">
      <ProfileAvatar path={avatarUrl} fallback={fallback} className="h-16 w-16" ring={ring} />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background brand-gradient-bg text-primary-foreground">
        <Plus className="h-3 w-3" aria-hidden="true" />
      </span>
    </span>
  );
}
