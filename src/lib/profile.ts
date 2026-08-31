import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfileById(id: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (data) return data;
  } catch {
    // ignore query error
  }

  if (typeof window !== "undefined") {
    try {
      const raw =
        localStorage.getItem("guest_user") || localStorage.getItem("opexnal_guest_user");
      if (raw) {
        const guest = JSON.parse(raw);
        if (guest?.id === id || id.startsWith("guest_") || id.startsWith("usr_")) {
          return {
            id,
            username: guest.user_metadata?.username || "guest_creator",
            display_name: guest.user_metadata?.display_name || "Guest Explorer",
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

  return null;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
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
