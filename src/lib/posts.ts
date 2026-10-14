import { supabase } from "@/integrations/supabase/client";
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

export async function resolveMediaUrl(path: string, expiresIn = 3600) {
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
    const { data } = await supabase.storage.from("post-media").createSignedUrl(path, expiresIn);
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
export async function getHomeFeed(
  viewerId: string,
  cursor?: string | null,
  limit = FEED_PAGE_SIZE,
) {
  try {
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId);

    const followingRows = (following ?? []) as Array<{ following_id: string }>;
    const ids = [viewerId, ...followingRows.map((f) => f.following_id)];

    let query = supabase
      .from("posts")
      .select(POST_SELECT)
      .in("user_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const items = await decorate((data ?? []) as never, viewerId);
      const local = getLocalPosts();
      const combined = decorateWithLocalState([...local, ...items], viewerId);
      const last = combined[combined.length - 1];
      return {
        items: combined.slice(0, limit),
        nextCursor: combined.length >= limit && last ? last.created_at : null,
      };
    }
  } catch {
    // fallback to seed
  }

  const allFallback = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
  const sliced = cursor ? allFallback.filter((p) => p.created_at < cursor) : allFallback;
  const items = sliced.slice(0, limit);
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: items.length === limit && last ? last.created_at : null,
  };
}

/** Explore: recent public posts from everyone visible to the viewer. */
export async function getExploreFeed(viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(60);
    if (!error && data && data.length > 0) {
      const remote = await decorate(data as never, viewerId);
      return decorateWithLocalState([...getLocalPosts(), ...remote], viewerId);
    }
  } catch {
    // fallback
  }

  return decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
}

/** Reels: recent posts whose media includes a video, visible to the viewer. */
export async function getReelsFeed(viewerId: string, limit = 30) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(120);
    if (!error && data && data.length > 0) {
      const items = await decorate(data as never, viewerId);
      const videoItems = items.filter((p) => p.media.some((m) => m.media_type === "video"));
      if (videoItems.length > 0) {
        return decorateWithLocalState([...getLocalPosts(), ...videoItems], viewerId).slice(
          0,
          limit,
        );
      }
    }
  } catch {
    // fallback
  }

  const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
  return all.filter((p) => p.media.some((m) => m.media_type === "video")).slice(0, limit);
}

export async function getPostsByUser(userId: string, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      const remote = await decorate(data as never, viewerId);
      const local = getLocalPosts().filter((p) => p.user_id === userId);
      return decorateWithLocalState([...local, ...remote], viewerId);
    }
  } catch {
    // fallback
  }

  const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
  return all.filter((p) => p.user_id === userId);
}

export const GRID_PAGE_SIZE = 18;

/** Paginated posts for a profile grid; RLS decides what is visible. */
export async function getUserPostsPage(
  userId: string,
  viewerId?: string | null,
  cursor?: string | null,
  limit = GRID_PAGE_SIZE,
) {
  try {
    let query = supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const items = await decorate(data as never, viewerId);
      const local = getLocalPosts().filter((p) => p.user_id === userId);
      const combined = decorateWithLocalState([...local, ...items], viewerId);
      const last = combined[combined.length - 1];
      return {
        items: combined,
        nextCursor: combined.length === limit && last ? last.created_at : null,
      };
    }
  } catch {
    // fallback
  }

  const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId).filter(
    (p) => p.user_id === userId,
  );
  const sliced = cursor ? all.filter((p) => p.created_at < cursor) : all;
  const items = sliced.slice(0, limit);
  const last = items[items.length - 1];
  return { items, nextCursor: items.length === limit && last ? last.created_at : null };
}

export async function getSavedPosts(viewerId: string) {
  try {
    const { data: saves } = await supabase
      .from("post_saves")
      .select("post_id")
      .eq("user_id", viewerId)
      .order("created_at", { ascending: false });
    const saveRows = (saves ?? []) as Array<{ post_id: string }>;
    const ids = saveRows.map((s) => s.post_id);
    if (ids.length > 0) {
      const { data, error } = await supabase.from("posts").select(POST_SELECT).in("id", ids);
      if (!error && data) {
        return decorate(data as never, viewerId);
      }
    }
  } catch {
    // fallback
  }

  const localSavedIds = getLocalSaves();
  const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
  return all.filter((p) => localSavedIds.has(p.id));
}

export async function getPost(postId: string, viewerId?: string | null) {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("id", postId)
      .maybeSingle();
    if (!error && data) {
      const [post] = await decorate([data as never], viewerId);
      return post ?? null;
    }
  } catch {
    // fallback
  }

  const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
  return all.find((p) => p.id === postId) ?? null;
}

export async function getPostsByHashtag(tag: string, viewerId?: string | null) {
  try {
    const { data: hashtag } = await supabase
      .from("hashtags")
      .select("id")
      .eq("tag", tag.toLowerCase())
      .maybeSingle();
    if (hashtag) {
      const { data: links } = await supabase
        .from("post_hashtags")
        .select("post_id")
        .eq("hashtag_id", hashtag.id);
      const linkRows = (links ?? []) as Array<{ post_id: string }>;
      const ids = linkRows.map((l) => l.post_id);
      if (ids.length > 0) {
        const { data, error } = await supabase
          .from("posts")
          .select(POST_SELECT)
          .in("id", ids)
          .order("created_at", { ascending: false });
        if (!error && data) {
          return decorate(data as never, viewerId);
        }
      }
    }
  } catch {
    // fallback
  }

  const targetTag = tag.toLowerCase();
  const all = decorateWithLocalState([...getLocalPosts(), ...SEED_POSTS], viewerId);
  return all.filter((p) => extractHashtags(p.caption).includes(targetTag));
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  setLocalLike(postId, !liked);
  try {
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    }
  } catch {
    // handled locally
  }
}

