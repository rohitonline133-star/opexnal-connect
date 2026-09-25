import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ChevronLeft, Loader2, ShieldAlert, UserX } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import {
  getConversationPeers,
  getMessages,
  markConversationRead,
  sendMessage,
} from "@/lib/messages";
import {
  isUserBlockedLocally,
  isUserRestrictedLocally,
  unblockUserAction,
} from "@/lib/settings-store";
import { broadcastEvent } from "@/lib/realtime";
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
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const peer = peersQuery.data?.[0];
  const isBlocked = peer
    ? isUserBlockedLocally(peer.id) || isUserBlockedLocally(peer.username)
    : false;
  const isRestricted = peer
    ? isUserRestrictedLocally(peer.id) || isUserRestrictedLocally(peer.username)
    : false;

  const mutation = useMutation({
    mutationFn: () => sendMessage(conversationId, user!.id, body),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
      broadcastEvent("NEW_MESSAGE", { conversationId });
    },
    onError: () => toast.error("Could not send your message"),
  });

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
            peer ? (
              <ProfileAvatar
                path={peer.avatar_url}
                fallback={initialsFor(peer)}
                className="h-8 w-8"
              />
            ) : null
          }
        />
      }
    >
      {messagesQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <ul className="space-y-2 px-4 py-4">
          {(messagesQuery.data ?? []).map((message) => {
            const mine = message.sender_id === user?.id;
            return (
              <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    mine ? "brand-gradient-bg text-primary-foreground" : "bg-secondary",
                  )}
                >
                  <p className="whitespace-pre-line break-words">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {timeAgo(message.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
          {(messagesQuery.data ?? []).length === 0 && (
            <li className="py-12 text-center text-sm text-muted-foreground">Say hello 👋</li>
          )}
        </ul>
      )}

      {isRestricted && (
        <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>This account is restricted. Their messages will not show read receipts.</span>
          </div>
        </div>
      )}

      {isBlocked ? (
        <div className="sticky bottom-20 flex flex-col items-center justify-center gap-2 border-t border-border bg-destructive/10 px-4 py-4 text-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
            <UserX className="h-4 w-4" />
            <span>You have blocked @{peer?.username}.</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Unblock this account to send messages and receive replies.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              if (peer) {
                unblockUserAction(peer.id);
                toast.success(`Unblocked @${peer.username}`);
                queryClient.invalidateQueries({ queryKey: ["conversation-peers", conversationId] });
              }
            }}
          >
            Unblock Account
          </Button>
        </div>
      ) : (
        <form
          className="sticky bottom-20 flex items-center gap-2 border-t border-border bg-background px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) mutation.mutate();
          }}
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder="Message…"
            aria-label="Message"
          />
          <Button
            type="submit"
            variant="brand"
            size="sm"
            disabled={!body.trim() || mutation.isPending}
          >
            Send
          </Button>
        </form>
      )}
    </AppShell>
  );
}
