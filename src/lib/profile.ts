import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const SEED_PROFILES: Record<string, Profile> = {
  user_maya: {
    id: "user_maya",
    username: "maya_codes",
    display_name: "Maya Chen",
    bio: "Building next-gen social interfaces 💻✨ Coffee, code & community.",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    website: "https://opexnal.com/@maya_codes",
    is_verified: true,
    is_private: false,
    followers_count: 1420,
    following_count: 320,
    posts_count: 24,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } as Profile,
  user_zenith: {
    id: "user_zenith",
    username: "zenith_design",
    display_name: "Zenith Creative",
    bio: "Digital Art, 3D explorations & UI motion drops 🎨",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    website: "https://zenith.design",
    is_verified: true,
    is_private: false,
    followers_count: 3890,
    following_count: 145,
    posts_count: 48,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } as Profile,
  user_alex: {
    id: "user_alex",
    username: "alex_adventures",
    display_name: "Alex Rivers",
    bio: "Alpine explorer & nature photographer 🏔️ Capturing raw earth.",
    avatar_url:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    website: null,
    is_verified: true,
    is_private: false,
    followers_count: 2540,
    following_count: 410,
    posts_count: 36,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } as Profile,
  user_rohit: {
    id: "user_rohit",
    username: "rohit_visuals",
    display_name: "Rohit Sharma",
    bio: "Visual storyteller & tech creator 📸 Connecting people through creativity.",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    website: null,
    is_verified: true,
    is_private: false,
    followers_count: 1820,
    following_count: 290,
    posts_count: 19,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } as Profile,
};

export async function getProfileById(id: string) {
  if (SEED_PROFILES[id]) {
    return SEED_PROFILES[id];
  }

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) return data;
  } catch {
    // ignore query error
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("guest_user") || localStorage.getItem("opexnal_guest_user");
      if (raw) {
        const guest = JSON.parse(raw);
        if (guest?.id === id || id.startsWith("guest_") || id.startsWith("usr_") || !id) {
          const custom = guest.profile || {};
          return {
            id: id || guest.id || "usr_preview_creator",
            username: custom.username || guest.user_metadata?.username || "creator",
            display_name:
              custom.display_name || guest.user_metadata?.display_name || "Opexnal Creator",
            bio: custom.bio !== undefined ? custom.bio : "Exploring Opexnal in Guest Mode 🚀",
            avatar_url: custom.avatar_url || null,
            website: custom.website || null,
            is_verified: custom.is_verified ?? true,
            is_private: custom.is_private ?? false,
            show_activity_status: custom.show_activity_status ?? true,
            allow_tags_from: custom.allow_tags_from || "everyone",
            allow_mentions_from: custom.allow_mentions_from || "everyone",
            account_type: custom.account_type || "creator",
            location: custom.location || "India",
            phone: custom.phone || null,
            followers_count: custom.followers_count ?? 142,
            following_count: custom.following_count ?? 88,
            posts_count: custom.posts_count ?? 3,
            created_at: custom.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as Profile;
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    id,
    username: "creator",
    display_name: "Opexnal Creator",
    bio: "Exploring Opexnal 🚀",
    avatar_url: null,
    website: null,
    is_verified: true,
    is_private: false,
    show_activity_status: true,
    allow_tags_from: "everyone",
    allow_mentions_from: "everyone",
    account_type: "creator",
    location: "India",
    phone: null,
    followers_count: 142,
    following_count: 88,
    posts_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Profile;
}

export async function getProfileByUsername(username: string) {
  const normalized = username.toLowerCase();
  for (const profile of Object.values(SEED_PROFILES)) {
    if (profile.username.toLowerCase() === normalized) {
      return profile;
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("guest_user") || localStorage.getItem("opexnal_guest_user");
      if (raw) {
        const guest = JSON.parse(raw);
        if (guest?.user_metadata?.username?.toLowerCase() === normalized) {
          return {
            id: guest.id,
            username: guest.user_metadata.username,
            display_name: guest.user_metadata.display_name || "Guest Explorer",
            bio: "Exploring Opexnal in Guest Mode 🚀",
            avatar_url: null,
            website: null,
            is_verified: true,
            is_private: false,
            followers_count: 142,
            following_count: 88,
            posts_count: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", normalized)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  } catch {
    // ignore query error
  }

  return null;
}

/** Avatars live in a private bucket; resolve a short-lived signed URL. */
export async function resolveAvatarUrl(path: string | null | undefined) {
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
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export function initialsFor(profile: Pick<Profile, "display_name" | "username">) {
  const source = profile.display_name?.trim() || profile.username;
  return source.slice(0, 2).toUpperCase();
}

export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;
