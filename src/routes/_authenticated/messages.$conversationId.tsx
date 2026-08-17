import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
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
  }, [conversationId, user?.id, messagesQuery.data?.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
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

  const peer = peersQuery.data?.[0];

  return (
    <AppShell
      header={
        <ScreenHeader
          title={peer?.username ?? "Conversation"}
          left={
            <Link to="/messages" aria-label="Back" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          right={
            peer ? (
              <ProfileAvatar path={peer.avatar_url} fallback={initialsFor(peer)} className="h-8 w-8" />
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
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
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
        <Button type="submit" variant="brand" size="sm" disabled={!body.trim() || mutation.isPending}>
          Send
        </Button>
      </form>
    </AppShell>
  );
}
