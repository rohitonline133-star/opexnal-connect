import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Loader2, MessageSquarePlus } from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import { listConversations } from "@/lib/messages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — Opexnal" },
      { name: "description", content: "Your private Opexnal conversations." },
      { property: "og:title", content: "Messages — Opexnal" },
      { property: "og:description", content: "Your private Opexnal conversations." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: Boolean(user?.id),
  });

  const conversations = data ?? [];

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Messages"
          left={
            <Link to="/home" aria-label="Back" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          right={
            <Link to="/explore" aria-label="New message" className="text-muted-foreground hover:text-foreground">
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-muted-foreground">
          No conversations yet. Open someone&apos;s profile and tap Message to start one.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {conversations.map((conversation) => {
            const peer = conversation.others[0];
            return (
              <li key={conversation.id}>
                <Link
                  to="/messages/$conversationId"
                  params={{ conversationId: conversation.id }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50"
                >
                  <ProfileAvatar
                    path={peer?.avatar_url ?? null}
                    fallback={peer ? initialsFor(peer) : "?"}
                    className="h-11 w-11"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", conversation.unread && "font-semibold")}>
                      {peer?.username ?? "Conversation"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(conversation.lastMessageAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
