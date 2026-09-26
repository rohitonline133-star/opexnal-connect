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
  ChevronLeft,
  ChevronRight,
  Sliders,
  Crop,
  RotateCw,
  Music,
  Users,
  Calendar,
  EyeOff,
  MessageSquareOff,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { createPost, extractHashtags, type NewPostMedia, type PostVisibility } from "@/lib/posts";
import { runAiCreatorTool } from "@/lib/ai-client";

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
  component: CreateFlow,
});

type CreateStep = "media" | "edit" | "filter" | "details";

const FILTERS = [
  { name: "Normal", filter: "none" },
  { name: "Clarendon", filter: "contrast(1.2) saturate(1.25)" },
  { name: "Juno", filter: "contrast(1.15) saturate(1.3) hue-rotate(-5deg)" },
  { name: "Ludwig", filter: "contrast(1.1) brightness(1.05)" },
  { name: "Valencia", filter: "sepia(0.25) contrast(1.1) brightness(1.05)" },
  { name: "Noir", filter: "grayscale(1) contrast(1.3)" },
];

const SAMPLE_MUSIC = [
  "None",
  "Trending: Chill Beats — Opexnal Audio",
  "Aesthetic Vibes — Lo-Fi Dreams",
  "Upbeat Creator Rhythm — Synthwave",
];

type Draft = NewPostMedia & { id: string; previewUrl: string };

