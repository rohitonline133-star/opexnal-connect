import { supabase } from "@/integrations/supabase/client";
import { authClient } from "@/lib/auth-client";
import type { Database } from "@/integrations/supabase/types";
import type { FeedAuthor } from "@/lib/posts";

export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
export type StoryAudience = Database["public"]["Enums"]["story_audience"];

export type Story = StoryRow & { author: FeedAuthor | null; seen: boolean };

export type StoryGroup = {
  author: FeedAuthor;
  stories: Story[];
  hasUnseen: boolean;
};

export async function resolveStoryMediaUrl(path: string, expiresIn = 300) {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("/api/v1/storage/public/")
  ) {
    return path;
  }
  try {
    const { data, error } = await supabase.storage.from("story-media").createSignedUrl(path, expiresIn);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

const SEED_STORY_GROUPS: StoryGroup[] = [
  {
    author: {
      id: "user_maya",
      username: "maya_codes",
      display_name: "Maya Chen",
      avatar_url:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      is_verified: true,
    },
    hasUnseen: true,
    stories: [
      {
        id: "story_maya_1",
        user_id: "user_maya",
        storage_path:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        caption: "Late night vibes building next-gen social interfaces ✨",
        audience: "public",
        width: 800,
        height: 1200,
        duration_seconds: null,
        created_at: new Date(1791900000000 - 1000 * 60 * 30).toISOString(),
        updated_at: new Date(1791900000000 - 1000 * 60 * 30).toISOString(),
        expires_at: new Date(1791900000000 + 1000 * 60 * 60 * 20).toISOString(),
        views_count: 142,
        author: {
          id: "user_maya",
          username: "maya_codes",
          display_name: "Maya Chen",
          avatar_url:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          is_verified: true,
        },
        seen: false,
      },
    ],
  },
  {
    author: {
      id: "user_zenith",
      username: "zenith_design",
      display_name: "Zenith Creative",
      avatar_url:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      is_verified: true,
    },
    hasUnseen: true,
    stories: [
      {
        id: "story_zenith_1",
        user_id: "user_zenith",
        storage_path:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        caption: "New 3D drop preview coming this Friday 🎨🔥",
        audience: "public",
        width: 800,
        height: 1200,
        duration_seconds: null,
        created_at: new Date(1791900000000 - 1000 * 60 * 60).toISOString(),
        updated_at: new Date(1791900000000 - 1000 * 60 * 60).toISOString(),
        expires_at: new Date(1791900000000 + 1000 * 60 * 60 * 18).toISOString(),
        views_count: 310,
        author: {
          id: "user_zenith",
          username: "zenith_design",
          display_name: "Zenith Creative",
          avatar_url:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
          is_verified: true,
        },
        seen: false,
      },
    ],
  },
  {
    author: {
      id: "user_alex",
      username: "alex_adventures",
      display_name: "Alex Rivers",
      avatar_url:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
      is_verified: true,
    },
    hasUnseen: true,
    stories: [
      {
        id: "story_alex_1",
        user_id: "user_alex",
        storage_path:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        caption: "Alpine sunrise 🏔️ Take a breath and enjoy the moment.",
        audience: "public",
        width: 800,
        height: 1200,
        duration_seconds: null,
        created_at: new Date(1791900000000 - 1000 * 60 * 120).toISOString(),
        updated_at: new Date(1791900000000 - 1000 * 60 * 120).toISOString(),
        expires_at: new Date(1791900000000 + 1000 * 60 * 60 * 14).toISOString(),
        views_count: 89,
        author: {
          id: "user_alex",
          username: "alex_adventures",
          display_name: "Alex Rivers",
          avatar_url:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
          is_verified: true,
        },
        seen: false,
      },
    ],
  },
];

async function decorateStories(rows: StoryRow[], viewerId: string) {
  if (rows.length === 0) return [] as Story[];
  const [profilesRes, viewsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .in("id", Array.from(new Set(rows.map((r) => r.user_id)))),
    supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", viewerId)
      .in(
        "story_id",
        rows.map((r) => r.id),
      ),
  ]);

  const authors = new Map(
    ((profilesRes.data ?? []) as FeedAuthor[]).map((p: FeedAuthor) => [p.id, p]),
  );
  const seen = new Set(
    ((viewsRes.data ?? []) as Array<{ story_id: string }>).map((v) => v.story_id),
  );

  return rows.map((row: StoryRow): Story => ({
    ...row,
    author: authors.get(row.user_id) ?? null,
    seen: row.user_id === viewerId || seen.has(row.id),
  }));
}

