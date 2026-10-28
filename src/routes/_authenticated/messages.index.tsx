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
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { getStoredNotes, saveUserNote, deleteUserNote, type UserNote } from "@/lib/notes";
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

  const [notes, setNotes] = useState<UserNote[]>(() => getStoredNotes());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteAudience, setNoteAudience] = useState<"followers" | "close_friends">("followers");

  const myNote = notes.find((n) => n.userId === user?.id);

  const handleSaveNote = () => {
    if (!noteText.trim() || !user) return;
    saveUserNote({
      userId: user.id,
      username: user.username || user.user_metadata?.username || "me",
      displayName: user.user_metadata?.display_name || user.username || "Me",
      avatarUrl: user.user_metadata?.avatar_url || null,
      text: noteText.trim(),
      audience: noteAudience,
    });
    setNotes(getStoredNotes());
    setNoteDialogOpen(false);
    toast.success("Note shared for 24 hours ✨");
  };

  const handleDeleteNote = () => {
    if (!user) return;
    deleteUserNote(user.id);
    setNotes(getStoredNotes());
    setNoteText("");
    setNoteDialogOpen(false);
    toast.success("Note deleted");
  };

  const { data, isLoading } = useQuery<ConversationSummary[]>({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: Boolean(user?.id),
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
    if (!uname) return;
    toast.info(`Opening chat with @${uname}...`);
    setNewChatModalOpen(false);
    navigate({ to: "/explore" });
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
        {/* Notes Tray (Instagram Notes) */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar items-start border-b border-border">
          {/* My Note */}
          <div
            className="flex flex-col items-center shrink-0 cursor-pointer group"
            onClick={() => {
              setNoteText(myNote?.text || "");
              setNoteAudience(myNote?.audience || "followers");
              setNoteDialogOpen(true);
            }}
          >
            <div className="relative mb-1">
              <div className="max-w-[76px] px-2 py-0.5 bg-surface border border-border rounded-xl text-[10px] text-center shadow-xs truncate mb-1 text-foreground">
                {myNote ? myNote.text : "Note..."}
              </div>
              <div className="relative mx-auto w-12 h-12">
                <ProfileAvatar
                  path={user?.user_metadata?.avatar_url ?? null}
                  fallback={user?.username?.[0]?.toUpperCase() ?? "U"}
                  className="h-12 w-12"
                />
                {!myNote && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full brand-gradient-bg text-white flex items-center justify-center border-2 border-background shadow-xs">
                    <Plus className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[65px]">
              {myNote ? "Your note" : "Share note"}
            </span>
          </div>

          {/* Peer Notes */}
          {notes
            .filter((n) => n.userId !== user?.id)
            .map((note) => (
              <div
                key={note.id}
                className="flex flex-col items-center shrink-0 cursor-pointer group"
                onClick={() => toast.info(`@${note.username}: "${note.text}"`)}
              >
                <div className="max-w-[76px] px-2 py-0.5 bg-surface border border-border rounded-xl text-[10px] text-center shadow-xs truncate mb-1 text-foreground">
                  {note.text}
                </div>
                <div className="relative mx-auto w-12 h-12">
                  <ProfileAvatar
                    path={note.avatarUrl}
                    fallback={note.username[0]?.toUpperCase() ?? "?"}
                    className="h-12 w-12"
                    ring
                  />
                </div>
                <span className="text-[11px] text-muted-foreground truncate max-w-[65px] mt-1">
                  {note.username}
                </span>
              </div>
            ))}
        </div>

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
              Messages from accounts you don&apos;t follow will appear here.
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

      {/* Share a Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl p-5 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <span>{myNote ? "Update your Note" : "Share a Thought"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Notes are visible to your chosen audience at the top of their inbox for 24 hours.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <textarea
                rows={2}
                maxLength={60}
                placeholder="Share what's on your mind..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-3 rounded-2xl bg-surface border border-border text-xs focus:outline-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                {noteText.length}/60
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-semibold block text-foreground">Share with</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNoteAudience("followers")}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-colors",
                    noteAudience === "followers"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  Followers
                </button>
                <button
                  type="button"
                  onClick={() => setNoteAudience("close_friends")}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-colors",
                    noteAudience === "close_friends"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  Close Friends
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {myNote && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteNote}
                  className="text-xs rounded-xl h-9"
                >
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="surface"
                onClick={() => setNoteDialogOpen(false)}
                className="flex-1 text-xs rounded-xl h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!noteText.trim()}
                onClick={handleSaveNote}
                className="flex-1 text-xs rounded-xl brand-gradient-bg text-white font-semibold h-9"
              >
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
