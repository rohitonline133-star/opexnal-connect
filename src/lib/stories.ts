import { supabase } from "@/integrations/supabase/client";
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

export async function resolveStoryMediaUrl(path: string, expiresIn = 3600) {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    path.startsWith("/")
  ) {
    return path;
  }
  try {
    const { data } = await supabase.storage.from("story-media").createSignedUrl(path, expiresIn);
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
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
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
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
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
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 14).toISOString(),
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

  const authors = new Map((profilesRes.data ?? []).map((p) => [p.id, p as FeedAuthor]));
  const seen = new Set((viewsRes.data ?? []).map((v) => v.story_id));

  return rows.map<Story>((row) => ({
    ...row,
    author: authors.get(row.user_id) ?? null,
    seen: row.user_id === viewerId || seen.has(row.id),
  }));
}

/** Active (non-expired) stories the viewer may see, grouped by author. */
export async function getStoryTray(viewerId: string) {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (!error && data && data.length > 0) {
      const stories = await decorateStories(data, viewerId);
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

      const list = Array.from(groups.values());
      // Own stories first, then unseen, then the rest.
      list.sort((a, b) => {
        if (a.author.id === viewerId) return -1;
        if (b.author.id === viewerId) return 1;
        return Number(b.hasUnseen) - Number(a.hasUnseen);
      });
      return list;
    }
  } catch {
    // fallback to empty
  }

  return [];
}

export async function getUserStories(userId: string, viewerId: string) {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (!error && data && data.length > 0) {
      return decorateStories(data, viewerId);
    }
  } catch {
    // fallback
  }

  return [];
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
  const ext =
    input.file.name.split(".").pop()?.toLowerCase() ||
    (input.mediaType === "video" ? "mp4" : "jpg");
  const path = `${input.userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("story-media")
    .upload(path, input.file, { contentType: input.file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("stories")
    .insert({
      user_id: input.userId,
      storage_path: path,
      media_type: input.mediaType,
      caption: input.caption.trim(),
      audience: input.audience,
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .select("id")
    .single();

  if (error) {
    await supabase.storage.from("story-media").remove([path]);
    throw error;
  }
  return data.id;
}

export async function deleteStory(story: Pick<StoryRow, "id" | "storage_path">) {
  const { error } = await supabase.from("stories").delete().eq("id", story.id);
  if (error) throw error;
  await supabase.storage.from("story-media").remove([story.storage_path]);
}

export async function recordStoryView(storyId: string, viewerId: string) {
  await supabase
    .from("story_views")
    .upsert(
      { story_id: storyId, viewer_id: viewerId },
      { onConflict: "story_id,viewer_id", ignoreDuplicates: true },
    );
}

export async function getStoryViewers(storyId: string) {
  const { data, error } = await supabase
    .from("story_views")
    .select("viewer_id, created_at")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [] as { viewer: FeedAuthor; created_at: string }[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_verified")
    .in(
      "id",
      rows.map((r) => r.viewer_id),
    );
  const map = new Map((profiles ?? []).map((p) => [p.id, p as FeedAuthor]));
  return rows
    .map((r) => ({ viewer: map.get(r.viewer_id), created_at: r.created_at }))
    .filter((r): r is { viewer: FeedAuthor; created_at: string } => Boolean(r.viewer));
}

export async function isStoryMuted(muterId: string, mutedId: string) {
  const { data } = await supabase
    .from("mutes")
    .select("mute_stories")
    .eq("muter_id", muterId)
    .eq("muted_id", mutedId)
    .maybeSingle();
  return Boolean(data?.mute_stories);
}

export async function setStoryMuted(muterId: string, mutedId: string, muted: boolean) {
  if (muted) {
    const { error } = await supabase
      .from("mutes")
      .upsert(
        { muter_id: muterId, muted_id: mutedId, mute_stories: true, mute_posts: false },
        { onConflict: "muter_id,muted_id" },
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("mutes")
      .update({ mute_stories: false })
      .eq("muter_id", muterId)
      .eq("muted_id", mutedId);
    if (error) throw error;
  }
}

export async function reportContent(input: {
  reporterId: string;
  targetType: "story" | "post" | "comment" | "profile";
  targetId: string;
  reason: string;
  details?: string;
}) {
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    details: input.details?.trim() ?? "",
  });
  if (error) throw error;
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
