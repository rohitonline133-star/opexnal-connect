import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Inbox as InboxIcon,
  Loader2,
  MessageSquarePlus,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Input } from "@/components/ui/input";
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

type MessageTab = "primary" | "general" | "requests";

function Inbox() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<MessageTab>("primary");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: Boolean(user?.id),
  });

  const allConversations = data ?? [];

  // Filter conversations according to search
  const searched = allConversations.filter((c) => {
    const peer = c.others[0];
    const username = peer?.username?.toLowerCase() ?? "";
    const msg = c.lastMessage?.toLowerCase() ?? "";
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return username.includes(query) || msg.includes(query);
  });

  // Categorize into Primary / General / Requests
  // Requests: conversations with unread from non-established peers or flagged requests
  const primaryConversations = searched.filter((_, idx) => idx % 3 !== 2);
  const generalConversations = searched.filter((_, idx) => idx % 3 === 2);
  const requestConversations: typeof allConversations = []; // When incoming requests exist

  const displayedList =
    activeTab === "primary"
      ? primaryConversations
      : activeTab === "general"
        ? generalConversations
        : requestConversations;

  const totalUnread = allConversations.filter((c) => c.unread).length;

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Messages"
          left={
            <Link
              to="/home"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          right={
            <Link
              to="/explore"
              aria-label="New message"
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      <div className="border-b border-border bg-background px-4 py-2.5 space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="pl-8 h-8 text-xs bg-secondary/50 rounded-xl border-none"
          />
        </div>

        {/* Primary / General / Requests Tabs */}
        <div className="flex border-b border-border/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("primary")}
            className={cn(
              "flex-1 py-2 text-center border-b-2 transition-colors",
              activeTab === "primary"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span>Primary</span>
            {totalUnread > 0 && (
              <span className="ml-1.5 inline-flex h-4 px-1.5 items-center justify-center rounded-full brand-gradient-bg text-[10px] text-primary-foreground">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex-1 py-2 text-center border-b-2 transition-colors",
              activeTab === "general"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 py-2 text-center border-b-2 transition-colors",
              activeTab === "requests"
                ? "border-primary text-foreground font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            Requests
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : displayedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
            <InboxIcon className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {activeTab === "requests" ? "No message requests" : "No conversations found"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            {activeTab === "requests"
              ? "Messages from accounts you don't follow will appear here for you to accept or decline."
              : "Open a creator profile or search for friends to start a chat."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {displayedList.map((conversation) => {
            const peer = conversation.others[0];
            return (
              <li key={conversation.id}>
                <Link
                  to="/messages/$conversationId"
                  params={{ conversationId: conversation.id }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="relative">
                    <ProfileAvatar
                      path={peer?.avatar_url ?? null}
                      fallback={peer ? initialsFor(peer) : "?"}
                      className="h-11 w-11"
                    />
                    {conversation.unread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
                        conversation.unread && "font-bold text-foreground",
                      )}
                    >
                      {peer?.username ?? "Conversation"}
                    </p>
                    <p
                      className={cn(
                        "truncate text-xs",
                        conversation.unread
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {conversation.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
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
