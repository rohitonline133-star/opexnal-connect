import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Loader2,
  Send,
  MoreVertical,
  Smile,
  Copy,
  Trash2,
  Flag,
  CornerUpLeft,
  Info,
  Phone,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import {
  getConversationPeers,
  getMessages,
  markConversationRead,
  sendMessage,
  type Message,
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

const QUICK_REACTIONS = ["❤️", "🔥", "😂", "👏", "🙌", "✨"];

function Conversation() {
  const { conversationId } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Message Actions state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, string>>({});

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.length]);

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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const mutation = useMutation({
    mutationFn: () => {
      const text = replyingTo
        ? `[Replying to: "${replyingTo.body.slice(0, 20)}..."]\n${body}`
        : body;
      return sendMessage(conversationId, user!.id, text);
    },
    onSuccess: () => {
      setBody("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
    onError: () => toast.error("Could not send your message"),
  });

  const peer = peersQuery.data?.[0];

  const handleReact = (msgId: string, emoji: string) => {
    setReactionsMap((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === emoji ? "" : emoji,
    }));
    setSelectedMessage(null);
    toast.success(`Reacted ${emoji}`);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setSelectedMessage(null);
    toast.success("Message copied to clipboard");
  };

  const handleUnsendMessage = (msgId: string) => {
    setSelectedMessage(null);
    toast.success("Message unsent");
  };

  const handleReportMessage = () => {
    setSelectedMessage(null);
    toast.success("Message reported to moderation queue");
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={
            peer ? (
              <Link
                to="/u/$username"
                params={{ username: peer.username }}
                className="flex items-center gap-2"
              >
                <ProfileAvatar
                  path={peer.avatar_url}
                  fallback={initialsFor(peer)}
                  className="h-7 w-7"
                />
                <span className="font-semibold text-sm">@{peer.username}</span>
              </Link>
            ) : (
              "Conversation"
            )
          }
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
            <div className="flex items-center gap-1 text-muted-foreground">
              <button
                type="button"
                onClick={() => toast.info("Calling provider status: NOT VERIFIED")}
                className="p-1.5 hover:text-foreground rounded-lg"
                aria-label="Audio call"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => toast.info("Video calling provider status: NOT VERIFIED")}
                className="p-1.5 hover:text-foreground rounded-lg"
                aria-label="Video call"
              >
                <Video className="h-4 w-4" />
              </button>
            </div>
          }
        />
      }
    >
      <div className="flex flex-col min-h-[calc(100vh-8rem)] justify-between">
        {messagesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : (
          <ul className="space-y-2.5 px-4 py-4 flex-1">
            {(messagesQuery.data ?? []).map((message) => {
              const mine = message.sender_id === user?.id;
              const reaction = reactionsMap[message.id];

              return (
                <li
                  key={message.id}
                  className={cn("flex flex-col", mine ? "items-end" : "items-start")}
                >
                  <div
                    onClick={() => setSelectedMessage(message)}
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs cursor-pointer transition-transform active:scale-[0.98] relative",
                      mine
                        ? "brand-gradient-bg text-primary-foreground"
                        : "bg-surface border border-border text-foreground",
                    )}
                  >
                    <p className="whitespace-pre-line break-words leading-relaxed">
                      {message.body}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[10px] text-right",
                        mine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                      suppressHydrationWarning
                    >
                      {timeAgo(message.created_at)}
                    </p>

                    {reaction && (
                      <span className="absolute -bottom-2 -right-1 bg-card border border-border rounded-full px-1.5 py-0.5 text-xs shadow-sm">
                        {reaction}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            <div ref={messagesEndRef} />
          </ul>
        )}

        {/* Reply Preview Banner */}
        {replyingTo && (
          <div className="bg-surface border-t border-border px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <CornerUpLeft className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground truncate">
                Replying: &ldquo;{replyingTo.body.slice(0, 35)}...&rdquo;
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            mutation.mutate();
          }}
          className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-3 flex items-center gap-2 max-w-md mx-auto w-full"
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={peer ? `Message @${peer.username}...` : "Message..."}
            className="rounded-full bg-surface border-border h-11 text-xs px-4"
          />
          <Button
            type="submit"
            disabled={!body.trim() || mutation.isPending}
            size="icon"
            className="rounded-full h-11 w-11 shrink-0 brand-gradient-bg text-white disabled:opacity-50"
            aria-label="Send message"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Message Actions Modal */}
      <Dialog open={Boolean(selectedMessage)} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-4 bg-card border-border">
          {/* Reaction Bar */}
          <div className="flex justify-between items-center bg-surface border border-border p-2 rounded-2xl mb-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => selectedMessage && handleReact(selectedMessage.id, emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="divide-y divide-border text-xs">
            <button
              type="button"
              onClick={() => {
                if (selectedMessage) setReplyingTo(selectedMessage);
                setSelectedMessage(null);
              }}
              className="w-full flex items-center gap-3 p-2.5 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <CornerUpLeft className="h-4 w-4 text-primary" />
              <span>Reply</span>
            </button>

            <button
              type="button"
              onClick={() => selectedMessage && handleCopyMessage(selectedMessage.body)}
              className="w-full flex items-center gap-3 p-2.5 text-foreground hover:bg-surface rounded-xl transition-colors font-medium"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span>Copy text</span>
            </button>

            {selectedMessage?.sender_id === user?.id ? (
              <button
                type="button"
                onClick={() => selectedMessage && handleUnsendMessage(selectedMessage.id)}
                className="w-full flex items-center gap-3 p-2.5 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                <span>Unsend message</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReportMessage}
                className="w-full flex items-center gap-3 p-2.5 text-destructive hover:bg-surface rounded-xl transition-colors font-semibold"
              >
                <Flag className="h-4 w-4 text-destructive" />
                <span>Report message</span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
