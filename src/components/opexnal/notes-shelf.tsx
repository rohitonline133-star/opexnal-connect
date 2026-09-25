import { useState } from "react";
import { Plus, Smile, Music, Users, Sparkles, Send, X, Check } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DMNote,
  getSavedNotes,
  saveUserNote,
  CURATED_AUDIO_TRACKS,
} from "@/lib/interactive-features";
import { initialsFor } from "@/lib/profile";
import { cn } from "@/lib/utils";

interface NotesShelfProps {
  currentUserId?: string | undefined;
  currentUsername?: string | undefined;
  currentUserAvatar?: string | null | undefined;
  onSendDMToUser?: ((username: string, replyText?: string) => void) | undefined;
}

const MOOD_EMOJIS = ["💭", "✨", "🎧", "☕", "🚀", "🎨", "🔥", "🏔️", "💡", "🌿", "⚡", "😴"];

export function NotesShelf({
  currentUserId = "usr_me",
  currentUsername = "you",
  currentUserAvatar = null,
  onSendDMToUser,
}: NotesShelfProps) {
  const [notes, setNotes] = useState<DMNote[]>(() => getSavedNotes());
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<DMNote | null>(null);
  const [replyText, setReplyText] = useState("");

  // Compose form state
  const [noteText, setNoteText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("💭");
  const [audience, setAudience] = useState<"followers" | "close_friends">("followers");
  const [musicSnippet, setMusicSnippet] = useState<string | null>(null);

  const myNote = notes.find((n) => n.userId === currentUserId);
  const peerNotes = notes.filter((n) => n.userId !== currentUserId);

  function handleSaveNote() {
    if (!noteText.trim()) {
      toast.error("Enter a note to share");
      return;
    }
    const newNote: DMNote = {
      id: `note_${Date.now()}`,
      userId: currentUserId,
      username: currentUsername,
      displayName: "You",
      avatarUrl: currentUserAvatar,
      text: noteText.trim(),
      moodEmoji: selectedEmoji,
      audioSnippet: musicSnippet || undefined,
      audience,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };

    const updated = saveUserNote(newNote);
    setNotes(updated);
    setComposeOpen(false);
    setNoteText("");
    toast.success("Note shared! It will be visible for 24 hours.");
  }

  function handleSendReply() {
    if (!replyText.trim() || !activeNote) return;
    if (onSendDMToUser) {
      onSendDMToUser(activeNote.username, replyText.trim());
    } else {
      toast.success(`Replied to @${activeNote.username}: "${replyText.trim()}"`);
    }
    setReplyText("");
    setActiveNote(null);
  }

  return (
    <div className="border-b border-border bg-background py-3">
      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes (24h)
        </h2>
        <span className="text-[11px] text-muted-foreground">{notes.length} active thoughts</span>
      </div>

      <div className="no-scrollbar flex items-start gap-4 overflow-x-auto px-4 pt-1">
        {/* Current User Note / Add Note Slot */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2">
            {myNote ? (
              <button
                type="button"
                onClick={() => {
                  setNoteText(myNote.text);
                  setSelectedEmoji(myNote.moodEmoji || "💭");
                  setComposeOpen(true);
                }}
                className="group relative flex flex-col items-center"
              >
                {/* Speech Bubble */}
                <div className="relative -mt-2 mb-1 max-w-[84px] rounded-xl border border-primary/30 bg-surface px-2 py-1 text-center shadow-sm">
                  <span className="text-[10px] leading-tight line-clamp-2 font-medium text-foreground">
                    {myNote.moodEmoji} {myNote.text}
                  </span>
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-primary/30 bg-surface" />
                </div>
                <ProfileAvatar
                  path={currentUserAvatar}
                  fallback="You"
                  className="h-14 w-14 ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                className="group relative flex flex-col items-center"
              >
                <div className="relative -mt-2 mb-1 max-w-[84px] rounded-xl border border-border/80 bg-surface/80 px-2 py-1 text-center shadow-sm">
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    Share thought...
                  </span>
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface" />
                </div>
                <div className="relative">
                  <ProfileAvatar
                    path={currentUserAvatar}
                    fallback="You"
                    className="h-14 w-14 opacity-90"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Plus className="h-3 w-3 stroke-[3]" />
                  </div>
                </div>
              </button>
            )}
          </div>
          <span className="w-16 truncate text-[11px] font-medium text-foreground">
            {myNote ? "Your note" : "Share a note"}
          </span>
        </div>

        {/* Peers' Notes */}
        {peerNotes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setActiveNote(note)}
            className="group flex flex-col items-center text-center transition-transform active:scale-95"
          >
            {/* Floating Thought Bubble */}
            <div
              className={cn(
                "relative -mt-2 mb-1 max-w-[96px] rounded-xl border px-2 py-1 text-center shadow-sm transition-all group-hover:scale-105",
                note.audience === "close_friends"
                  ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                  : "border-border bg-surface text-foreground",
              )}
            >
              <span className="text-[10px] leading-tight line-clamp-2 font-medium">
                {note.moodEmoji} {note.text}
              </span>
              <div
                className={cn(
                  "absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r",
                  note.audience === "close_friends"
                    ? "border-emerald-500/40 bg-background"
                    : "border-border bg-surface",
                )}
              />
            </div>

            <div className="relative">
              <ProfileAvatar
                path={note.avatarUrl}
                fallback={initialsFor({ display_name: note.displayName, username: note.username })}
                className={cn(
                  "h-14 w-14",
                  note.audience === "close_friends"
                    ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
                    : "ring-1 ring-border",
                )}
              />
              {note.audioSnippet && (
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border text-foreground shadow-sm">
                  <Music className="h-2.5 w-2.5 text-primary" />
                </div>
              )}
            </div>
            <span className="mt-1 w-16 truncate text-[11px] text-muted-foreground group-hover:text-foreground">
              {note.username}
            </span>
          </button>
        ))}
      </div>

      {/* Compose Note Dialog */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Share a Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground pb-3">
              Notes appear at the top of inbox for 24 hours. Friends can see it and reply.
            </p>

            {/* Note Bubble Preview */}
            <div className="relative my-2 rounded-2xl border border-primary/30 bg-surface p-3 text-center shadow-inner">
              <span className="text-sm font-medium text-foreground">
                {selectedEmoji} {noteText || "What's on your mind? (max 60 chars)"}
              </span>
              {musicSnippet && (
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-primary">
                  <Music className="h-3 w-3" />
                  <span>{musicSnippet}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="relative">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value.slice(0, 60))}
                  placeholder="Share what you're doing or listening to..."
                  className="rounded-xl pr-12 text-sm"
                  maxLength={60}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                  {60 - noteText.length}
                </span>
              </div>

              {/* Mood Emojis */}
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Choose Mood Emoji
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {MOOD_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all",
                        selectedEmoji === emoji
                          ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                          : "bg-surface hover:bg-secondary",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Music Tag */}
              <div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Attach Song Snippet
                </span>
                <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {CURATED_AUDIO_TRACKS.slice(0, 3).map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() =>
                        setMusicSnippet(musicSnippet === track.title ? null : track.title)
                      }
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition-colors",
                        musicSnippet === track.title
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-surface text-muted-foreground hover:bg-secondary",
                      )}
                    >
                      <Music className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{track.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience Choice */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAudience("followers")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors",
                    audience === "followers"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  Followers
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("close_friends")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-colors",
                    audience === "close_friends"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-border bg-surface text-muted-foreground",
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Close Friends
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setComposeOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex-1 rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View & Reply to Peer Note Sheet */}
      {activeNote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95">
            <div className="flex items-start justify-between pb-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  path={activeNote.avatarUrl}
                  fallback={initialsFor({
                    display_name: activeNote.displayName,
                    username: activeNote.username,
                  })}
                  className="h-12 w-12"
                />
                <div>
                  <h3 className="text-sm font-semibold">{activeNote.displayName}</h3>
                  <p className="text-xs text-muted-foreground">@{activeNote.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNote(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Note Content */}
            <div className="my-3 rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-base font-semibold text-foreground">
                {activeNote.moodEmoji} &ldquo;{activeNote.text}&rdquo;
              </p>
              {activeNote.audioSnippet && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
                  <Music className="h-3.5 w-3.5 animate-pulse" />
                  <span>{activeNote.audioSnippet}</span>
                </div>
              )}
            </div>

            {/* Quick Reply Bar */}
            <div className="mt-4 flex gap-2">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to @${activeNote.username}...`}
                className="rounded-xl text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendReply();
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="h-10 w-10 shrink-0 rounded-xl brand-gradient-bg text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