/** Active (non-expired) stories the viewer may see, grouped by author. */
type ApiStoryRecord = {
  id: string;
  author_id?: string;
  user_id?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  media_url?: string;
  media_type?: "image" | "video";
  visibility?: StoryAudience;
  caption?: string;
  width?: number | null;
  height?: number | null;
  created_at: string;
  expires_at: string;
  seen_by_me?: boolean;
};

async function storyApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(authClient.getAuthHeader());
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || `Story API request failed (${response.status}).`);
  return payload;
}

function mapApiStory(row: ApiStoryRecord): Story {
  const userId = row.author_id || row.user_id || "";
  const story = {
    id: row.id,
    user_id: userId,
    storage_path: row.media_url || "",
    media_type: row.media_type || "image",
    audience: row.visibility || "public",
    caption: row.caption || "",
    width: row.width ?? null,
    height: row.height ?? null,
    created_at: row.created_at,
    expires_at: row.expires_at,
    author: userId
      ? {
          id: userId,
          username: row.username || "unknown",
          display_name: row.display_name || row.username || "Unknown user",
          avatar_url: row.avatar_url || null,
          is_verified: false,
        }
      : null,
    seen: Boolean(row.seen_by_me),
  };
  return story as unknown as Story;
}

export async function getStoryTray(viewerId: string) {
  try {
    const payload = await storyApiRequest<{ stories?: ApiStoryRecord[] }>("/api/v1/stories");
    const stories = (payload.stories || []).map(mapApiStory);
    const groups = new Map<string, StoryGroup>();
    for (const story of stories) {
      if (!story.author) continue;
      const group = groups.get(story.user_id) ?? {
        author: story.author,
        stories: [],
        hasUnseen: false,
      };
      group.stories.push(story);
      if (!story.seen) group.hasUnseen = true;
      groups.set(story.user_id, group);
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (a.author.id === viewerId) return -1;
      if (b.author.id === viewerId) return 1;
      return Number(b.hasUnseen) - Number(a.hasUnseen);
    });
  } catch {
    return import.meta.env.DEV ? SEED_STORY_GROUPS : [];
  }
}

export async function getUserStories(userId: string, _viewerId: string) {
  try {
    const payload = await storyApiRequest<{ stories?: ApiStoryRecord[] }>(
      `/api/v1/stories?userId=${encodeURIComponent(userId)}`,
    );
    return (payload.stories || []).map(mapApiStory);
  } catch {
    if (import.meta.env.DEV) {
      return SEED_STORY_GROUPS.flatMap((group) => group.stories).filter((story) => story.user_id === userId);
    }
    return [];
  }
}

export async function createStory(input: {
  userId: string;
  file: File;
  mediaType: "image" | "video";
  caption: string;
  audience: StoryAudience;
  width?: number | null;
  height?: number | null;
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || authData.user?.id !== input.userId) {
    throw new Error("Verified authentication is required to create a story.");
  }
  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("story-media")
    .upload(`${input.userId}/${crypto.randomUUID()}`, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
  if (uploadError || !uploaded?.path) {
    throw uploadError || new Error("Story media upload failed.");
  }
  try {
    const payload = await storyApiRequest<{ story?: { id?: string } }>("/api/v1/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaUrl: uploaded.path,
        mediaType: input.mediaType,
        visibility: input.audience,
        caption: input.caption.trim(),
        width: input.width ?? null,
        height: input.height ?? null,
      }),
    });
    if (!payload.story?.id) throw new Error("The API did not return the created story.");
    return payload.story.id;
  } catch (error) {
    await supabase.storage.from("story-media").remove([uploaded.path]);
    throw error;
  }
}

export async function deleteStory(story: Pick<StoryRow, "id" | "storage_path">) {
  await storyApiRequest<{ success: boolean }>(`/api/v1/stories/${encodeURIComponent(story.id)}`, {
    method: "DELETE",
  });
}

