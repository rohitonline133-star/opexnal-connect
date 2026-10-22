import { authClient, supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostMediaRow = Database["public"]["Tables"]["post_media"]["Row"];
export type PostVisibility = Database["public"]["Enums"]["post_visibility"];
export type CommentRow = Database["public"]["Tables"]["post_comments"]["Row"];

export type FeedAuthor = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export type FeedPost = PostRow & {
  media: PostMediaRow[];
  author: FeedAuthor | null;
  liked: boolean;
  saved: boolean;
};

const POST_SELECT = "*, post_media(*)";

export function extractHashtags(caption: string) {
  const matches = caption.match(/#([A-Za-z0-9_]{1,50})/g) ?? [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

export async function resolveMediaUrl(path: string, expiresIn = 300) {
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
    const { data, error } = await supabase.storage.from("post-media").createSignedUrl(path, expiresIn);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export const SEED_AUTHORS: Record<string, FeedAuthor> = {
  user_maya: {
    id: "user_maya",
    username: "maya_codes",
    display_name: "Maya Chen",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    is_verified: true,
  },
  user_zenith: {
    id: "user_zenith",
    username: "zenith_design",
    display_name: "Zenith Creative",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    is_verified: true,
  },
  user_alex: {
    id: "user_alex",
    username: "alex_adventures",
    display_name: "Alex Rivers",
    avatar_url:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    is_verified: true,
  },
  user_rohit: {
    id: "user_rohit",
    username: "rohit_visuals",
    display_name: "Rohit Sharma",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    is_verified: true,
  },
};

export const SEED_POSTS: FeedPost[] = [
  {
    id: "seed_post_1",
    user_id: "user_maya",
    caption:
      "Late night refactoring and shaping next-gen social interfaces. The creator revolution is just getting started! 🚀✨ #opexnal #creatorlife #buildinpublic",
    location_name: "Bengaluru, India",
    location_lat: null,
    location_lng: null,
    visibility: "public",
    likes_count: 342,
    comments_count: 28,
    saves_count: 14,
    shares_count: 8,
    comments_enabled: true,
    created_at: "2026-10-14T08:15:00.000Z",
    updated_at: "2026-10-14T08:15:00.000Z",
    author: SEED_AUTHORS["user_maya"]!,
    liked: false,
    saved: false,
    media: [
      {
        id: "media_1_1",
        post_id: "seed_post_1",
        user_id: "user_maya",
        storage_path:
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        width: 800,
        height: 600,
        duration_seconds: null,
        position: 0,
        created_at: "2026-10-14T08:15:00.000Z",
      },
    ],
  },
  {
    id: "seed_post_2",
    user_id: "user_zenith",
    caption:
      "Exploring fluid 3D forms and glassmorphic lighting for our upcoming motion drop. Which palette speaks to you? 🎨 #designinspo #aesthetics #visualart",
    location_name: "Tokyo, Japan",
    location_lat: null,
    location_lng: null,
    visibility: "public",
    likes_count: 519,
    comments_count: 42,
    saves_count: 35,
    shares_count: 19,
    comments_enabled: true,
    created_at: "2026-10-14T06:00:00.000Z",
    updated_at: "2026-10-14T06:00:00.000Z",
    author: SEED_AUTHORS["user_zenith"]!,
    liked: false,
    saved: false,
    media: [
      {
        id: "media_2_1",
        post_id: "seed_post_2",
        user_id: "user_zenith",
        storage_path:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        width: 800,
        height: 800,
        duration_seconds: null,
        position: 0,
        created_at: "2026-10-14T06:00:00.000Z",
      },
    ],
  },
  {
    id: "seed_post_3",
    user_id: "user_alex",
    caption:
      "Golden hour in the alpine valleys. Nature needs no filters. What's your dream travel spot this year? 🏔️🌲 #naturephotography #aesthetics #travelgram",
    location_name: "Swiss Alps",
    location_lat: null,
    location_lng: null,
    visibility: "public",
    likes_count: 894,
    comments_count: 67,
    saves_count: 72,
    shares_count: 43,
    comments_enabled: true,
    created_at: "2026-10-14T03:00:00.000Z",
    updated_at: "2026-10-14T03:00:00.000Z",
    author: SEED_AUTHORS["user_alex"]!,
    liked: false,
    saved: false,
    media: [
      {
        id: "media_3_1",
        post_id: "seed_post_3",
        user_id: "user_alex",
        storage_path:
          "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        width: 800,
        height: 600,
        duration_seconds: null,
        position: 0,
        created_at: "2026-10-14T03:00:00.000Z",
      },
    ],
  },
  {
    id: "seed_post_4",
    user_id: "user_rohit",
    caption:
      "Morning coffee, crisp notes, and wireframes for Opexnal creators. Build what matters, connect with real people! ☕📱 #creatorlife #techvibes #opexnal",
    location_name: "Mumbai, India",
    location_lat: null,
    location_lng: null,
    visibility: "public",
    likes_count: 412,
    comments_count: 31,
    saves_count: 22,
    shares_count: 15,
    comments_enabled: true,
    created_at: "2026-10-13T23:00:00.000Z",
    updated_at: "2026-10-13T23:00:00.000Z",
    author: SEED_AUTHORS["user_rohit"]!,
    liked: false,
    saved: false,
    media: [
      {
        id: "media_4_1",
        post_id: "seed_post_4",
        user_id: "user_rohit",
        storage_path:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        media_type: "image",
        width: 800,
        height: 600,
        duration_seconds: null,
        position: 0,
        created_at: "2026-10-13T23:00:00.000Z",
      },
    ],
  },
  {
    id: "seed_post_5",
    user_id: "user_zenith",
    caption:
      "Dynamic motion study — exploring energy flows and micro-interactions. Turn audio on! 🎬🔊 #reelsindia #motiondesign #visualart",
    location_name: "Creative Lab",
    location_lat: null,
    location_lng: null,
    visibility: "public",
    likes_count: 730,
    comments_count: 54,
    saves_count: 88,
    shares_count: 61,
    comments_enabled: true,
    created_at: "2026-10-13T19:40:00.000Z",
    updated_at: "2026-10-13T19:40:00.000Z",
    author: SEED_AUTHORS["user_zenith"]!,
    liked: false,
    saved: false,
    media: [
      {
        id: "media_5_1",
        post_id: "seed_post_5",
        user_id: "user_zenith",
        storage_path:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        media_type: "video",
        width: 720,
        height: 1280,
        duration_seconds: 15,
        position: 0,
        created_at: "2026-10-13T19:40:00.000Z",
      },
    ],
  },
];

const LOCAL_POSTS_KEY = "opexnal_local_posts";
const LOCAL_LIKES_KEY = "opexnal_local_likes";
const LOCAL_SAVES_KEY = "opexnal_local_saves";
const LOCAL_COMMENTS_KEY = "opexnal_local_comments";

export function getLocalPosts(): FeedPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPost(post: FeedPost) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalPosts();
    current.unshift(post);
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function removeLocalPost(postId: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalPosts().filter((p) => p.id !== postId);
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getLocalLikes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_LIKES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function setLocalLike(postId: string, liked: boolean) {
  if (typeof window === "undefined") return;
  try {
    const set = getLocalLikes();
    if (liked) set.add(postId);
    else set.delete(postId);
    localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

export function getLocalSaves(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_SAVES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function setLocalSave(postId: string, saved: boolean) {
  if (typeof window === "undefined") return;
  try {
    const set = getLocalSaves();
    if (saved) set.add(postId);
    else set.delete(postId);
    localStorage.setItem(LOCAL_SAVES_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

function decorateWithLocalState(posts: FeedPost[], viewerId?: string | null): FeedPost[] {
  const localLikes = getLocalLikes();
  const localSaves = getLocalSaves();
  return posts.map((p) => ({
    ...p,
    liked: viewerId ? localLikes.has(p.id) || p.liked : p.liked,
    saved: viewerId ? localSaves.has(p.id) || p.saved : p.saved,
  }));
}

async function decorate(
  rows: (PostRow & { post_media: PostMediaRow[] })[],
  viewerId?: string | null,
) {
  if (rows.length === 0) return [] as FeedPost[];
  const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const postIds = rows.map((r) => r.id);

  const [profilesRes, likesRes, savesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_verified")
      .in("id", authorIds),
    viewerId
      ? supabase.from("post_likes").select("post_id").eq("user_id", viewerId).in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    viewerId
      ? supabase.from("post_saves").select("post_id").eq("user_id", viewerId).in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const authors = new Map(
    ((profilesRes.data ?? []) as FeedAuthor[]).map((p: FeedAuthor) => [p.id, p]),
  );
  const liked = new Set(
    ((likesRes.data ?? []) as Array<{ post_id: string }>).map((r) => r.post_id),
  );
  const saved = new Set(
    ((savesRes.data ?? []) as Array<{ post_id: string }>).map((r) => r.post_id),
  );

  return rows.map((postItem: PostRow & { post_media: PostMediaRow[] }): FeedPost => {
    const { post_media, ...post } = postItem;
    return {
      ...post,
      media: [...(post_media ?? [])].sort((a, b) => a.position - b.position),
      author: authors.get(post.user_id) ?? null,
      liked: liked.has(post.id),
      saved: saved.has(post.id),
    };
  });
}

export const FEED_PAGE_SIZE = 10;

/** Home feed: posts from people the viewer follows, plus their own. */
type ApiPostRecord = {
  id: string;
  author_id?: string;
  user_id?: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  caption?: string;
  visibility?: "public" | "private";
  location_name?: string | null;
  comments_enabled?: boolean;
  created_at: string;
  updated_at?: string;
  like_count?: number | string;
  comments_count?: number | string;
  saves_count?: number | string;
  shares_count?: number | string;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
  media_url?: string | null;
  media_type?: "image" | "video" | "text";
  media?: PostMediaRow[];
};

function mapApiPost(row: ApiPostRecord): FeedPost {
  const authorId = row.author_id || row.user_id || "";
  const mediaRows: PostMediaRow[] = Array.isArray(row.media)
    ? row.media
    : row.media_url
      ? [
          {
            id: `${row.id}-media`,
            post_id: row.id,
            user_id: authorId,
            storage_path: row.media_url,
            media_type: row.media_type === "video" ? "video" : "image",
            width: null,
            height: null,
            duration_seconds: null,
            position: 0,
            created_at: row.created_at,
          },
        ]
      : [];
  const post = {
    id: row.id,
    user_id: authorId,
    caption: row.caption || "",
    comments_count: Number(row.comments_count || 0),
    comments_enabled: row.comments_enabled !== false,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    likes_count: Number(row.like_count || 0),
    location_lat: null,
    location_lng: null,
    location_name: row.location_name || null,
    saves_count: Number(row.saves_count || 0),
    shares_count: Number(row.shares_count || 0),
    visibility: row.visibility === "private" ? "private" : "public",
    media: mediaRows,
    author: authorId
      ? {
          id: authorId,
          username: row.username || "unknown",
          display_name: row.display_name || row.username || "Unknown user",
          avatar_url: row.avatar_url || null,
          is_verified: false,
        }
      : null,
    liked: Boolean(row.liked_by_me),
    saved: Boolean(row.saved_by_me),
  };
  return post as unknown as FeedPost;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(authClient.getAuthHeader());
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || `Opexnal API request failed (${response.status}).`);
  return payload;
}

async function fetchApiFeed(limit = 100): Promise<FeedPost[]> {
  const payload = await apiRequest<{ posts?: ApiPostRecord[] }>(
    `/api/v1/posts/feed?limit=${Math.min(Math.max(limit, 1), 100)}`,
  );
  return (payload.posts || []).map(mapApiPost);
}

export async function getHomeFeed(
  viewerId: string,
  cursor?: string | null,
  limit = FEED_PAGE_SIZE,
) {
  try {
    const all = await fetchApiFeed(100);
    const visible = all.filter((post) => post.visibility === "public" || post.user_id === viewerId);
    const sliced = cursor ? visible.filter((post) => post.created_at < cursor) : visible;
    const items = sliced.slice(0, limit);
    const last = items[items.length - 1];
    return {
      items,
      nextCursor: sliced.length > limit && last ? last.created_at : null,
    };
  } catch {
    if (!import.meta.env.DEV) return { items: [], nextCursor: null };
    const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
    const sliced = cursor ? all.filter((post) => post.created_at < cursor) : all;
    const items = sliced.slice(0, limit);
    const last = items[items.length - 1];
    return { items, nextCursor: sliced.length > limit && last ? last.created_at : null };
  }
}

/** Explore shows real public posts. Seed content is development-only. */
export async function getExploreFeed(viewerId?: string | null) {
  try {
    const posts = await fetchApiFeed(100);
    return posts.filter((post) => post.visibility === "public");
  } catch {
    if (import.meta.env.DEV) {
      return decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
    }
    return [];
  }
}

export async function getReelsFeed(viewerId: string, limit = 30) {
  try {
    const posts = await fetchApiFeed(100);
    return posts
      .filter((post) => post.visibility === "public" || post.user_id === viewerId)
      .filter((post) => post.media.some((item) => item.media_type === "video"))
      .slice(0, limit);
  } catch {
    if (!import.meta.env.DEV) return [];
    return decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId)
      .filter((post) => post.media.some((item) => item.media_type === "video"))
      .slice(0, limit);
  }
}

export async function getPostsByUser(userId: string, viewerId?: string | null) {
  try {
    return (await fetchApiFeed(100)).filter((post) => post.user_id === userId);
  } catch {
    if (!import.meta.env.DEV) return [];
    return decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId).filter(
      (post) => post.user_id === userId,
    );
  }
}

export const GRID_PAGE_SIZE = 18;

export async function getUserPostsPage(
  userId: string,
  viewerId?: string | null,
  cursor?: string | null,
  limit = GRID_PAGE_SIZE,
) {
  const all = await getPostsByUser(userId, viewerId);
  const sliced = cursor ? all.filter((post) => post.created_at < cursor) : all;
  const items = sliced.slice(0, limit);
  const last = items[items.length - 1];
  return { items, nextCursor: sliced.length > limit && last ? last.created_at : null };
}

export async function getSavedPosts(_viewerId: string) {
  try {
    return (await fetchApiFeed(100)).filter((post) => post.saved);
  } catch {
    return import.meta.env.DEV
      ? decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], _viewerId).filter((post) =>
          getLocalSaves().has(post.id),
        )
      : [];
  }
}

export async function getPost(postId: string, viewerId?: string | null) {
  try {
    const payload = await apiRequest<{ post?: ApiPostRecord }>(
      `/api/v1/posts/${encodeURIComponent(postId)}`,
    );
    return payload.post ? mapApiPost(payload.post) : null;
  } catch {
    if (!import.meta.env.DEV) return null;
    return decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId).find(
      (post) => post.id === postId,
    ) ?? null;
  }
}

export async function getPostsByHashtag(tag: string, viewerId?: string | null) {
  try {
    const targetTag = tag.toLowerCase().replace(/^#/, "");
    return (await fetchApiFeed(100)).filter(
      (post) =>
        post.visibility === "public" &&
        extractHashtags(post.caption).includes(targetTag),
    );
  } catch {
    if (!import.meta.env.DEV) return [];
    const targetTag = tag.toLowerCase().replace(/^#/, "");
    return decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId).filter((post) =>
      extractHashtags(post.caption).includes(targetTag),
    );
  }
}

export async function toggleLike(postId: string, _userId: string, liked: boolean) {
  await apiRequest<{ liked: boolean }>(`/api/v1/posts/${encodeURIComponent(postId)}/like`, {
    method: liked ? "DELETE" : "POST",
  });
}

export async function toggleSave(postId: string, _userId: string, saved: boolean) {
  await apiRequest<{ saved: boolean }>(`/api/v1/posts/${encodeURIComponent(postId)}/save`, {
    method: saved ? "DELETE" : "POST",
  });
}

export async function recordShare(postId: string, _userId: string, channel = "link") {
  await apiRequest<{ success: boolean }>(`/api/v1/posts/${encodeURIComponent(postId)}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  });
}

export type CommentWithAuthor = CommentRow & { author: FeedAuthor | null; liked: boolean };

export async function getComments(postId: string, _viewerId?: string | null) {
  const payload = await apiRequest<{
    comments?: Array<CommentRow & {
      username?: string;
      display_name?: string;
      avatar_url?: string | null;
      liked_by_me?: boolean;
    }>;
  }>(`/api/v1/posts/${encodeURIComponent(postId)}/comments`);
  return (payload.comments || []).map((row) => ({
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    body: row.body,
    likes_count: row.likes_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: {
      id: row.user_id,
      username: row.username || "unknown",
      display_name: row.display_name || row.username || "Unknown user",
      avatar_url: row.avatar_url || null,
      is_verified: false,
    },
    liked: Boolean(row.liked_by_me),
  }));
}

export async function addComment(input: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}): Promise<CommentWithAuthor> {
  const payload = await apiRequest<{
    comment?: CommentRow & {
      username?: string;
      display_name?: string;
      avatar_url?: string | null;
      liked_by_me?: boolean;
    };
  }>(`/api/v1/posts/${encodeURIComponent(input.postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: input.body, parentId: input.parentId ?? null }),
  });
  if (!payload.comment) throw new Error("The API did not return the created comment.");
  const row = payload.comment;
  return {
    id: row.id,
    post_id: row.post_id,
    user_id: row.user_id,
    parent_id: row.parent_id,
    body: row.body,
    likes_count: row.likes_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: {
      id: row.user_id,
      username: row.username || "unknown",
      display_name: row.display_name || row.username || "Unknown user",
      avatar_url: row.avatar_url || null,
      is_verified: false,
    },
    liked: Boolean(row.liked_by_me),
  };
}

export async function deleteComment(commentId: string) {
  await apiRequest<{ success: boolean }>(`/api/v1/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
}

export async function toggleCommentLike(commentId: string, _userId: string, liked: boolean) {
  await apiRequest<{ liked: boolean }>(`/api/v1/comments/${encodeURIComponent(commentId)}/like`, {
    method: liked ? "DELETE" : "POST",
  });
}

export type NewPostMedia = {
  file: File;
  mediaType: "image" | "video";
  width?: number | null;
  height?: number | null;
};

export async function createPost(input: {
  userId: string;
  caption: string;
  visibility: PostVisibility;
  locationName?: string | null;
  commentsEnabled: boolean;
  media: NewPostMedia[];
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const effectiveUserId = authData.user?.id;
  if (authError || !effectiveUserId || effectiveUserId !== input.userId) {
    throw new Error("Verified authentication is required to create a post.");
  }
  if (input.media.length > 10) {
    throw new Error("A post can contain at most 10 media items.");
  }
  if (!input.media.length && !input.caption.trim()) {
    throw new Error("Add a caption or media before posting.");
  }

  const uploadedPaths: string[] = [];
  try {
    const media: Array<{
      mediaUrl: string;
      mediaType: "image" | "video";
      width?: number | null;
      height?: number | null;
    }> = [];
    for (const item of input.media) {
      const { data, error } = await supabase.storage.from("post-media").upload(
        `${effectiveUserId}/${crypto.randomUUID()}`,
        item.file,
        { contentType: item.file.type, upsert: false },
      );
      if (error || !data?.path) throw error || new Error("Media upload returned no storage path.");
      uploadedPaths.push(data.path);
      media.push({
        mediaUrl: data.path,
        mediaType: item.mediaType,
        width: item.width ?? null,
        height: item.height ?? null,
      });
    }

    const payload = await apiRequest<{ post?: { id?: string } }>("/api/v1/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caption: input.caption.trim(),
        visibility: input.visibility,
        locationName: input.locationName?.trim() || null,
        commentsEnabled: input.commentsEnabled,
        media,
      }),
    });
    if (!payload.post?.id) throw new Error("The API did not return the created post.");
    return payload.post.id;
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from("post-media").remove(uploadedPaths).catch(() => undefined);
    }
    throw error;
  }
}

export async function deletePost(postId: string, requestingUserId?: string) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user?.id || (requestingUserId && requestingUserId !== authData.user.id)) {
    throw new Error("Verified authentication is required to delete a post.");
  }
  await apiRequest<{ success: boolean }>(`/api/v1/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });
}

export function formatCount(value: number) {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}m`;
}

export function timeAgo(iso: string) {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return `${Math.floor(days / 30)}mo`;
}
