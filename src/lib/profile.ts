import { supabase } from "@/integrations/supabase/client";
import { authClient } from "@/lib/auth-client";
import type { Database } from "@/integrations/supabase/types";
import { apiUrl } from "@/lib/api-client";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Demo identities are intentionally disabled. Profiles must come from the authenticated API.

async function fetchApiProfile(path: string): Promise<Profile | null> {
  const response = await fetch(apiUrl(path), {
    headers: authClient.getAuthHeader(),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  const payload = (await response.json().catch(() => ({}))) as {
    profile?: Profile;
    error?: string;
  };
  if (!response.ok) throw new Error(payload.error || "Profile request failed.");
  return payload.profile || null;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!id) return null;
  return fetchApiProfile(`/api/v1/users/id/${encodeURIComponent(id)}`);
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const clean = username.trim().toLowerCase();
  if (!clean) return null;
  try {
    return await fetchApiProfile(`/api/v1/users/${encodeURIComponent(clean)}`);
  } catch {
    return null;
  }
}

/** Resolve first-party avatar paths to a short-lived URL. */
export async function resolveAvatarUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  if (path.startsWith("/api/v1/storage/public/")) return path;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 300);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export function initialsFor(profile: Pick<Profile, "display_name" | "username">) {
  const source = profile.display_name?.trim() || profile.username;
  return source.slice(0, 2).toUpperCase();
}

export const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;
