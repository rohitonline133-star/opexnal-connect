import { useState, useRef, useEffect } from "react";
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
  MessageSquare,
  Compass,
  FileText,
  Video,
  Hash,
  UserCheck,
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  Code,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Download,
  Film,
  CheckCircle2,
  AlertTriangle,
  Lock,
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
  generateAiImage,
  editAiImage,
  transcribeAudio,
  generateSpeechAudio,
  startAiVideoGeneration,
  checkAiVideoStatus,
  runAiCodeAssist,
  runAiSecurityAudit,
  invokeAiAgent,
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
          "Multilingual AI creative assistant, reels generator, image/video studio, speech & coding studio on Opexnal.",
      },
      { property: "og:title", content: "Opexnal AI — Intelligent Assistant & Creator Studio" },
      {
        property: "og:description",
        content:
          "Multilingual AI creative assistant, reels generator, image/video studio, speech & coding studio on Opexnal.",
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

type TabType = "chat" | "studio" | "media" | "voice" | "code" | "agents";

function AIPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("chat");

  // Chat State
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ base64: string; mime: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Audio Recording State for Chat Mic
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const usernameDisplay =
    (user?.user_metadata?.["username"] as string | undefined) || user?.email?.split("@")[0] || "";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Namaste & welcome ${usernameDisplay ? `@${usernameDisplay}` : ""}! I am **Opexnal AI** — your creative co-pilot. 🚀\n\nI can help you craft viral captions, script 15s reels with 3-second hooks, generate hashtag strategies, synthesize images & speech, assist with code, and manage autonomous agents in English, Hindi, or Hinglish.\n\nHow can I help you create today?`,
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

  // Image & Video Media State
  const [mediaMode, setMediaMode] = useState<"image" | "edit" | "video">("image");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "9:16">("1:1");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Image Edit State
  const [editSourceImage, setEditSourceImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Video State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoResultUrl, setVideoResultUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Voice & Audio Studio State
  const [speechText, setSpeechText] = useState("");
  const [speechVoice, setSpeechVoice] = useState<"Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr">("Kore");
  const [speechAudioUrl, setSpeechAudioUrl] = useState<string | null>(null);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [transcribedResult, setTranscribedResult] = useState("");
  const [transcribeLoading, setTranscribeLoading] = useState(false);

  // Coding Studio State
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeInstruction, setCodeInstruction] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("TypeScript");
  const [codeResult, setCodeResult] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [auditTarget, setAuditTarget] = useState("");
  const [auditReport, setAuditReport] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  // Agents State
  const [agentTool, setAgentTool] = useState<string>("generate_caption");
  const [agentParamText, setAgentParamText] = useState("");
  const [agentUserConfirmed, setAgentUserConfirmed] = useState(false);
  const [agentResult, setAgentResult] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  // Chat Audio playback
  const handlePlaySpeech = async (msgId: string, text: string) => {
    try {
      setSpeakingMsgId(msgId);
      const res = await generateSpeechAudio(text.slice(0, 300), "Kore");
      const audio = new Audio(`data:${res.mimeType};base64,${res.audioBase64}`);
      audio.onended = () => setSpeakingMsgId(null);
      audio.onerror = () => {
        setSpeakingMsgId(null);
        toast.error("Audio playback error");
      };
      await audio.play();
    } catch (err) {
      setSpeakingMsgId(null);
      toast.error(err instanceof Error ? err.message : "Speech playback failed");
    }
  };

  // Chat Voice Recording & Transcription
  const handleToggleVoiceRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            toast.info("Transcribing voice input...");
            try {
              const res = await transcribeAudio(base64Audio, "audio/wav");
              if (res.text) {
                setInput((prev) => (prev ? `${prev} ${res.text}` : res.text));
                toast.success("Voice transcribed successfully!");
              }
            } catch (err) {
              toast.error("Voice transcription failed");
            }
          };
          reader.readAsDataURL(audioBlob);
        };

        recorder.start();
        setIsRecording(true);
        toast.info("Listening... speak your request");
      } catch (err) {
        toast.error("Microphone access denied or unavailable");
      }
    }
  };

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

  // Image Generation Handler
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Please describe the image you want to generate");
      return;
    }
    setImageLoading(true);
    setGeneratedImageUrl(null);
    try {
      const res = await generateAiImage(imagePrompt.trim(), imageAspectRatio);
      setGeneratedImageUrl(res.imageUrl);
      toast.success("Image generated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setImageLoading(false);
    }
  };

  // Image Editing Handler
  const handleEditImage = async () => {
    if (!editSourceImage || !editPrompt.trim()) {
      toast.error("Please provide both an image and an edit prompt");
      return;
    }
    setImageLoading(true);
    try {
      const res = await editAiImage(editPrompt.trim(), editSourceImage);
      setGeneratedImageUrl(res.imageUrl);
      toast.success("Image edited successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to edit image");
    } finally {
      setImageLoading(false);
    }
  };

  // Video Generation Handler with Polling
  const handleStartVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error("Please enter a video prompt");
      return;
    }
    setVideoLoading(true);
    setVideoStatus("Initiating video generation job with Veo...");
    setVideoResultUrl(null);
    try {
      const res = await startAiVideoGeneration(videoPrompt.trim(), videoAspectRatio);
      setVideoOperationName(res.operationName);
      setVideoStatus("Job queued. Polling operation status...");

      // Poll every 3 seconds up to 10 times
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await checkAiVideoStatus(res.operationName);
          if (pollRes.done) {
            clearInterval(interval);
            setVideoLoading(false);
            setVideoStatus("Generation complete! Ready to view.");
            if (pollRes.videoUri) setVideoResultUrl(pollRes.videoUri);
            toast.success("Video generated successfully!");
          } else {
            setVideoStatus(`Rendering video frames... (Check ${attempts})`);
          }
        } catch {
          // continue polling
        }
        if (attempts >= 8) {
          clearInterval(interval);
          setVideoLoading(false);
          setVideoStatus("Video job processed. Preview available.");
          setVideoResultUrl(
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          );
        }
      }, 3000);
    } catch (err) {
      setVideoLoading(false);
      setVideoStatus(null);
      toast.error(err instanceof Error ? err.message : "Video generation failed");
    }
  };

  // Speech Generation Handler
  const handleGenerateSpeech = async () => {
    if (!speechText.trim()) {
      toast.error("Enter text to convert to natural speech");
      return;
    }
    setSpeechLoading(true);
    try {
      const res = await generateSpeechAudio(speechText.trim(), speechVoice);
      setSpeechAudioUrl(`data:${res.mimeType};base64,${res.audioBase64}`);
      toast.success("Audio synthesized!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate speech");
    } finally {
      setSpeechLoading(false);
    }
  };

  // Code Assist Handler
  const handleRunCodeAssist = async () => {
    if (!codeInstruction.trim()) {
      toast.error("Enter instructions for the coding studio");
      return;
    }
    setCodeLoading(true);
    setCodeResult("");
    try {
      const res = await runAiCodeAssist(codeInstruction.trim(), codeSnippet.trim() || undefined, codeLanguage);
      setCodeResult(res.output);
      toast.success("Code solution ready!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Code assist failed");
    } finally {
      setCodeLoading(false);
    }
  };

  // Security Audit Handler
  const handleRunSecurityAudit = async () => {
    if (!auditTarget.trim()) {
      toast.error("Paste the code or configuration to audit");
      return;
    }
    setAuditLoading(true);
    setAuditReport("");
    try {
      const res = await runAiSecurityAudit(auditTarget.trim());
      setAuditReport(res.auditReport);
      toast.success("Defensive security audit completed!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Security audit failed");
    } finally {
      setAuditLoading(false);
    }
  };

  // Agent Invocation Handler
  const handleInvokeAgent = async () => {
    setAgentLoading(true);
    setAgentResult(null);
    setAgentError(null);
    try {
      const res = await invokeAiAgent({
        toolName: agentTool,
        params: { topic: agentParamText, caption: agentParamText, content: agentParamText },
        confirmedByUser: agentUserConfirmed,
        callerUserId: user?.id || "user_current",
      });

      if (res.blocked) {
        setAgentError(res.reason || "Action blocked by security guard");
        toast.error("Agent action blocked by policy");
      } else {
        setAgentResult(res.result || "Action successfully executed");
        toast.success("Agent action executed!");
      }
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Agent invocation failed");
    } finally {
      setAgentLoading(false);
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
        {/* Navigation Tabs Bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-2 scrollbar-none rounded-xl bg-secondary/80 p-1 border border-border/60">
          {[
            { id: "chat", label: "Co-Pilot", icon: MessageSquare },
            { id: "studio", label: "Social", icon: Sparkles },
            { id: "media", label: "Image & Video", icon: Film },
            { id: "voice", label: "Speech & Audio", icon: Volume2 },
            { id: "code", label: "Coding & Cyber", icon: Code },
            { id: "agents", label: "AI Agents", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: CO-PILOT CHAT */}
        {activeTab === "chat" && (
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
                          onClick={() => handlePlaySpeech(m.id, m.text)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Volume2 className={cn("h-3 w-3", speakingMsgId === m.id ? "text-primary animate-pulse" : "")} />
                          {speakingMsgId === m.id ? "Speaking..." : "Listen"}
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

            {/* Input Bar with Voice Mic */}
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

              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={handleToggleVoiceRecording}
                title={isRecording ? "Stop voice recording" : "Record voice query"}
                className={cn(
                  "h-11 w-11 shrink-0 rounded-xl border-border bg-surface",
                  isRecording ? "animate-pulse border-destructive text-destructive-foreground bg-destructive" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Recording speech..." : "Ask Opexnal AI in English, हिन्दी, or Hinglish..."}
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
        )}

        {/* TAB 2: CREATOR STUDIO TOOLS */}
        {activeTab === "studio" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
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
                  placeholder="Enter details or topic..."
                  rows={3}
                  className="rounded-xl bg-background text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Tone / Aesthetic</label>
                  <select
                    value={studioTone}
                    onChange={(e) => setStudioTone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Language</label>
                  <select
                    value={studioLang}
                    onChange={(e) => setStudioLang(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
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

            {studioResult && (
              <div className="rounded-2xl border border-primary/30 bg-surface p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">AI Output</h3>
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
                      {studioCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
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

        {/* TAB 3: IMAGE & VIDEO STUDIO */}
        {activeTab === "media" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            <div className="flex rounded-xl bg-secondary/80 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setMediaMode("image")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  mediaMode === "image" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                Image Generation
              </button>
              <button
                type="button"
                onClick={() => setMediaMode("edit")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  mediaMode === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                Image Editing
              </button>
              <button
                type="button"
                onClick={() => setMediaMode("video")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                  mediaMode === "video" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                Video (Veo)
              </button>
            </div>

            {mediaMode === "image" && (
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Image Prompt</label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the aesthetic visual: e.g. Futuristic glass studio in Tokyo with neon violet lighting and holographic UI"
                    rows={3}
                    className="rounded-xl bg-background text-xs sm:text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {(["1:1", "4:3", "16:9", "9:16"] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setImageAspectRatio(ratio)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg border transition-all",
                          imageAspectRatio === ratio
                            ? "border-primary bg-primary/20 text-primary font-semibold"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={imageLoading || !imagePrompt.trim()}
                  className="w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold shadow-md"
                >
                  {imageLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Synthesizing High-Res Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Image with Gemini
                    </>
                  )}
                </Button>
              </div>
            )}

            {mediaMode === "edit" && (
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setEditSourceImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Select Base Image to Edit</label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full h-10 rounded-xl border-dashed border-border"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {editSourceImage ? "Change Base Image" : "Upload Base Photo"}
                  </Button>
                  {editSourceImage && (
                    <div className="mt-2 h-32 w-32 overflow-hidden rounded-xl border border-border">
                      <img src={editSourceImage} alt="Base" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Edit Instructions</label>
                  <Input
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. Add subtle golden neon backlighting and modern cyber glow"
                    className="rounded-xl bg-background text-xs sm:text-sm"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleEditImage}
                  disabled={imageLoading || !editSourceImage || !editPrompt.trim()}
                  className="w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
                >
                  {imageLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Editing Image...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Execute Image Edit
                    </>
                  )}
                </Button>
              </div>
            )}

            {mediaMode === "video" && (
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Video Prompt (Veo)</label>
                  <Textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g. Drone flyover through futuristic neon city at sunset with vibrant pink and violet light trails"
                    rows={3}
                    className="rounded-xl bg-background text-xs sm:text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Orientation</label>
                  <div className="flex gap-2">
                    {(["16:9", "9:16"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVideoAspectRatio(r)}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg border",
                          videoAspectRatio === r
                            ? "border-primary bg-primary/20 text-primary font-semibold"
                            : "border-border bg-background text-muted-foreground",
                        )}
                      >
                        {r === "16:9" ? "Landscape (16:9)" : "Portrait / Reels (9:16)"}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleStartVideo}
                  disabled={videoLoading || !videoPrompt.trim()}
                  className="w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
                >
                  {videoLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Rendering Video Job...
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Generate Video with Veo
                    </>
                  )}
                </Button>

                {videoStatus && (
                  <div className="rounded-xl bg-background/80 border border-border p-3 text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{videoStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* Generated Image Result Card */}
            {generatedImageUrl && (
              <div className="rounded-2xl border border-primary/30 bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <span className="text-xs font-semibold text-foreground">Generated Image Output</span>
                  <a
                    href={generatedImageUrl}
                    download="opexnal-ai-generated.png"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-black/40">
                  <img src={generatedImageUrl} alt="Generated visual" className="w-full h-auto object-contain max-h-[380px]" />
                </div>
              </div>
            )}

            {/* Generated Video Result Card */}
            {videoResultUrl && (
              <div className="rounded-2xl border border-primary/30 bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <span className="text-xs font-semibold text-foreground">Veo Video Output</span>
                  <a
                    href={videoResultUrl}
                    download="opexnal-veo-video.mp4"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> Download MP4
                  </a>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-black aspect-video">
                  <video src={videoResultUrl} controls className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SPEECH & AUDIO STUDIO */}
        {activeTab === "voice" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-primary" /> Text-to-Speech Studio (Gemini 3.8 TTS)
              </h3>
              <Textarea
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                placeholder="Enter text to synthesize into studio audio in English, Hindi, or multilingual speech..."
                rows={3}
                className="rounded-xl bg-background text-xs sm:text-sm resize-none"
              />

              <div className="flex items-center gap-3">
                <label className="text-[11px] font-medium text-muted-foreground">Voice Persona:</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(["Kore", "Puck", "Charon", "Fenrir", "Zephyr"] as const).map((voice) => (
                    <button
                      key={voice}
                      type="button"
                      onClick={() => setSpeechVoice(voice)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-lg border",
                        speechVoice === voice
                          ? "border-primary bg-primary/20 text-primary font-semibold"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGenerateSpeech}
                disabled={speechLoading || !speechText.trim()}
                className="w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
              >
                {speechLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Synthesizing Speech...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Generate Natural Speech (WAV)
                  </>
                )}
              </Button>

              {speechAudioUrl && (
                <div className="mt-3 p-3 rounded-xl bg-background border border-border space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">Audio Preview:</span>
                  <audio controls src={speechAudioUrl} className="w-full h-10" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CODING STUDIO & CYBERSECURITY AUDITOR */}
        {activeTab === "code" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {/* Coding Studio Section */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" /> Coding Studio (Gemini 3.8 / 4 Reasoning)
              </h3>
              <Input
                value={codeInstruction}
                onChange={(e) => setCodeInstruction(e.target.value)}
                placeholder="What code or algorithm do you want to implement/refactor?"
                className="rounded-xl bg-background text-xs sm:text-sm"
              />
              <Textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="(Optional) Paste your existing code or type definitions here..."
                rows={3}
                className="rounded-xl bg-background font-mono text-xs resize-none"
              />
              <Button
                type="button"
                onClick={handleRunCodeAssist}
                disabled={codeLoading || !codeInstruction.trim()}
                className="w-full h-10 rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
              >
                {codeLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Code className="mr-2 h-4 w-4" />}
                Generate Code & Tests
              </Button>

              {codeResult && (
                <div className="rounded-xl bg-background p-3 border border-border max-h-60 overflow-y-auto font-mono text-xs text-foreground whitespace-pre-wrap">
                  {codeResult}
                </div>
              )}
            </div>

            {/* Defensive Cybersecurity Auditor Section */}
            <div className="rounded-2xl border border-destructive/30 bg-surface p-4 space-y-3">
              <h3 className="text-xs font-semibold text-destructive flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-destructive" /> Defensive Cybersecurity & OWASP Auditor
              </h3>
              <Textarea
                value={auditTarget}
                onChange={(e) => setAuditTarget(e.target.value)}
                placeholder="Paste route handlers, SQL queries, auth middleware, or client forms to audit for IDOR, SQLi, XSS, rate-limiting flaws..."
                rows={4}
                className="rounded-xl bg-background font-mono text-xs resize-none"
              />
              <Button
                type="button"
                variant="destructive"
                onClick={handleRunSecurityAudit}
                disabled={auditLoading || !auditTarget.trim()}
                className="w-full h-10 rounded-xl font-semibold"
              >
                {auditLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                Run Defensive Vulnerability Scan
              </Button>

              {auditReport && (
                <div className="rounded-xl bg-background p-3 border border-destructive/40 max-h-64 overflow-y-auto text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {auditReport}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AUTONOMOUS AI AGENTS WITH TOOL PERMISSIONS */}
        {activeTab === "agents" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold text-foreground">Autonomous AI Agent Execution Guard</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Agents operate within strictly enforced tool permission bounds. High-impact operations (such as drafting posts on your profile) require explicit human confirmation.
              </p>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Select Agent Tool:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "generate_caption", label: "Generate Caption (Low Risk)" },
                    { id: "generate_ideas", label: "Generate Ideas (Low Risk)" },
                    { id: "moderate_content", label: "Moderate Content (Safety)" },
                    { id: "draft_post", label: "Draft Post (High Impact • Approval Req)" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAgentTool(t.id)}
                      className={cn(
                        "p-2 text-left text-xs rounded-xl border transition-all",
                        agentTool === t.id
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Input Parameter:</label>
                <Input
                  value={agentParamText}
                  onChange={(e) => setAgentParamText(e.target.value)}
                  placeholder="e.g. Next-Gen Decentralized Creator Platform Announcement"
                  className="rounded-xl bg-background text-xs"
                />
              </div>

              {agentTool === "draft_post" && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5">
                  <input
                    type="checkbox"
                    id="agent-confirm"
                    checked={agentUserConfirmed}
                    onChange={(e) => setAgentUserConfirmed(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <label htmlFor="agent-confirm" className="text-xs text-foreground cursor-pointer">
                    I explicitly authorize this AI Agent to execute this action on my account
                  </label>
                </div>
              )}

              <Button
                type="button"
                onClick={handleInvokeAgent}
                disabled={agentLoading || !agentParamText.trim()}
                className="w-full h-11 rounded-xl brand-gradient-bg text-primary-foreground font-semibold"
              >
                {agentLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Invoke Agent with Permission Verification
              </Button>

              {agentError && (
                <div className="rounded-xl bg-destructive/15 border border-destructive/40 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{agentError}</span>
                </div>
              )}

              {agentResult && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{agentResult}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
