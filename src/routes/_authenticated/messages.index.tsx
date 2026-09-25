import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  Radio,
  Search,
  Users,
  Bell,
  Sparkles,
} from "lucide-react";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { NotesShelf } from "@/components/opexnal/notes-shelf";
import { BroadcastChannelsView } from "@/components/opexnal/broadcast-channels-view";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import { listConversations } from "@/lib/messages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({
    meta: [
      { title: "Messages & Channels — Opexnal" },
      {
        name: "description",
        content: "Your private Opexnal conversations, 24h notes and broadcast channels.",
      },
      { property: "og:title", content: "Messages & Channels — Opexnal" },
      {
        property: "og:description",
        content: "Your private Opexnal conversations, 24h notes and broadcast channels.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inbox,
});

function Inbox() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"primary" | "channels" | "requests">("primary");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: Boolean(user?.id),
  });

  const rawConversations = data ?? [];
  const conversations = rawConversations.filter((c) => {
    if (!search.trim()) return true;
    const peer = c.others[0];
    return (
      peer?.username.toLowerCase().includes(search.toLowerCase()) ||
      peer?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <AppShell
      header={
        <ScreenHeader
          title={user?.email?.split("@")[0] || "Messages"}
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
            <div className="flex items-center gap-2">
              <Link
                to="/explore"
                aria-label="New message"
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          }
        />
      }
    >
      {/* 24h Notes Shelf at Top of Inbox */}
      <NotesShelf
        currentUserId={user?.id}
        currentUsername={user?.email?.split("@")[0] || "creator"}
        currentUserAvatar={null}
        onSendDMToUser={(username) => {
          navigate({ to: "/explore" });
        }}
      />

      {/* Tabs: Primary Chats, Channels, Requests */}
      <div className="flex border-b border-border bg-surface px-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("primary")}
          className={cn(
            "flex-1 py-3 border-b-2 text-center transition-colors",
            activeTab === "primary"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Messages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("channels")}
          className={cn(
            "flex-1 py-3 border-b-2 text-center transition-colors flex items-center justify-center gap-1.5",
            activeTab === "channels"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Channels</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={cn(
            "flex-1 py-3 border-b-2 text-center transition-colors",
            activeTab === "requests"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Requests (0)
        </button>
      </div>

      {activeTab === "channels" ? (
        <BroadcastChannelsView />
      ) : activeTab === "requests" ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">No Message Requests</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Messages from accounts you don&apos;t follow appear here until you accept them.
          </p>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="p-4 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations, friends, or keywords..."
                className="pl-9 rounded-xl text-xs"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {search ? "No matching conversations" : "No conversations yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Open someone&apos;s profile and tap Message to start chatting, or browse Broadcast
                Channels!
              </p>
              <Button asChild variant="outline" className="rounded-xl text-xs">
                <Link to="/explore">Find People to Chat</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {conversations.map((conversation) => {
                const peer = conversation.others[0];
                return (
                  <li key={conversation.id}>
                    <Link
                      to="/messages/$conversationId"
                      params={{ conversationId: conversation.id }}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors"
                    >
                      <ProfileAvatar
                        path={peer?.avatar_url ?? null}
                        fallback={peer ? initialsFor(peer) : "?"}
                        className="h-12 w-12"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between pb-0.5">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              conversation.unread && "font-bold text-foreground",
                            )}
                          >
                            {peer?.display_name || peer?.username || "Conversation"}
                          </p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {conversation.lastMessage ?? "No messages yet"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}