function CreateFlow() {
  const navigate = useNavigate();
  const { user } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

  // Stepped Flow State
  const [step, setStep] = useState<CreateStep>("media");

  // Media state
  const [items, setItems] = useState<Draft[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Edit & Adjustment state
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "16:9">("1:1");
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Filter & Music state
  const [activeFilter, setActiveFilter] = useState("Normal");
  const [selectedMusic, setSelectedMusic] = useState("None");

  // Details & Publishing state
  const [caption, setCaption] = useState("");
  const [taggedPeople, setTaggedPeople] = useState("");
  const [locationName, setLocationName] = useState("");
  const [collaboration, setCollaboration] = useState("");
  const [hideLikes, setHideLikes] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [scheduledTime, setScheduledTime] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [submitting, setSubmitting] = useState(false);

  // AI Assistant in creation
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Aesthetic & Engaging");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
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
  }, []);

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: Draft[] = [];
    for (const file of Array.from(files)) {
      if (items.length + next.length >= 10) {
        toast.error("You can attach up to 10 files.");
        break;
      }
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error(`${file.name} is not a supported photo or video.`);
        continue;
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        mediaType: isVideo ? "video" : "image",
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (next.length > 0) {
      setItems((prev) => [...prev, ...next]);
      setSelectedIndex(0);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    if (selectedIndex >= items.length - 1) {
      setSelectedIndex(Math.max(0, items.length - 2));
    }
  }

  const handleNextStep = () => {
    if (step === "media") {
      if (items.length === 0) {
        toast.error("Please select at least one photo or video to continue");
        return;
      }
      setStep("edit");
    } else if (step === "edit") {
      setStep("filter");
    } else if (step === "filter") {
      setStep("details");
    }
  };

  const handlePrevStep = () => {
    if (step === "details") setStep("filter");
    else if (step === "filter") setStep("edit");
    else if (step === "edit") setStep("media");
    else navigate({ to: "/home" });
  };

  async function handleAiMagic() {
    if (!aiPrompt.trim()) {
      toast.error("Enter a few keywords about your photo for the AI");
      return;
    }
    setAiGenerating(true);
    try {
      const res = await runAiCreatorTool({
        tool: "caption",
        topic: aiPrompt.trim(),
        tone: aiTone,
      });
      if (res) {
        setCaption(res);
        setShowAiHelper(false);
        setAiPrompt("");
        toast.success("AI generated your caption & hashtags! ✨");
      }
    } catch {
      toast.error("AI Assistant is currently offline. You can write your own caption.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function onPublish() {
    if (items.length === 0 || !user) return;
    setSubmitting(true);
    try {
      await createPost({
        userId: user.id,
        caption: caption.trim(),
        locationName: locationName.trim() || null,
        visibility,
        commentsEnabled,
        media: items,
      });
      toast.success(
        scheduledTime ? `Post scheduled for ${scheduledTime}!` : "Published to your profile!",
      );
      navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish your post");
    } finally {
      setSubmitting(false);
    }
  }

  const currentFilterStyle = FILTERS.find((f) => f.name === activeFilter)?.filter || "none";

  const imageTransformStyle = {
    filter: `${currentFilterStyle} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    transform: `rotate(${rotation}deg)`,
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title={
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={cn(step === "media" && "text-primary font-bold")}>Media</span>
              <span>›</span>
              <span className={cn(step === "edit" && "text-primary font-bold")}>Edit</span>
              <span>›</span>
              <span className={cn(step === "filter" && "text-primary font-bold")}>Filter</span>
              <span>›</span>
              <span className={cn(step === "details" && "text-primary font-bold")}>Details</span>
            </div>
          }
          left={
            <button
              type="button"
              onClick={handlePrevStep}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          }
          right={
            step === "details" ? (
              <Button
                size="sm"
                onClick={onPublish}
                disabled={submitting}
                className="brand-gradient-bg text-white font-bold rounded-xl text-xs h-8 px-3"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Share"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="surface"
                onClick={handleNextStep}
                disabled={items.length === 0}
                className="rounded-xl text-xs h-8 px-3 text-primary font-semibold"
              >
                Next
              </Button>
            )
          }
        />
      }
    >
      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* ============================================================== */}
        {/* STEP 1: MEDIA SELECTION */}
        {/* ============================================================== */}
        {step === "media" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 bg-card border border-border rounded-3xl text-center space-y-3 shadow-xs">
              <div className="h-12 w-12 rounded-2xl brand-gradient-bg flex items-center justify-center text-white mx-auto shadow-md">
                <ImagePlus className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Select Photos or Videos</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Attach up to 10 high-resolution photos or vertical videos to share in a carousel.
              </p>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
                id="create-file-input"
              />
              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="brand-gradient-bg text-white font-semibold rounded-xl text-xs h-10 px-4"
              >
                Open Camera / Gallery
              </Button>
            </div>

            {/* Selected Thumbnails Carousel Preview */}
            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground px-1">
                  Selected Media ({items.length}/10)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={cn(
                        "relative aspect-square rounded-2xl overflow-hidden border-2 bg-zinc-900 shadow-xs cursor-pointer",
                        selectedIndex === idx ? "border-primary" : "border-border",
                      )}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      {item.mediaType === "image" ? (
                        <img
                          src={item.previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video src={item.previewUrl} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: EDIT & ADJUST */}
        {/* ============================================================== */}
        {step === "edit" && items[selectedIndex] && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Live Cropped/Transformed Image Frame */}
            <div
              className={cn(
                "w-full bg-black rounded-3xl overflow-hidden flex items-center justify-center border border-border shadow-lg transition-all",
                aspectRatio === "1:1"
                  ? "aspect-square"
                  : aspectRatio === "4:5"
                    ? "aspect-4/5"
                    : "aspect-video",
              )}
            >
              <img
                src={items[selectedIndex].previewUrl}
                alt="Selected"
                style={imageTransformStyle}
                className="w-full h-full object-cover transition-transform duration-200"
              />
            </div>

            {/* Adjustments Controls */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-4 shadow-xs">
              {/* Aspect Ratio & Rotate */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(["1:1", "4:5", "16:9"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-xl font-semibold border transition-all",
                        aspectRatio === ratio
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-surface text-muted-foreground",
                      )}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="surface"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="rounded-xl text-xs h-8 gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Rotate</span>
                </Button>
              </div>

              {/* Sliders: Brightness, Contrast, Saturation */}
              <div className="space-y-3 pt-2 border-t border-border text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brightness</span>
                    <span className="font-semibold">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contrast</span>
                    <span className="font-semibold">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturation</span>
                    <span className="font-semibold">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: FILTERS & MUSIC */}
        {/* ============================================================== */}
        {step === "filter" && items[selectedIndex] && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="aspect-square w-full bg-black rounded-3xl overflow-hidden border border-border shadow-lg flex items-center justify-center">
              <img
                src={items[selectedIndex].previewUrl}
                alt="Filter preview"
                style={imageTransformStyle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Filter Swatches Carousel */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <p className="text-xs font-bold text-foreground">Select Filter</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {FILTERS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setActiveFilter(f.name)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                      activeFilter === f.name
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              {/* Music Selection */}
              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Add Music Audio</span>
                </div>
                <select
                  value={selectedMusic}
                  onChange={(e) => setSelectedMusic(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border text-xs text-foreground focus:outline-none"
                >
                  {SAMPLE_MUSIC.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: DETAILS, CAPTION & PUBLISH */}
        {/* ============================================================== */}
        {step === "details" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Caption & AI Magic */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Write a caption</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="surface"
                  onClick={() => setShowAiHelper(!showAiHelper)}
                  className="h-7 px-2.5 rounded-lg text-[11px] gap-1 text-primary border-primary/30"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Assistant</span>
                </Button>
              </div>

              {showAiHelper && (
                <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-2xl space-y-2">
                  <p className="text-[11px] font-semibold text-purple-300">
                    Opexnal AI Magic Captions
                  </p>
                  <Input
                    placeholder="Describe your photo (e.g. coffee in the rain, tech desk)..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="h-8 text-xs bg-surface border-border rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={aiGenerating}
                    onClick={handleAiMagic}
                    className="w-full h-8 brand-gradient-bg text-white text-xs rounded-lg font-semibold"
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Generate Viral Caption & Tags"
                    )}
                  </Button>
                </div>
              )}

              <Textarea
                rows={4}
                placeholder="Write a caption, #hashtags, @mentions..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="rounded-2xl bg-surface border-border text-xs"
              />
            </div>

            {/* Tag People, Location, Collaboration */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs text-xs">
              <div>
                <Label className="font-semibold block mb-1">Tag People</Label>
                <Input
                  placeholder="@username1, @username2"
                  value={taggedPeople}
                  onChange={(e) => setTaggedPeople(e.target.value)}
                  className="h-9 rounded-xl bg-surface border-border text-xs"
                />
              </div>

              <div>
                <Label className="font-semibold block mb-1">Add Location</Label>
                <Input
                  placeholder="e.g. Mumbai, New York, Shibuya..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="h-9 rounded-xl bg-surface border-border text-xs"
                />
              </div>

              <div>
                <Label className="font-semibold block mb-1">Invite Collaborator</Label>
                <Input
                  placeholder="Enter @username to co-author post"
                  value={collaboration}
                  onChange={(e) => setCollaboration(e.target.value)}
                  className="h-9 rounded-xl bg-surface border-border text-xs"
                />
              </div>
            </div>

            {/* Advanced Settings: Hide Likes, Comments, Schedule */}
            <div className="p-4 bg-card border border-border rounded-3xl space-y-3 shadow-xs text-xs">
              <p className="font-bold text-foreground">Advanced Settings</p>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Hide like and view counts</span>
                <Switch checked={hideLikes} onCheckedChange={setHideLikes} />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Allow comments on this post</span>
                <Switch checked={commentsEnabled} onCheckedChange={setCommentsEnabled} />
              </div>

              <div className="pt-2 border-t border-border space-y-1">
                <span className="font-semibold block">Schedule Post</span>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-9 rounded-xl bg-surface border-border text-xs"
                />
              </div>
            </div>

            {/* Big Publish Button */}
            <Button
              onClick={onPublish}
              disabled={submitting}
              className="w-full h-12 brand-gradient-bg text-white font-bold rounded-2xl shadow-lg text-sm"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing to Feed...</span>
                </div>
              ) : scheduledTime ? (
                "Schedule Post"
              ) : (
                "Share Post Now"
              )}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
