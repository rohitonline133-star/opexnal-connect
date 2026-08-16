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
  const { data } = await supabase.storage.from("post-media").createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

async function decorate(rows: (PostRow & { post_media: PostMediaRow[] })[], viewerId?: string | null) {
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

  const authors = new Map((profilesRes.data ?? []).map((p) => [p.id, p as FeedAuthor]));
  const liked = new Set((likesRes.data ?? []).map((r) => r.post_id));
  const saved = new Set((savesRes.data ?? []).map((r) => r.post_id));

  return rows.map<FeedPost>(({ post_media, ...post }) => ({
    ...post,
    media: [...(post_media ?? [])].sort((a, b) => a.position - b.position),
    author: authors.get(post.user_id) ?? null,
    liked: liked.has(post.id),
    saved: saved.has(post.id),
  }));
}

export const FEED_PAGE_SIZE = 10;

/** Home feed: posts from people the viewer follows, plus their own. */
export async function getHomeFeed(viewerId: string, cursor?: string | null, limit = FEED_PAGE_SIZE) {
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerId);

  const ids = [viewerId, ...(following ?? []).map((f) => f.following_id)];

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;
  const items = await decorate((data ?? []) as never, viewerId);
  const last = items[items.length - 1];
  return {
    items,
    nextCursor: items.length === limit && last ? last.created_at : null,
  };
}


/** Explore: recent public posts from everyone visible to the viewer. */
export async function getExploreFeed(viewerId?: string | null) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return decorate((data ?? []) as never, viewerId);
}

export async function getPostsByUser(userId: string, viewerId?: string | null) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return decorate((data ?? []) as never, viewerId);
}

export async function getSavedPosts(viewerId: string) {
  const { data: saves } = await supabase
    .from("post_saves")
    .select("post_id")
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false });
  const ids = (saves ?? []).map((s) => s.post_id);
  if (ids.length === 0) return [] as FeedPost[];
  const { data, error } = await supabase.from("posts").select(POST_SELECT).in("id", ids);
  if (error) throw error;
  return decorate((data ?? []) as never, viewerId);
}

export async function getPost(postId: string, viewerId?: string | null) {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", postId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [post] = await decorate([data as never], viewerId);
  return post ?? null;
}

export async function getPostsByHashtag(tag: string, viewerId?: string | null) {
  const { data: hashtag } = await supabase
    .from("hashtags")
    .select("id")
    .eq("tag", tag.toLowerCase())
    .maybeSingle();
  if (!hashtag) return [] as FeedPost[];
  const { data: links } = await supabase
    .from("post_hashtags")
    .select("post_id")
    .eq("hashtag_id", hashtag.id);
  const ids = (links ?? []).map((l) => l.post_id);
  if (ids.length === 0) return [] as FeedPost[];
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return decorate((data ?? []) as never, viewerId);
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleSave(postId: string, userId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function recordShare(postId: string, userId: string, channel = "link") {
  const { error } = await supabase
    .from("post_shares")
    .insert({ post_id: postId, user_id: userId, channel });
  if (error) throw error;
}

export type CommentWithAuthor = CommentRow & { author: FeedAuthor | null; liked: boolean };

export async function getComments(postId: string, viewerId?: string | null) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [] as CommentWithAuthor[];

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
          .in("comment_id", rows.map((r) => r.id))
      : Promise.resolve({ data: [] as { comment_id: string }[] }),
  ]);

  const authors = new Map((profilesRes.data ?? []).map((p) => [p.id, p as FeedAuthor]));
  const liked = new Set((likesRes.data ?? []).map((r) => r.comment_id));

  return rows.map<CommentWithAuthor>((row) => ({
    ...row,
    author: authors.get(row.user_id) ?? null,
    liked: liked.has(row.id),
  }));
}

export async function addComment(input: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}) {
  const { error } = await supabase.from("post_comments").insert({
    post_id: input.postId,
    user_id: input.userId,
    body: input.body.trim(),
    parent_id: input.parentId ?? null,
  });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function toggleCommentLike(commentId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: userId });
    if (error) throw error;
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
  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      user_id: input.userId,
      caption: input.caption.trim(),
      visibility: input.visibility,
      location_name: input.locationName?.trim() || null,
      comments_enabled: input.commentsEnabled,
    })
    .select("id")
    .single();
  if (error) throw error;

  try {
    const rows: Database["public"]["Tables"]["post_media"]["Insert"][] = [];
    for (const [index, item] of input.media.entries()) {
      const ext = item.file.name.split(".").pop()?.toLowerCase() || (item.mediaType === "video" ? "mp4" : "jpg");
      const path = `${input.userId}/${post.id}/${index}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(path, item.file, { contentType: item.file.type, upsert: false });
      if (uploadError) throw uploadError;
      rows.push({
        post_id: post.id,
        user_id: input.userId,
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
  } catch (err) {
    await supabase.from("posts").delete().eq("id", post.id);
    throw err;
  }

  return post.id;
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
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
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
