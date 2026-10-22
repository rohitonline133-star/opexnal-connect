import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  Search,
  Users,
  ShieldAlert,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import {
  listConversations,
  openDirectConversation,
  type ConversationSummary,
} from "@/lib/messages";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

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

type InboxTab = "primary" | "general" | "requests";

function Inbox() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InboxTab>("primary");
  const [search, setSearch] = useState("");
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [recipientUsername, setRecipientUsername] = useState("");

  const { data, isLoading } = useQuery<ConversationSummary[]>({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 10000,
  });

  const rawConversations: ConversationSummary[] = data ?? [];

  const conversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawConversations.filter((c: ConversationSummary) => {
      const peerName = c.others[0]?.username?.toLowerCase() || "";
      const lastMsg = c.lastMessage?.toLowerCase() || "";
      return !q || peerName.includes(q) || lastMsg.includes(q);
    });
  }, [rawConversations, search]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const uname = recipientUsername.trim().replace(/^@/, "");
    if (!uname || !user?.id) return;
    try {
      const response = await fetch(`/api/v1/users/${encodeURIComponent(uname)}`, {
        headers: authClient.getAuthHeader(),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        profile?: { id: string; username: string };
        error?: string;
      };
      if (!response.ok || !payload.profile) {
        throw new Error(payload.error || "That account could not be found.");
      }
      const conversationId = await openDirectConversation(user.id, payload.profile.id);
      setNewChatModalOpen(false);
      setRecipientUsername("");
      navigate({ to: "/messages/$conversationId", params: { conversationId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the conversation.");
    }
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={
            <div className="flex items-center gap-1.5 font-bold">
              <span>Messages</span>
              {rawConversations.some((c) => c.unread) && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
          }
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
            <button
              type="button"
              onClick={() => setNewChatModalOpen(true)}
              aria-label="New message"
              className="text-muted-foreground hover:text-foreground h-9 w-9 flex items-center justify-center rounded-xl hover:bg-surface transition-colors"
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
            </button>
          }
        />
      }
    >
      <div className="p-3 space-y-3 max-w-md mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-2xl bg-surface border-border text-xs"
          />
        </div>

        {/* Tabbed Inbox (Primary / General / Requests) */}
        <div className="flex bg-surface border border-border p-1 rounded-2xl gap-1">
          {(
            [
              { id: "primary", label: "Primary" },
              { id: "general", label: "General" },
              { id: "requests", label: "Requests" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all",
                activeTab === t.id
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : activeTab === "requests" ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-1 bg-card border border-border rounded-3xl p-6">
            <ShieldAlert className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-semibold text-foreground">No Message Requests</p>
            <p className="text-[11px]">
              Message requests are not configured yet. Use a profile’s Message action to start a conversation.
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2 bg-card border border-border rounded-3xl p-6">
            <p className="font-semibold text-foreground">No messages found</p>
            <p className="text-[11px]">Open someone&apos;s profile and tap Message to start one.</p>
            <Button
              asChild
              size="sm"
              className="mt-2 brand-gradient-bg text-white rounded-xl text-xs"
            >
              <Link to="/explore">Explore Creators</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
            {conversations.map((conversation: ConversationSummary) => {
              const peer = conversation.others[0];
              return (
                <li key={conversation.id}>
                  <Link
                    to="/messages/$conversationId"
                    params={{ conversationId: conversation.id }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors"
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
                    <span
                      className="shrink-0 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {timeAgo(conversation.lastMessageAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* New Conversation Modal */}
      <Dialog open={newChatModalOpen} onOpenChange={setNewChatModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              New Conversation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Start a one-on-one direct chat with any creator on Opexnal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStartChat} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Creator Username</label>
              <Input
                placeholder="e.g. alex_creator"
                value={recipientUsername}
                onChange={(e) => setRecipientUsername(e.target.value)}
                className="h-10 rounded-xl bg-surface border-border text-xs"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="surface"
                onClick={() => setNewChatModalOpen(false)}
                className="flex-1 text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold"
              >
                Start Chat
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
