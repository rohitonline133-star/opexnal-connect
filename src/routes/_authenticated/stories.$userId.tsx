import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BellOff, Bell, ChevronLeft, Eye, Flag, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ProfileAvatar } from "@/components/opexnal/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { initialsFor } from "@/lib/profile";
import { timeAgo } from "@/lib/posts";
import {
  deleteStory,
  getStoryViewers,
  getUserStories,
  isStoryMuted,
  recordStoryView,
  reportContent,
  resolveStoryMediaUrl,
  setStoryMuted,
  STORY_IMAGE_DURATION_MS,
  timeLeft,
} from "@/lib/stories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/stories/$userId")({
  head: () => ({
    meta: [
      { title: "Stories — Opexnal" },
      {
        name: "description",
        content: "Watch 24-hour photo and video stories from people you follow on Opexnal.",
      },
      { property: "og:title", content: "Stories — Opexnal" },
      {
        property: "og:description",
        content: "Watch 24-hour photo and video stories from people you follow on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StoryViewer,
});

function StoryViewer() {
  const { userId } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const storiesQuery = useQuery({
    queryKey: ["stories", userId, user?.id],
    queryFn: () => getUserStories(userId, user!.id),
    enabled: Boolean(user?.id),
  });

  const stories = useMemo(() => storiesQuery.data ?? [], [storiesQuery.data]);
  const current = stories[Math.min(index, stories.length - 1)];
  const isOwner = user?.id === userId;

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const currentStoragePath = current?.storage_path;
  useEffect(() => {
    let active = true;
    setMediaUrl(null);
    if (!currentStoragePath) return;
    resolveStoryMediaUrl(currentStoragePath)
      .then((url) => active && setMediaUrl(url))
      .catch(() => active && setMediaUrl(null));
    return () => {
      active = false;
    };
  }, [currentStoragePath]);

  // Mark seen
  const currentStoryId = current?.id;
  const currentUserId = user?.id;
  useEffect(() => {
    if (!currentStoryId || !currentUserId || isOwner) return;
    recordStoryView(currentStoryId, currentUserId).catch(() => undefined);
  }, [currentStoryId, currentUserId, isOwner]);

  function next() {
    setProgress(0);
    if (index + 1 < stories.length) setIndex(index + 1);
    else navigate({ to: "/home" });
  }

  const nextRef = useRef(next);
  nextRef.current = next;

  function prev() {
    setProgress(0);
    if (index > 0) setIndex(index - 1);
  }

  // Progress timer for images (videos advance on ended)
  useEffect(() => {
    if (!currentStoryId || paused || current?.media_type === "video" || !mediaUrl) return;
    const step = 50;
    const timer = window.setInterval(() => {
      setProgress((p) => {
        const nextValue = p + (step / STORY_IMAGE_DURATION_MS) * 100;
        if (nextValue >= 100) {
          window.clearInterval(timer);
          nextRef.current();
          return 100;
        }
        return nextValue;
      });
    }, step);
    return () => window.clearInterval(timer);
  }, [currentStoryId, current?.media_type, paused, mediaUrl]);

  const mutedQuery = useQuery({
    queryKey: ["story-muted", user?.id, userId],
    queryFn: () => isStoryMuted(user!.id, userId),
    enabled: Boolean(user?.id) && !isOwner,
  });

  const muteMutation = useMutation({
    mutationFn: (muted: boolean) => setStoryMuted(user!.id, userId, muted),
    onSuccess: (_r, muted) => {
      toast.success(muted ? "Stories muted" : "Stories unmuted");
      queryClient.invalidateQueries({ queryKey: ["story-muted", user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ["story-tray"] });
    },
    onError: () => toast.error("Could not update mute setting"),
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      reportContent({
        reporterId: user!.id,
        targetType: "story",
        targetId: current!.id,
        reason: "inappropriate",
      }),
    onSuccess: () => toast.success("Report sent — thanks for keeping Opexnal safe"),
    onError: () => toast.error("Could not send the report"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStory(current!),
    onSuccess: async () => {
      toast.success("Story deleted");
      await queryClient.invalidateQueries({ queryKey: ["story-tray"] });
      await queryClient.invalidateQueries({ queryKey: ["stories", userId] });
      navigate({ to: "/home" });
    },
    onError: () => toast.error("Could not delete the story"),
  });

  const viewersQuery = useQuery({
    queryKey: ["story-viewers", current?.id],
    queryFn: () => getStoryViewers(current!.id),
    enabled: Boolean(current?.id) && isOwner && showViewers,
  });

  if (storiesQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-5 w-5 animate-spin text-white/70" aria-hidden="true" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-8 text-center">
        <p className="text-sm text-white/70">No active stories here.</p>
        <Button variant="surface" onClick={() => navigate({ to: "/home" })}>
          Back to feed
        </Button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-black">
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
        {stories.map((story, i) => (
          <div key={story.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-[width] duration-75"
              style={{ width: `${i < index ? 100 : i === index ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>

      <header className="absolute inset-x-0 top-5 z-20 flex items-center gap-3 px-3 pt-3">
        <button
          type="button"
          aria-label="Close stories"
          onClick={() => navigate({ to: "/home" })}
          className="text-white/80"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <ProfileAvatar
          path={current.author?.avatar_url ?? null}
          fallback={current.author ? initialsFor(current.author) : "?"}
          className="h-8 w-8"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {current.author?.username ?? "user"}
          </p>
          <p className="text-xs text-white/60">
            {timeAgo(current.created_at)} · {timeLeft(current.expires_at)}
          </p>
        </div>

        {isOwner ? (
          <button
            type="button"
            aria-label="Delete story"
            onClick={() => deleteMutation.mutate()}
            className="text-white/80 hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <>
            <button
              type="button"
              aria-label={mutedQuery.data ? "Unmute stories" : "Mute stories"}
              onClick={() => muteMutation.mutate(!mutedQuery.data)}
              className="text-white/80"
            >
              {mutedQuery.data ? (
                <Bell className="h-5 w-5" aria-hidden="true" />
              ) : (
                <BellOff className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              aria-label="Report story"
              onClick={() => reportMutation.mutate()}
              className="text-white/80"
            >
              <Flag className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </header>

      <div className="relative flex-1">
        {mediaUrl ? (
          current.media_type === "video" ? (
            <video
              key={current.id}
              src={mediaUrl}
              className="h-full max-h-screen w-full object-contain"
              autoPlay
              playsInline
              controls={false}
              onEnded={next}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (el.duration) setProgress((el.currentTime / el.duration) * 100);
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={current.caption || "Story"}
              className="h-full max-h-screen w-full object-contain"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white/70" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          aria-label="Previous story"
          className="absolute inset-y-0 left-0 w-1/3"
          onClick={prev}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
        />
        <button
          type="button"
          aria-label="Next story"
          className="absolute inset-y-0 right-0 w-2/3"
          onClick={next}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
        />
      </div>

      {current.caption && (
        <p className="pointer-events-none absolute inset-x-0 bottom-20 z-10 px-6 text-center text-sm text-white drop-shadow">
          {current.caption}
        </p>
      )}

      {isOwner && (
        <div className="relative z-20 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowViewers((v) => !v)}
            className="flex items-center gap-2 text-sm text-white/80"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            {current.views_count} {current.views_count === 1 ? "view" : "views"}
          </button>

          {showViewers && (
            <ul className={cn("mt-3 max-h-48 space-y-3 overflow-y-auto")}>
              {(viewersQuery.data ?? []).map((entry) => (
                <li key={entry.viewer.id} className="flex items-center gap-3">
                  <ProfileAvatar
                    path={entry.viewer.avatar_url}
                    fallback={initialsFor(entry.viewer)}
                    className="h-8 w-8"
                  />
                  <span className="text-sm text-white">{entry.viewer.username}</span>
                  <span className="ml-auto text-xs text-white/50">{timeAgo(entry.created_at)}</span>
                </li>
              ))}
              {(viewersQuery.data ?? []).length === 0 && !viewersQuery.isLoading && (
                <li className="text-sm text-white/60">No views yet.</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
