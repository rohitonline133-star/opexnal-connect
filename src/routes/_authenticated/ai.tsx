import { useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  Send,
  Sparkles,
  Wand2,
  Lightbulb,
  Flame,
  RefreshCw,
  Copy,
  Check,
  Image as ImageIcon,
  X,
  Share2,
  Layers,
  MessageSquare,
  Compass,
  FileText,
  Video,
  Hash,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/opexnal/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import {
  sendAiChatMessage,
  runAiCreatorTool,
  type ChatMessage,
  type AiCreatorOptions,
} from "@/lib/ai-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "Opexnal AI — Intelligent Assistant & Creator Studio" },
      {
        name: "description",
        content:
          "Multilingual AI creative assistant, reels generator, smart captions and social strategist on Opexnal.",
      },
      { property: "og:title", content: "Opexnal AI — Intelligent Assistant & Creator Studio" },
      {
        property: "og:description",
        content:
          "Multilingual AI creative assistant, reels generator, smart captions and social strategist on Opexnal.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIPage,
});

const QUICK_PROMPTS = [
  "✨ Generate 3 viral captions for my new photo",
  "🔥 Find high-engagement trending hashtags for tech & design",
  "💡 Give me 3 creative reel hooks & concepts for this week",
  "✍️ Write a modern Hinglish bio for my creator profile",
  "🌟 Tips to increase my story views and engagement organically",
];

const TONES = [
  "Aesthetic & Minimalist",
  "Viral & Energetic",
  "Hinglish / Trendy",
  "Storytelling & Deep",
  "Professional & Crisp",
  "Funny & Witty",
];

const LANGUAGES = ["English", "Hinglish (Hindi + English)", "Hindi (हिन्दी)", "Spanish", "French"];

function AIPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "studio">("chat");

  // Chat State
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mime: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usernameDisplay =
    (user?.user_metadata?.["username"] as string | undefined) || user?.email?.split("@")[0] || "";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Namaste & welcome ${usernameDisplay ? `@${usernameDisplay}` : ""}! I am **Opexnal AI** — your creative co-pilot. 🚀\n\nI can help you craft viral captions, script 15s reels with 3-second hooks, generate hashtag strategies, analyze images, and optimize your creator profile in English, Hindi, or Hinglish.\n\nHow can I help you create today?`,
      timestamp: "Just now",
    },
  ]);

  // Creator Studio State
  const [studioTool, setStudioTool] = useState<AiCreatorOptions["tool"]>("caption");
  const [studioTopic, setStudioTopic] = useState("");
  const [studioTone, setStudioTone] = useState(TONES[0]);
  const [studioLang, setStudioLang] = useState(LANGUAGES[0]);
  const [studioResult, setStudioResult] = useState("");
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioCopied, setStudioCopied] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage({
        base64: reader.result as string,
        mime: file.type,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && !attachedImage) || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text || "Analyze this image",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...(attachedImage?.base64 ? { imagePreview: attachedImage.base64 } : {}),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const currentImg = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    try {
      // Build conversation history for multi-turn chat
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "model") as "user" | "model",
          content: m.text,
        }));

      history.push({
        role: "user",
        content: userMsg.text,
      });

      const reply = await sendAiChatMessage({
        messages: history,
        prompt: userMsg.text,
        ...(currentImg?.base64 ? { imageBase64: currentImg.base64 } : {}),
        ...(currentImg?.mime ? { imageMime: currentImg.mime } : {}),
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to generate AI reply");
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "I ran into a temporary hiccup processing that request. Please try asking again in a moment!",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleUseInPost = (text: string) => {
    // Save draft caption in session and navigate to create post
    try {
      sessionStorage.setItem("opexnal_draft_caption", text);
    } catch {
      // ignore
    }
    toast.success("Caption copied! Redirecting to Create Post...");
    navigate({ to: "/create" });
  };

  const handleRunStudioTool = async () => {
    if (!studioTopic.trim() && studioTool !== "image_analysis") {
      toast.error("Please provide a topic or prompt");
      return;
    }
    setStudioLoading(true);
    setStudioResult("");
    try {
      const result = await runAiCreatorTool({
        tool: studioTool,
        topic: studioTopic.trim(),
        ...(studioTone ? { tone: studioTone } : {}),
        ...(studioLang ? { language: studioLang } : {}),
        contextText: studioTopic.trim(),
      });
      setStudioResult(result);
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to generate studio output");
    } finally {
      setStudioLoading(false);
    }
  };

  return (
    <AppShell
      header={
        <ScreenHeader
          title="Opexnal AI"
          right={
            <div className="flex items-center gap-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="text-[11px] font-medium text-emerald-500">Live</span>
            </div>
          }
        />
      }
    >
      <div className="mx-auto flex flex-col h-[calc(100vh-8.5rem)] max-w-2xl px-3 sm:px-4 py-3">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-secondary/80 p-1 mb-3 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
              activeTab === "chat"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            AI Co-Pilot Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
              activeTab === "studio"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            Creator Studio Tools
          </button>
        </div>

        {activeTab === "chat" ? (
          <>
            {/* Quick Prompts Banner */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "ai" && (
                    <div className="h-7 w-7 rounded-xl brand-gradient-bg text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%]">
                    {m.imagePreview && (
                      <div className="mb-1.5 overflow-hidden rounded-xl border border-border max-w-[200px]">
                        <img
                          src={m.imagePreview}
                          alt="Uploaded attachment"
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-line leading-relaxed",
                        m.sender === "user"
                          ? "brand-gradient-bg text-primary-foreground font-medium rounded-br-sm shadow-sm"
                          : "bg-surface border border-border/80 text-foreground rounded-bl-sm shadow-xs",
                      )}
                    >
                      {m.text}
                    </div>

                    {m.sender === "ai" && (
                      <div className="flex items-center gap-2 mt-1.5 ml-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.text)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copiedId === m.id ? "Copied" : "Copy"}
                        </button>
                        <span className="text-[10px] text-border">•</span>
                        <button
                          type="button"
                          onClick={() => handleUseInPost(m.text)}
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
                        >
                          <Share2 className="h-3 w-3" /> Use in Post
                        </button>
                        <span className="text-[10px] text-muted-foreground/60 ml-auto">
                          {m.timestamp}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground pl-1">
                  <div className="h-7 w-7 rounded-xl brand-gradient-bg text-primary-foreground flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-surface border border-border px-3.5 py-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Opexnal AI is generating creative response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Attached Image Preview */}
            {attachedImage && (
              <div className="relative mb-2 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-foreground">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="truncate max-w-[200px]">Image attached for vision analysis</span>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="rounded-full p-0.5 hover:bg-background/80 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="mt-auto flex items-center gap-2 pt-2 border-t border-border"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo for AI vision"
                className="h-11 w-11 shrink-0 rounded-xl border-border bg-surface text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Opexnal AI in English, हिन्दी, or Hinglish..."
                disabled={loading}
                className="h-11 flex-1 rounded-xl bg-surface px-4 text-sm placeholder:text-muted-foreground/70"
              />

              <Button
                type="submit"
                disabled={(!input.trim() && !attachedImage) || loading}
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl brand-gradient-bg text-primary-foreground shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          /* CREATOR STUDIO TOOLS */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {/* Tool Selection Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "caption", label: "Captions", icon: FileText },
                { id: "reels_idea", label: "Reels & Hooks", icon: Video },
                { id: "hashtags", label: "Hashtags", icon: Hash },
                { id: "bio", label: "Creator Bio", icon: UserCheck },
                { id: "rewrite", label: "AI Rewriter", icon: Wand2 },
                { id: "image_analysis", label: "Photo Vibe", icon: Compass },
              ].map((tool) => {
                const Icon = tool.icon;
                const active = studioTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setStudioTool(tool.id as AiCreatorOptions["tool"]);
                      setStudioResult("");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Form */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  {studioTool === "caption" && "What is your post about?"}
                  {studioTool === "reels_idea" && "What is the topic or niche of your reel?"}
                  {studioTool === "hashtags" && "What is the post theme / industry?"}
                  {studioTool === "bio" && "Describe your identity, hobbies, or brand"}
                  {studioTool === "rewrite" && "Paste the draft caption or text to elevate"}
                  {studioTool === "image_analysis" && "Describe the photo visual elements"}
                </label>
                <Textarea
                  value={studioTopic}
                  onChange={(e) => setStudioTopic(e.target.value)}
                  placeholder={
                    studioTool === "caption"
                      ? "e.g. Sunset rooftop shoot in Mumbai with friends, celebrating project launch"
                      : studioTool === "reels_idea"
                        ? "e.g. Coding morning routine, 3 minimal desk setup tips"
                        : studioTool === "hashtags"
                          ? "e.g. Street photography, cinematic urban aesthetic"
                          : studioTool === "bio"
                            ? "e.g. Tech founder & visual designer based in Bangalore, building AI tools"
                            : "Enter text..."
                  }
                  rows={3}
                  className="rounded-xl bg-background text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Tone / Aesthetic
                  </label>
                  <select
                    value={studioTone}
                    onChange={(e) => setStudioTone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                    Language
                  </label>
                  <select
                    value={studioLang}
                    onChange={(e) => setStudioLang(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleRunStudioTool}
                disabled={studioLoading || !studioTopic.trim()}
                className="w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold shadow-md shadow-primary/20"
              >
                {studioLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating with Opexnal AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Magic Output
                  </>
                )}
              </Button>
            </div>

            {/* Generated Studio Result Card */}
            {studioResult && (
              <div className="rounded-2xl border border-primary/30 bg-surface p-4 shadow-sm space-y-3 animate-in fade-in-50">
                <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      AI Generated Result
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(studioResult);
                        setStudioCopied(true);
                        toast.success("Result copied");
                        setTimeout(() => setStudioCopied(false), 2000);
                      }}
                      className="h-7 text-xs rounded-lg gap-1 border-border"
                    >
                      {studioCopied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {studioCopied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseInPost(studioResult)}
                      className="h-7 text-xs rounded-lg gap-1 brand-gradient-bg text-primary-foreground"
                    >
                      <Share2 className="h-3 w-3" /> Create Post
                    </Button>
                  </div>
                </div>

                <div className="whitespace-pre-line text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                  {studioResult}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
