import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BellOff,
  ChevronLeft,
  Copy,
  Flag,
  ImagePlus,
  Info,
  Loader2,
  MoreHorizontal,
  Send,
  Smile,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { ReportContentDialog } from "@/components/opexnal/post-controls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import {
  deleteMessage,
  getConversationPeers,
  getMessageReactions,
  getMessages,
  markConversationRead,
  sendMessage,
  setMessageReaction,
  type MessageRow,
} from "@/lib/messages";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation — Opexnal" },
      { name: "description", content: "A private Opexnal conversation." },
      { property: "og:title", content: "Conversation — Opexnal" },
      { property: "og:description", content: "A private Opexnal conversation." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conversation,
});

function Conversation() {
  const { conversationId } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState<MessageRow | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});

  useEffect(() => {
    setReactions(getMessageReactions());
  }, []);

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId),
  });

  const peersQuery = useQuery({
    queryKey: ["conversation-peers", conversationId, user?.id],
    queryFn: () => getConversationPeers(conversationId, user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (!user) return;
    markConversationRead(conversationId, user.id).catch(() => undefined);
  }, [conversationId, user, messagesQuery.data?.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const mutation = useMutation({
    mutationFn: () => sendMessage(conversationId, user!.id, body),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
    onError: () => toast.error("Could not send your message"),
  });

  const deleteMsgMutation = useMutation({
    mutationFn: (msgId: string) => deleteMessage(msgId),
    onSuccess: () => {
      toast.success("Message unsent");
      setActiveMessage(null);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
    onError: () => toast.error("Failed to unsend message"),
  });

  const handleReact = (msgId: string, emoji: string) => {
    setMessageReaction(msgId, emoji);
    setReactions((prev) => ({ ...prev, [msgId]: emoji }));
    setActiveMessage(null);
    toast.success(`Reacted ${emoji}`);
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBody((prev) => `${prev ? prev + " " : ""}[Sent image: ${file.name}]`);
      toast.info(`Attached ${file.name}`);
    }
  };

  const peer = peersQuery.data?.[0];

  return (
    <AppShell
      header={
        <ScreenHeader
          title={peer?.username ?? "Conversation"}
          left={
            <Link
              to="/messages"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Conversation details"
                onClick={() => setDetailsOpen(true)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Info className="h-5 w-5" />
              </button>
              {peer && (
                <Link to="/u/$username" params={{ username: peer.username }}>
                  <ProfileAvatar
                    path={peer.avatar_url}
                    fallback={initialsFor(peer)}
                    className="h-8 w-8"
                  />
                </Link>
              )}
            </div>
          }
        />
      }
    >
      {messagesQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <ul className="space-y-3 px-4 py-4 min-h-[60vh]">
          {(messagesQuery.data ?? []).map((message) => {
            const mine = message.sender_id === user?.id;
            const reaction = reactions[message.id];

            return (
              <li
                key={message.id}
                className={cn("flex flex-col group relative", mine ? "items-end" : "items-start")}
              >
                <div
                  onClick={() => setActiveMessage(message)}
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm cursor-pointer select-none transition-transform active:scale-98 shadow-sm",
                    mine
                      ? "brand-gradient-bg text-primary-foreground"
                      : "bg-secondary text-foreground",
                  )}
                >
                  <p className="whitespace-pre-line break-words">{message.body}</p>
                  <div
                    className={cn(
                      "mt-1 flex items-center justify-between gap-2 text-[10px]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <span>{timeAgo(message.created_at)}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      options
                    </span>
                  </div>
                </div>

                {/* Reacted Emoji Badge */}
                {reaction && (
                  <span className="-mt-2 mr-2 px-1.5 py-0.5 rounded-full bg-card border border-border text-xs shadow-sm">
                    {reaction}
                  </span>
                )}
              </li>
            );
          })}
          {(messagesQuery.data ?? []).length === 0 && (
            <li className="py-16 text-center text-sm text-muted-foreground">Say hello 👋</li>
          )}
        </ul>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleAttachImage}
      />

      {/* Input bar */}
      <form
        className="sticky bottom-20 flex items-center gap-2 border-t border-border bg-background px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) mutation.mutate();
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach photo"
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <ImagePlus className="h-5 w-5" />
        </button>

        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Message…"
          aria-label="Message"
          className="bg-secondary/40 text-xs rounded-full h-10"
        />

        <Button
          type="submit"
          variant="brand"
          size="sm"
          className="h-10 rounded-full px-4"
          disabled={!body.trim() || mutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Message Action Dialog */}
      <Dialog
        open={Boolean(activeMessage)}
        onOpenChange={(open) => !open && setActiveMessage(null)}
      >
        <DialogContent className="max-w-xs p-4 bg-card border border-border rounded-2xl space-y-3">
          <div className="flex items-center justify-around py-1 border-b border-border pb-3">
            {["❤️", "👍", "😂", "🔥", "😮", "😢"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => activeMessage && handleReact(activeMessage.id, emoji)}
                className="text-2xl p-1 rounded-full hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="space-y-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                if (activeMessage) {
                  navigator.clipboard.writeText(activeMessage.body);
                  toast.success("Text copied to clipboard");
                  setActiveMessage(null);
                }
              }}
              className="w-full py-2.5 px-3 text-left rounded-xl hover:bg-secondary flex items-center gap-2"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
              Copy Text
            </button>

            {activeMessage && activeMessage.sender_id === user?.id && (
              <button
                type="button"
                onClick={() => deleteMsgMutation.mutate(activeMessage.id)}
                className="w-full py-2.5 px-3 text-left rounded-xl text-destructive hover:bg-destructive/10 flex items-center gap-2 font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                Unsend Message
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveMessage(null);
                setReportOpen(true);
              }}
              className="w-full py-2.5 px-3 text-left rounded-xl text-destructive hover:bg-destructive/10 flex items-center gap-2 font-semibold"
            >
              <Flag className="h-4 w-4" />
              Report Message
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversation Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden bg-card border border-border rounded-2xl">
          <div className="divide-y divide-border text-center text-sm font-medium">
            {peer && (
              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  navigate({ to: "/u/$username", params: { username: peer.username } });
                }}
                className="w-full py-3.5 hover:bg-secondary/50 font-semibold text-foreground flex items-center justify-center gap-2"
              >
                View @{peer.username}'s Profile
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                toast.success("Notifications muted for this conversation");
                setDetailsOpen(false);
              }}
              className="w-full py-3.5 hover:bg-secondary/50 text-foreground flex items-center justify-center gap-2"
            >
              <BellOff className="h-4 w-4 text-muted-foreground" />
              Mute Notifications
            </button>

            {peer && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.from("blocks").insert({
                      blocker_id: user!.id,
                      blocked_id: peer.id,
                    });
                    toast.success(`Blocked @${peer.username}`);
                    setDetailsOpen(false);
                    navigate({ to: "/messages" });
                  } catch {
                    toast.error("Could not block user");
                  }
                }}
                className="w-full py-3.5 hover:bg-secondary/50 text-destructive flex items-center justify-center gap-2 font-semibold"
              >
                <UserX className="h-4 w-4" />
                Block @{peer.username}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDetailsOpen(false);
                setReportOpen(true);
              }}
              className="w-full py-3.5 hover:bg-secondary/50 text-destructive flex items-center justify-center gap-2 font-semibold"
            >
              <Flag className="h-4 w-4" />
              Report Conversation
            </button>

            <button
              type="button"
              onClick={() => setDetailsOpen(false)}
              className="w-full py-3 text-muted-foreground hover:bg-secondary/50 font-normal"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content Report Dialog */}
      <ReportContentDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetId={conversationId}
        targetType="message"
        viewerId={user?.id || "anonymous"}
      />
    </AppShell>
  );
}
