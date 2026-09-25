import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ImagePlus,
  MapPin,
  X,
  Loader2,
  Sparkles,
  RefreshCw,
  Wand2,
  Check,
  Music,
  Clapperboard,
  Layers,
  Palette,
  Users2,
  Sliders,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { MusicPickerDialog } from "@/components/opexnal/music-picker-dialog";
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
import { runAiCreatorTool } from "@/lib/ai-client";
import { validateMediaFile } from "@/lib/security";
import { AudioTrack } from "@/lib/interactive-features";

export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Create Content — Opexnal" },
      {
        name: "description",
        content: "Share photos, carousels, 90s reels, stories and music on Opexnal.",
      },
      { property: "og:title", content: "Create Content — Opexnal" },
      {
        property: "og:description",
        content: "Share photos, carousels, 90s reels, stories and music on Opexnal.",
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

const PHOTO_FILTERS = [
  { id: "normal", label: "Normal", filterClass: "" },
  { id: "vivid", label: "Vivid", filterClass: "contrast-125 saturate-125" },
  { id: "warm", label: "Warm Sun", filterClass: "sepia-[0.25] saturate-110" },
  { id: "mono", label: "Moody Mono", filterClass: "grayscale contrast-110" },
  { id: "cyber", label: "Cyber Neon", filterClass: "hue-rotate-30 saturate-150" },
  { id: "vintage", label: "Vintage Film", filterClass: "sepia-[0.4] brightness-95" },
];

const TRENDING_SUGGESTIONS = [
  "Opexnal",
  "CreatorLife",
  "Aesthetics",
  "DesignInspo",
  "TechVibes",
  "DailyGram",
  "VisualArt",
  "BuildInPublic",
];

const POPULAR_CITIES = [
  "Mumbai, India",
  "Bengaluru, India",
  "Delhi, India",
  "New York, USA",
  "London, UK",
  "Tokyo, Japan",
  "Dubai, UAE",
  "San Francisco, USA",
];

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
  const [format, setFormat] = useState<"post" | "reel" | "story">("post");
  const [items, setItems] = useState<Draft[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const [collaborator, setCollaborator] = useState("");
  const [isCloseFriends, setIsCloseFriends] = useState(false);

  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // AI Assistant in creation
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Aesthetic & Engaging");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    // Check if user came from Opexnal AI with a drafted caption
    try {
      const draft = sessionStorage.getItem("opexnal_draft_caption");
      if (draft) {
        setCaption(draft);
        sessionStorage.removeItem("opexnal_draft_caption");
      }
    } catch {
      // ignore
    }

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
      const val = validateMediaFile(file, isVideo ? "video" : "image");
      if (!val.valid) {
        toast.error(val.error || `${file.name} is invalid.`);
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

  function insertHashtag(tag: string) {
    const formatted = `#${tag} `;
    if (!caption.includes(`#${tag}`)) {
      setCaption((prev) => (prev ? `${prev.trimEnd()} ${formatted}` : formatted));
    }
  }

  async function handleGenerateAiCaption() {
    const prompt = aiPrompt.trim() || caption.trim() || "A captivating social media moment";
    setAiGenerating(true);
    try {
      const result = await runAiCreatorTool({
        tool: "caption",
        topic: prompt,
        tone: aiTone,
      });

      // Extract a clean caption or set the full result
      setCaption(result);
      setShowAiHelper(false);
      toast.success("AI Caption generated!");
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to generate AI caption");
    } finally {
      setAiGenerating(false);
    }
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

      let finalCaption = caption.trim();
      if (collaborator.trim()) {
        const cleanCollab = collaborator.trim().replace(/^@/, "");
        finalCaption += `\n\n🤝 With @${cleanCollab}`;
      }
      if (selectedTrack) {
        finalCaption += `\n🎵 ${selectedTrack.title} — ${selectedTrack.artist}`;
      }
      if (format === "reel") {
        if (!finalCaption.toLowerCase().includes("#reel")) {
          finalCaption += " #reel #reels";
        }
      } else if (format === "story") {
        if (!finalCaption.toLowerCase().includes("#story")) {
          finalCaption += " #story";
        }
      }

      await createPost({
        userId: user.id,
        caption: finalCaption,
        visibility,
        locationName,
        commentsEnabled,
        media,
      });
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      setItems([]);
      setCaption("");
      setLocationName("");
      setSelectedTrack(null);
      setCollaborator("");
      toast.success(
        format === "reel"
          ? "Reel published!"
          : format === "story"
            ? "Story shared for 24h!"
            : "Post shared to Opexnal!",
      );
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
          title={
            format === "reel"
              ? "New Reel (90s)"
              : format === "story"
                ? "New Story (24h)"
                : "New Post"
          }
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
      <div className="space-y-5 p-4 max-w-lg mx-auto">
        {/* Content Format Selector */}
        <div className="flex rounded-2xl border border-border bg-surface p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFormat("post")}
            className={cn(
              "flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5",
              format === "post"
                ? "brand-gradient-bg text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Post / Carousel</span>
          </button>
          <button
            type="button"
            onClick={() => setFormat("reel")}
            className={cn(
              "flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5",
              format === "reel"
                ? "brand-gradient-bg text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Clapperboard className="h-3.5 w-3.5" />
            <span>Reel (90s)</span>
          </button>
          <button
            type="button"
            onClick={() => setFormat("story")}
            className={cn(
              "flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5",
              format === "story"
                ? "brand-gradient-bg text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>24h Story</span>
          </button>
        </div>

        {/* Media Selector */}
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
              className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient-bg text-primary-foreground shadow-sm">
                <ImagePlus className="h-6 w-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {format === "reel" ? "Select Vertical Video" : "Select Photos or Videos"}
              </span>
              <span className="text-xs text-muted-foreground">
                {format === "reel"
                  ? "Upload up to 90 seconds"
                  : `Attach up to ${MAX_FILES} carousel items`}
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {items.map((item, index) => {
                  const filterObj = PHOTO_FILTERS.find((f) => f.id === selectedFilter);
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden rounded-xl bg-secondary border border-border"
                    >
                      {item.mediaType === "video" ? (
                        <video
                          src={item.previewUrl}
                          className={cn("h-full w-full object-cover", filterObj?.filterClass)}
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.previewUrl}
                          alt={`Selected media ${index + 1}`}
                          className={cn("h-full w-full object-cover", filterObj?.filterClass)}
                        />
                      )}
                      <button
                        type="button"
                        aria-label={`Remove media ${index + 1}`}
                        onClick={() => removeItem(item.id)}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        {index + 1}
                      </span>
                    </div>
                  );
                })}
                {items.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    aria-label="Add more media"
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px]">Add more</span>
                  </button>
                )}
              </div>

              {/* Photo & Reel Visual Filter Pills */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  <span>Color & AR Filter</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {PHOTO_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFilter(f.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all border",
                        selectedFilter === f.id
                          ? "brand-gradient-bg text-primary-foreground border-primary"
                          : "bg-surface border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Music / Audio Track Selection */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-primary" />
              <span>Audio Sound Track</span>
            </Label>
            {selectedTrack && (
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                className="text-[11px] text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            )}
          </div>

          {selectedTrack ? (
            <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedTrack.coverUrl}
                  alt={selectedTrack.title}
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-foreground">
                    {selectedTrack.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {selectedTrack.artist} · {selectedTrack.duration}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMusicPickerOpen(true)}
                className="rounded-xl text-xs h-8 px-2.5"
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setMusicPickerOpen(true)}
              className="w-full rounded-2xl border-dashed h-11 text-xs font-semibold justify-start text-muted-foreground hover:text-foreground"
            >
              <Music className="mr-2 h-4 w-4 text-primary" />
              Add trending sound, music or voiceover...
            </Button>
          )}
        </section>

        {/* Collaborator / Co-Author Section */}
        <section className="space-y-2">
          <Label htmlFor="collab" className="text-xs font-semibold flex items-center gap-1.5">
            <Users2 className="h-3.5 w-3.5 text-primary" />
            <span>Invite Collaborator (Collab Post)</span>
          </Label>
          <Input
            id="collab"
            value={collaborator}
            onChange={(e) => setCollaborator(e.target.value)}
            placeholder="@username to share co-authorship"
            className="h-10 rounded-xl bg-surface text-xs"
          />
        </section>

        {/* Caption & AI Assistant */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="caption" className="text-xs font-semibold">
              Caption
            </Label>
            <button
              type="button"
              onClick={() => setShowAiHelper(!showAiHelper)}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {showAiHelper ? "Hide AI Helper" : "AI Magic Caption"}
            </button>
          </div>

          {/* Inline AI Helper Panel */}
          {showAiHelper && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Wand2 className="h-4 w-4 text-primary" />
                <span>Opexnal AI Caption Generator</span>
              </div>
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="What's happening in this photo or video? (e.g. coffee break in rain)"
                className="h-9 text-xs bg-background"
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                >
                  <option>Aesthetic & Engaging</option>
                  <option>Viral & Punchy</option>
                  <option>Hinglish / Trendy</option>
                  <option>Storytelling</option>
                </select>
                <Button
                  size="sm"
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleGenerateAiCaption}
                  className="h-8 text-xs brand-gradient-bg text-primary-foreground font-semibold"
                >
                  {aiGenerating ? (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate Caption
                </Button>
              </div>
            </div>
          )}

          <Textarea
            id="caption"
            value={caption}
            maxLength={2200}
            rows={4}
            placeholder="Write a caption… use #hashtags and @mentions to connect"
            className="rounded-xl bg-surface resize-none text-xs sm:text-sm"
            onChange={(e) => setCaption(e.target.value)}
          />

          {/* Quick Trending Hashtags */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Trending Tags (tap to add):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SUGGESTIONS.map((tag) => {
                const added = hashtags.includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertHashtag(tag)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border",
                      added
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
                    )}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              {hashtags.length} hashtag{hashtags.length === 1 ? "" : "s"} added
            </span>
            <span className={cn(caption.length > 2100 && "text-destructive font-semibold")}>
              {caption.length}/2200
            </span>
          </div>
        </section>

        {/* Location Section with Quick City Suggestions */}
        <section className="space-y-2">
          <Label htmlFor="location" className="text-xs font-semibold">
            Location
          </Label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="location"
              value={locationName}
              maxLength={120}
              placeholder="Search or add a location"
              className="h-10 pl-9 rounded-xl bg-surface text-xs sm:text-sm"
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setLocationName(city)}
                className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                {city}
              </button>
            ))}
          </div>
        </section>

        {/* Audience Visibility */}
        <section className="space-y-2">
          <Label htmlFor="visibility" className="text-xs font-semibold">
            Audience & Visibility
          </Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
            <SelectTrigger id="visibility" className="h-10 rounded-xl bg-surface">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">🌐 Everyone (Public on Feed & Explore)</SelectItem>
              <SelectItem value="followers">👥 Followers Only</SelectItem>
              <SelectItem value="followers">💚 Close Friends Only</SelectItem>
              <SelectItem value="private">🔒 Private (Only Me)</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Allow Comments Switch */}
        <section className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5">
          <div>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              Allow comments & replies
            </p>
            <p className="text-[11px] text-muted-foreground">
              Anyone with access to the post can leave thoughts.
            </p>
          </div>
          <Switch
            checked={commentsEnabled}
            onCheckedChange={setCommentsEnabled}
            aria-label="Allow comments"
          />
        </section>
      </div>

      {/* Music / Audio Track Selector Dialog */}
      <MusicPickerDialog
        open={musicPickerOpen}
        onOpenChange={setMusicPickerOpen}
        onSelectTrack={(track) => setSelectedTrack(track)}
      />
    </AppShell>
  );
}
