import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { createStory, type StoryAudience } from "@/lib/stories";
import { cn } from "@/lib/utils";

const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;

const audiences: { value: StoryAudience; label: string; hint: string }[] = [
  { value: "public", label: "Everyone", hint: "Anyone who can see your account" },
  { value: "followers", label: "Followers", hint: "Only people who follow you" },
  { value: "close_friends", label: "Close friends", hint: "Only followers, hidden from others" },
];

export const Route = createFileRoute("/_authenticated/stories/new")({
  head: () => ({
    meta: [
      { title: "Add to your story — Opexnal" },
      {
        name: "description",
        content: "Share a photo or video story on Opexnal for the next 24 hours.",
      },
      { property: "og:title", content: "Add to your story — Opexnal" },
      {
        property: "og:description",
        content: "Share a photo or video story on Opexnal for the next 24 hours.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewStory,
});

function NewStory() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<StoryAudience>("followers");

  const isVideo = file?.type.startsWith("video/") ?? false;

  function pick(next: File | null) {
    if (!next) return;
    const video = next.type.startsWith("video/");
    if (!video && !next.type.startsWith("image/")) {
      toast.error("Choose a photo or video");
      return;
    }
    if (next.size > (video ? MAX_VIDEO : MAX_IMAGE)) {
      toast.error(video ? "Videos must be under 200MB" : "Photos must be under 15MB");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !file) throw new Error("Choose media first");
      return createStory({
        userId: user.id,
        file,
        mediaType: isVideo ? "video" : "image",
        caption,
        audience,
      });
    },
    onSuccess: async () => {
      toast.success("Story shared — it disappears in 24 hours");
      await queryClient.invalidateQueries({ queryKey: ["story-tray"] });
      navigate({ to: "/home" });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not share your story"),
  });

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Your story"
          left={
            <Link
              to="/home"
              aria-label="Back"
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
        />
      }
    >
      <div className="space-y-5 px-4 py-4">
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground"
          >
            <ImagePlus className="h-7 w-7" aria-hidden="true" />
            <span className="text-sm">Tap to choose a photo or video</span>
          </button>
        ) : (
          <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-secondary">
            {isVideo ? (
              <video
                src={previewUrl ?? undefined}
                className="h-full w-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={previewUrl ?? undefined}
                alt="Story preview"
                className="h-full w-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={clear}
              aria-label="Remove media"
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />

        <div className="space-y-2">
          <label htmlFor="story-caption" className="text-sm font-medium">
            Caption
          </label>
          <Input
            id="story-caption"
            value={caption}
            maxLength={200}
            placeholder="Say something…"
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Who can see this</legend>
          <div className="grid gap-2">
            {audiences.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAudience(option.value)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition-colors",
                  audience === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-secondary/60",
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <Button
          variant="brand"
          size="xl"
          disabled={!file || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Sharing…
            </>
          ) : (
            "Share to story"
          )}
        </Button>
      </div>
    </AppShell>
  );
}
