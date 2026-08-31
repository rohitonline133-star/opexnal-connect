import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, MapPin, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { createPost, extractHashtags, type NewPostMedia, type PostVisibility } from "@/lib/posts";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Create a post — Opexnal" },
      {
        name: "description",
        content: "Share a photo or video with a caption, hashtags and location on Opexnal.",
      },
      { property: "og:title", content: "Create a post — Opexnal" },
      {
        property: "og:description",
        content: "Share a photo or video with a caption, hashtags and location on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Create,
});

const MAX_FILES = 10;
const MAX_IMAGE_MB = 15;
const MAX_VIDEO_MB = 200;

type Draft = NewPostMedia & { id: string; previewUrl: string };

function readDimensions(item: Draft) {
  return new Promise<{ width: number | null; height: number | null }>((resolve) => {
    if (item.mediaType === "image") {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: null, height: null });
      img.src = item.previewUrl;
    } else {
      const video = document.createElement("video");
      video.onloadedmetadata = () =>
        resolve({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => resolve({ width: null, height: null });
      video.src = item.previewUrl;
    }
  });
}

function Create() {
  const navigate = useNavigate();
  const { user } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Draft[]>([]);
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hashtags = useMemo(() => extractHashtags(caption), [caption]);
  const canPost = items.length > 0 && !submitting && Boolean(user);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: Draft[] = [];
    for (const file of Array.from(files)) {
      if (items.length + next.length >= MAX_FILES) {
        toast.error(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error(`${file.name} isn't a photo or video.`);
        continue;
      }
      const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      if (file.size > limit * 1024 * 1024) {
        toast.error(`${file.name} is larger than ${limit}MB.`);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        mediaType: isVideo ? "video" : "image",
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (next.length > 0) setItems((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleSubmit() {
    if (!user || items.length === 0) return;
    setSubmitting(true);
    try {
      const media: NewPostMedia[] = [];
      for (const item of items) {
        const dims = await readDimensions(item);
        media.push({ file: item.file, mediaType: item.mediaType, ...dims });
      }
      await createPost({
        userId: user.id,
        caption,
        visibility,
        locationName,
        commentsEnabled,
        media,
      });
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      setItems([]);
      setCaption("");
      setLocationName("");
      toast.success("Post shared");
      navigate({ to: "/home" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not share your post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      header={
        <ScreenHeader
          title="New post"
          right={
            <Button size="sm" variant="brand" disabled={!canPost} onClick={handleSubmit}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                "Share"
              )}
            </Button>
          }
        />
      }
    >
      <div className="space-y-6 p-4">
        <section className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />

          {items.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ImagePlus className="h-7 w-7" aria-hidden="true" />
              <span className="text-sm font-medium">Add photos or videos</span>
              <span className="text-xs">Up to {MAX_FILES} files</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-xl bg-secondary"
                >
                  {item.mediaType === "video" ? (
                    <video
                      src={item.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt={`Selected media ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    aria-label={`Remove media ${index + 1}`}
                    onClick={() => removeItem(item.id)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground backdrop-blur"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {items.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Add more media"
                  className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground"
                >
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            value={caption}
            maxLength={2200}
            rows={4}
            placeholder="Write a caption… use #hashtags to reach more people"
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <span
              className={cn(
                "shrink-0 text-xs text-muted-foreground",
                caption.length > 2100 && "text-destructive",
              )}
            >
              {caption.length}/2200
            </span>
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="location"
              value={locationName}
              maxLength={120}
              placeholder="Add a place"
              className="pl-9"
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-2">
          <Label htmlFor="visibility">Who can see this</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Everyone</SelectItem>
              <SelectItem value="followers">Followers only</SelectItem>
              <SelectItem value="private">Only me</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-medium">Allow comments</p>
            <p className="text-xs text-muted-foreground">
              Turn off to disable replies on this post.
            </p>
          </div>
          <Switch
            checked={commentsEnabled}
            onCheckedChange={setCommentsEnabled}
            aria-label="Allow comments"
          />
        </section>
      </div>
    </AppShell>
  );
}
