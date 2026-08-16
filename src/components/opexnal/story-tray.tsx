import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { ProfileAvatar } from "@/components/opexnal/avatar";
import { getStoryTray } from "@/lib/stories";
import { initialsFor } from "@/lib/profile";
import { cn } from "@/lib/utils";

export function StoryTray({ viewerId }: { viewerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["story-tray", viewerId],
    queryFn: () => getStoryTray(viewerId),
  });

  const groups = data ?? [];
  const mine = groups.find((g) => g.author.id === viewerId);
  const others = groups.filter((g) => g.author.id !== viewerId);

  return (
    <div className="border-b border-border">
      <ul className="flex gap-4 overflow-x-auto px-4 py-3">
        <li className="shrink-0">
          <Link
            to={mine ? "/stories/$userId" : "/stories/new"}
            params={mine ? { userId: viewerId } : undefined}
            className="flex w-16 flex-col items-center gap-1.5"
          >
            <span className="relative">
              <ProfileAvatar
                path={mine?.author.avatar_url ?? null}
                fallback={mine ? initialsFor(mine.author) : "Me"}
                className="h-16 w-16"
                ring={Boolean(mine?.hasUnseen)}
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background brand-gradient-bg text-primary-foreground">
                <Plus className="h-3 w-3" aria-hidden="true" />
              </span>
            </span>
            <span className="w-16 truncate text-center text-xs text-muted-foreground">Your story</span>
          </Link>
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