export async function toggleSave(postId: string, userId: string, saved: boolean) {
  setLocalSave(postId, !saved);
  try {
    if (saved) {
      await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
    } else {
      await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
    }
  } catch {
    // handled locally
  }
}

export async function recordShare(postId: string, userId: string, channel = "link") {
  try {
    await supabase.from("post_shares").insert({ post_id: postId, user_id: userId, channel });
  } catch {
    // ignore
  }
}

export type CommentWithAuthor = CommentRow & { author: FeedAuthor | null; liked: boolean };

const memoryCommentsStore = new Map<string, CommentWithAuthor[]>();

export async function getComments(postId: string, viewerId?: string | null) {
  let localComments: CommentWithAuthor[] = memoryCommentsStore.get(postId) || [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`${LOCAL_COMMENTS_KEY}_${postId}`);
      if (raw) localComments = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!error && data && data.length > 0) {
      const rows = data as unknown as CommentRow[];
      const [profilesRes, likesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, is_verified")
          .in("id", Array.from(new Set(rows.map((r) => r.user_id)))),
        viewerId
          ? supabase
              .from("comment_likes")
              .select("comment_id")
              .eq("user_id", viewerId)
              .in(
                "comment_id",
                rows.map((r) => r.id),
              )
          : Promise.resolve({ data: [] as { comment_id: string }[] }),
      ]);

      const authors = new Map(
        ((profilesRes.data ?? []) as FeedAuthor[]).map((p: FeedAuthor) => [p.id, p]),
      );
      const liked = new Set(
        ((likesRes.data ?? []) as Array<{ comment_id: string }>).map((r) => r.comment_id),
      );

      const remoteDecorated = rows.map((row: CommentRow): CommentWithAuthor => ({
        ...row,
        author: authors.get(row.user_id) ?? null,
        liked: liked.has(row.id),
      }));
      return [...remoteDecorated, ...localComments];
    }
  } catch {
    // fallback
  }

  return localComments;
}

export async function addComment(input: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}): Promise<CommentWithAuthor> {
  const newComment: CommentWithAuthor = {
    id: `local_comment_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    post_id: input.postId,
    user_id: input.userId,
    body: input.body.trim(),
    parent_id: input.parentId ?? null,
    likes_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: {
      id: input.userId,
      username: "you",
      display_name: "You",
      avatar_url: null,
      is_verified: false,
    },
    liked: false,
  };

  const currentMem = memoryCommentsStore.get(input.postId) || [];
  currentMem.push(newComment);
  memoryCommentsStore.set(input.postId, currentMem);

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`${LOCAL_COMMENTS_KEY}_${input.postId}`);
      const current: CommentWithAuthor[] = raw ? JSON.parse(raw) : [];
      current.push(newComment);
      localStorage.setItem(`${LOCAL_COMMENTS_KEY}_${input.postId}`, JSON.stringify(current));
    } catch {
      // ignore
    }
  }

  try {
    await supabase.from("post_comments").insert({
      post_id: input.postId,
      user_id: input.userId,
      body: input.body.trim(),
      parent_id: input.parentId ?? null,
    });
  } catch {
    // handled locally
  }

  return newComment;
}

export async function deleteComment(commentId: string) {
  try {
    await supabase.from("post_comments").delete().eq("id", commentId);
  } catch {
    // ignore
  }
}

export async function toggleCommentLike(commentId: string, userId: string, liked: boolean) {
  try {
    if (liked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userId);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: userId });
    }
  } catch {
    // ignore
  }
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
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData.user?.id || input.userId;
  if (!effectiveUserId) {
    throw new Error("Authentication required to create a post");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: effectiveUserId,
      caption: input.caption.trim(),
      visibility: input.visibility,
      location_name: input.locationName?.trim() || null,
      comments_enabled: input.commentsEnabled,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  try {
    const rows: Database["public"]["Tables"]["post_media"]["Insert"][] = [];
    for (const [index, item] of input.media.entries()) {
      const ext =
        item.file.name.split(".").pop()?.toLowerCase() ||
        (item.mediaType === "video" ? "mp4" : "jpg");
      const path = `${effectiveUserId}/${post.id}/${index}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, item.file, { contentType: item.file.type, upsert: false });
      if (uploadError) throw uploadError;
      rows.push({
        post_id: post.id,
        user_id: effectiveUserId,
        storage_path: path,
        media_type: item.mediaType,
        width: item.width ?? null,
        height: item.height ?? null,
        position: index,
      });
    }
    if (rows.length > 0) {
      const { error: mediaError } = await supabase.from("post_media").insert(rows);
      if (mediaError) throw mediaError;
    }
    return post.id;
  } catch (err) {
    await supabase.from("posts").delete().eq("id", post.id);
    throw err;
  }
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
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
