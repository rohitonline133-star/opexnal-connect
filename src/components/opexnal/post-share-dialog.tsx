import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Copy, Mail, MessageCircle, Search, Send, Share2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { listConversations, sendMessage } from "@/lib/messages";
import { recordShare } from "@/lib/posts";

type PostShareDialogProps = {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PostShareDialog({ postId, open, onOpenChange }: PostShareDialogProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => listConversations(user!.id),
    enabled: Boolean(open && user?.id),
  });

  const contacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations
      .filter((conversation) => conversation.others[0])
      .filter((conversation) => {
        const peer = conversation.others[0]!;
        return (
          !query ||
          peer.username.toLowerCase().includes(query) ||
          peer.display_name.toLowerCase().includes(query)
        );
      });
  }, [conversations, search]);

  const postUrl = typeof window === "undefined" ? "" : `${window.location.origin}/p/${postId}`;
  const shareText = `Check out this post on Opexnal: ${postUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(postUrl);
      if (user?.id) await recordShare(postId, user.id, "link");
      toast.success("Post link copied");
    } catch {
      toast.error("Could not copy the post link.");
    }
  }

  async function sendToContact() {
    if (!user?.id || !selectedConversation) return;
    setSending(true);
    try {
      await sendMessage(selectedConversation, user.id, postUrl);
      void recordShare(postId, user.id, "message").catch(() => undefined);
      await queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Post sent in your conversation.");
      setSelectedConversation(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send this post.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-md flex-col gap-4 overflow-hidden rounded-t-2xl p-4">
        <DialogHeader>
          <DialogTitle>Share post</DialogTitle>
          <DialogDescription>Send this post to a conversation or share its link.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            className="pl-9"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading conversations…</p>
          ) : contacts.length ? (
            <div className="grid grid-cols-3 gap-3">
              {contacts.map((conversation) => {
                const peer = conversation.others[0]!;
                const selected = selectedConversation === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversation(selected ? null : conversation.id)}
                    aria-pressed={selected}
                    className={`flex min-w-0 flex-col items-center gap-2 rounded-xl border p-2 text-center transition-colors ${selected ? "border-primary bg-primary/10" : "border-transparent hover:bg-secondary"}`}
                  >
                    <span className="relative">
                      <ProfileAvatar
                        path={peer.avatar_url}
                        fallback={initialsFor(peer)}
                        className="h-14 w-14"
                      />
                      {selected && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <span aria-hidden="true">✓</span>
                        </span>
                      )}
                    </span>
                    <span className="w-full truncate text-xs">
                      {peer.display_name || peer.username}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No matching conversations yet.</p>
              <Link
                to="/messages"
                onClick={() => onOpenChange(false)}
                className="mt-2 inline-block text-sm font-medium text-primary"
              >
                Open messages
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => {
              if (user?.id) {
                void recordShare(postId, user.id, "other").catch(() => undefined);
              }
              window.location.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            }}
            className="flex flex-col items-center gap-1 rounded-xl p-2 text-xs hover:bg-secondary"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex flex-col items-center gap-1 rounded-xl p-2 text-xs hover:bg-secondary"
          >
            <Copy className="h-5 w-5" />
            Copy link
          </button>
          <a
            href={`mailto:?subject=${encodeURIComponent("Opexnal post")}&body=${encodeURIComponent(shareText)}`}
            onClick={() => {
              if (user?.id) {
                void recordShare(postId, user.id, "other").catch(() => undefined);
              }
            }}
            className="flex flex-col items-center gap-1 rounded-xl p-2 text-xs hover:bg-secondary"
          >
            <Mail className="h-5 w-5" />
            Email
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(shareText)}`}
            onClick={() => {
              if (user?.id) {
                void recordShare(postId, user.id, "other").catch(() => undefined);
              }
            }}
            className="flex flex-col items-center gap-1 rounded-xl p-2 text-xs hover:bg-secondary"
          >
            <Smartphone className="h-5 w-5" />
            SMS
          </a>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                void navigator
                  .share({
                    title: "Opexnal post",
                    text: shareText,
                    url: postUrl,
                  })
                  .then(() => {
                    if (user?.id) {
                      void recordShare(postId, user.id, "other").catch(() => undefined);
                    }
                  })
                  .catch(() => undefined);
              } else {
                void copyLink();
              }
            }}
            className="flex flex-col items-center gap-1 rounded-xl p-2 text-xs hover:bg-secondary"
          >
            <Share2 className="h-5 w-5" />
            More
          </button>
        </div>

        <Button
          type="button"
          onClick={() => void sendToContact()}
          disabled={!selectedConversation || sending}
          className="w-full"
        >
          <Send className="mr-2 h-4 w-4" />
          {sending ? "Sending…" : "Send"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
