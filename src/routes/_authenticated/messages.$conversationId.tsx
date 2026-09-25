import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Loader2,
  Mic,
  Phone,
  Video,
  Sparkles,
  Flame,
  Image as ImageIcon,
  Send,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { CallModal } from "@/components/opexnal/call-modal";
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
  const [activeCall, setActiveCall] = useState<"video" | "audio" | null>(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [viewOnce, setViewOnce] = useState(false);

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

  // Voice recording timer simulation
  useEffect(() => {
    if (!recordingVoice) return;
    const interval = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [recordingVoice]);

  const mutation = useMutation({
    mutationFn: () => {
      const finalBody = viewOnce ? `🔥 [View Once Media] ${body}` : body;
      return sendMessage(conversationId, user!.id, finalBody);
    },
    onSuccess: () => {
      setBody("");
      setViewOnce(false);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
    onError: () => toast.error("Could not send your message"),
  });

  function handleSendVoiceNote() {
    setRecordingVoice(false);
    const voiceNoteText = `🎙️ Voice Note (${voiceSeconds}s)`;
    setVoiceSeconds(0);
    sendMessage(conversationId, user!.id, voiceNoteText)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
        toast.success("Voice note sent!");
      })
      .catch(() => toast.error("Could not send voice note"));
  }

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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveCall("audio")}
                aria-label="Voice Call"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground hover:bg-secondary transition-colors"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveCall("video")}
                aria-label="Video Call"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors"
              >
                <Video className="h-4 w-4" />
              </button>
              {peer && (
                <ProfileAvatar
                  path={peer.avatar_url}
                  fallback={initialsFor(peer)}
                  className="h-8 w-8 ml-1"
                />
              )}
            </div>
          }
        />
      }
    >
      {/* Active Audio or Video Call Overlay */}
      {activeCall && peer && (
        <CallModal
          peerName={peer.display_name || peer.username}
          peerUsername={peer.username}
          peerAvatar={peer.avatar_url}
          callType={activeCall}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {messagesQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : (
        <ul className="space-y-2.5 px-4 py-4 pb-28">
          {(messagesQuery.data ?? []).map((message) => {
            const mine = message.sender_id === user?.id;
            const isViewOnce = message.body.startsWith("🔥 [View Once");
            const isVoice = message.body.startsWith("🎙️ Voice Note");
            return (
              <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                    mine
                      ? "brand-gradient-bg text-primary-foreground"
                      : "bg-secondary text-foreground",
                    isViewOnce && "border border-amber-500/50",
                  )}
                >
                  {isVoice ? (
                    <div className="flex items-center gap-2 py-0.5">
                      <Mic className="h-4 w-4 animate-pulse" />
                      <span className="font-semibold text-xs">{message.body}</span>
                    </div>
                  ) : isViewOnce ? (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Flame className="h-4 w-4 text-amber-300 fill-amber-300" />
                      <span>{message.body}</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line break-words">{message.body}</p>
                  )}
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

      {/* Input Bar */}
      <div className="fixed bottom-0 inset-x-0 max-w-lg mx-auto border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 z-30">
        {recordingVoice ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2">
            <div className="flex items-center gap-2 text-red-500">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold">
                00:{voiceSeconds.toString().padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground">Recording audio note...</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setRecordingVoice(false)}
                className="h-8 text-xs text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSendVoiceNote}
                className="h-8 rounded-xl brand-gradient-bg text-primary-foreground text-xs font-semibold"
              >
                Send Voice
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (body.trim()) mutation.mutate();
            }}
          >
            {/* View once toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !viewOnce;
                setViewOnce(next);
                if (next) toast.info("Disappearing media / View Once enabled");
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                viewOnce
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/40"
                  : "text-muted-foreground hover:bg-secondary",
              )}
              title="Toggle View Once Disappearing Media"
            >
              <Flame className="h-4 w-4" />
            </button>

            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              placeholder={viewOnce ? "Disappearing message..." : "Message…"}
              aria-label="Message"
              className="rounded-xl text-xs h-10"
            />

            {/* Voice record trigger */}
            {!body.trim() ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setRecordingVoice(true);
                  setVoiceSeconds(0);
                }}
                className="h-10 w-10 shrink-0 rounded-xl hover:bg-secondary text-primary"
                aria-label="Record voice note"
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={mutation.isPending}
                className="h-10 px-3.5 rounded-xl font-semibold text-xs"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        )}
      </div>
    </AppShell>
  );
}
