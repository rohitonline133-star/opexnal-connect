import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const SEED_PROFILES: Record<string, Profile> = {
  user_maya: {
    id: "user_maya",
    username: "maya_codes",
    display_name: "Maya Chen",
    bio: "Building aesthetic web interfaces & next-gen social platforms ✨ Developer, visual artist & coffee enthusiast.",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    posts_count: 24,
    followers_count: 14200,
    following_count: 382,
    is_verified: true,
    is_private: false,
    is_deactivated: false,
    website: "https://mayachen.design",
    location: "Bengaluru, India",
    locale: "en",
    timezone: "Asia/Kolkata",
    account_type: "creator",
    allow_mentions_from: "everyone",
    allow_tags_from: "everyone",
    show_activity_status: true,
    country_code: "IN",
    last_active_at: "2026-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  user_zenith: {
    id: "user_zenith",
    username: "zenith_design",
    display_name: "Zenith Creative",
    bio: "3D Design Studio & Motion graphics laboratory. Exploring fluid forms and spatial UI.",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    posts_count: 18,
    followers_count: 28500,
    following_count: 194,
    is_verified: true,
    is_private: false,
    is_deactivated: false,
    website: "https://zenithcreative.xyz",
    location: "Tokyo, Japan",
    locale: "en",
    timezone: "Asia/Tokyo",
    account_type: "business",
    allow_mentions_from: "everyone",
    allow_tags_from: "everyone",
    show_activity_status: true,
    country_code: "JP",
    last_active_at: "2026-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  user_alex: {
    id: "user_alex",
    username: "alex_adventures",
    display_name: "Alex Rivers",
    bio: "Outdoor explorer, documentary photographer, capturing untouched wilderness.",
    avatar_url:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    posts_count: 45,
    followers_count: 9800,
    following_count: 420,
    is_verified: true,
    is_private: false,
    is_deactivated: false,
    website: null,
    location: "Reykjavik, Iceland",
    locale: "en",
    timezone: "Atlantic/Reykjavik",
    account_type: "personal",
    allow_mentions_from: "everyone",
    allow_tags_from: "everyone",
    show_activity_status: true,
    country_code: "IS",
    last_active_at: "2026-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  user_rohit: {
    id: "user_rohit",
    username: "rohit_visuals",
    display_name: "Rohit Sharma",
    bio: "Cinematographer & Colorist based in Mumbai. High-octane visual storytelling.",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    posts_count: 31,
    followers_count: 18300,
    following_count: 512,
    is_verified: true,
    is_private: false,
    is_deactivated: false,
    website: "https://rohitvisuals.com",
    location: "Mumbai, India",
    locale: "en",
    timezone: "Asia/Kolkata",
    account_type: "creator",
    allow_mentions_from: "everyone",
    allow_tags_from: "everyone",
    show_activity_status: true,
    country_code: "IN",
    last_active_at: "2026-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from<Profile>("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  } catch {
    // ignore query error
  }

  if (SEED_PROFILES[id]) {
    return SEED_PROFILES[id];
  }

  // Generic fallback profile if unknown id
  const name = id.replace(/^user_/, "").replace(/_/g, " ");
  return {
    id,
    username: id.replace(/^user_/, ""),
    display_name: name.charAt(0).toUpperCase() + name.slice(1),
    bio: "Creator on Opexnal Connect",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    posts_count: 0,
    followers_count: 0,
    following_count: 0,
    is_verified: false,
    is_private: false,
    is_deactivated: false,
    website: null,
    location: null,
    locale: "en",
    timezone: "UTC",
    account_type: "personal",
    allow_mentions_from: "everyone",
    allow_tags_from: "everyone",
    show_activity_status: true,
    country_code: null,
    last_active_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const clean = username.toLowerCase();
  try {
    const { data, error } = await supabase
      .from<Profile>("profiles")
      .select("*")
      .eq("username", clean)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  } catch {
    // ignore
  }

  for (const profile of Object.values(SEED_PROFILES)) {
    if (profile.username.toLowerCase() === clean) {
      return profile;
    }
  }

  return null;
}

/** Avatars live in a private bucket; resolve a short-lived signed URL. */
export async function resolveAvatarUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function initialsFor(profile: Pick<Profile, "display_name" | "username">) {
  const source = profile.display_name?.trim() || profile.username;
  return source.slice(0, 2).toUpperCase();
}

export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;