export async function recordStoryView(storyId: string, _viewerId: string) {
  await storyApiRequest<{ success: boolean }>(`/api/v1/stories/${encodeURIComponent(storyId)}/view`, {
    method: "POST",
  });
}

export async function getStoryViewers(storyId: string) {
  const payload = await storyApiRequest<{
    viewers?: Array<{
      viewer_id: string;
      created_at: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    }>;
  }>(`/api/v1/stories/${encodeURIComponent(storyId)}/viewers`);
  return (payload.viewers || []).map((row) => ({
    viewer: {
      id: row.viewer_id,
      username: row.username,
      display_name: row.display_name || row.username,
      avatar_url: row.avatar_url,
      is_verified: false,
    },
    created_at: row.created_at,
  }));
}

export async function isStoryMuted(muterId: string, mutedId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== muterId) return false;
  const payload = await storyApiRequest<{ muted?: boolean }>(
    `/api/v1/users/${encodeURIComponent(mutedId)}/story-muted`,
  );
  return Boolean(payload.muted);
}

export async function setStoryMuted(muterId: string, mutedId: string, muted: boolean) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== muterId) {
    throw new Error("Verified authentication is required to update story mute settings.");
  }
  await storyApiRequest<{ muted: boolean }>(
    `/api/v1/users/${encodeURIComponent(mutedId)}/story-mute`,
    { method: muted ? "POST" : "DELETE" },
  );
}

export async function reportContent(input: {
  reporterId: string;
  targetType: "story" | "post" | "comment" | "profile";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== input.reporterId) {
    throw new Error("Verified authentication is required to report content.");
  }
  const allowedReasons = new Set([
    "spam",
    "harassment",
    "impersonation",
    "hate",
    "nudity",
    "violence",
    "scam",
    "other",
  ]);
  const reason = allowedReasons.has(input.reason) ? input.reason : "other";
  await storyApiRequest<{ report: { id: string } }>("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetType: input.targetType === "profile" ? "user" : input.targetType,
      targetId: input.targetId,
      reason,
      details: input.details?.trim() ?? "",
    }),
  });
}

export const STORY_IMAGE_DURATION_MS = 5000;

export interface StoryHighlight {
  id: string;
  userId: string;
  title: string;
  coverUrl: string;
  storyIds: string[];
  createdAt: string;
}

const LOCAL_HIGHLIGHTS_KEY = "opexnal_story_highlights";

const DEFAULT_HIGHLIGHTS: StoryHighlight[] = [
  {
    id: "hl_travel",
    userId: "user_maya",
    title: "Travel ✈️",
    coverUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80",
    storyIds: ["story_maya_1"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "hl_creative",
    userId: "user_zenith",
    title: "3D Art 🎨",
    coverUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    storyIds: ["story_zenith_1"],
    createdAt: new Date().toISOString(),
  },
];

const memoryHighlights: Record<string, StoryHighlight[]> = {};

export function getStoryHighlights(userId: string): StoryHighlight[] {
  if (typeof window === "undefined") {
    if (!memoryHighlights[userId]) {
      memoryHighlights[userId] = DEFAULT_HIGHLIGHTS.filter((h) => h.userId === userId);
    }
    return memoryHighlights[userId] || [];
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_HIGHLIGHTS_KEY}_${userId}`);
    if (!raw) {
      const filtered = DEFAULT_HIGHLIGHTS.filter((h) => h.userId === userId);
      return filtered;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_HIGHLIGHTS.filter((h) => h.userId === userId);
  }
}

export function saveStoryHighlight(
  highlight: Omit<StoryHighlight, "id" | "createdAt">,
): StoryHighlight {
  const current = getStoryHighlights(highlight.userId);
  const newHighlight: StoryHighlight = {
    ...highlight,
    id: `hl_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  current.push(newHighlight);
  if (typeof window === "undefined") {
    memoryHighlights[highlight.userId] = current;
    return newHighlight;
  }
  try {
    localStorage.setItem(`${LOCAL_HIGHLIGHTS_KEY}_${highlight.userId}`, JSON.stringify(current));
  } catch {
    // ignore
  }
  return newHighlight;
}

export function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}
