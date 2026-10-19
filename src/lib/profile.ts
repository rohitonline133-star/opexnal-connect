import { authClient } from "@/lib/auth-client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Read the authenticated user's profile from the configured Supabase project.
 * No seeded/demo profile is returned when the database query fails or has no row.
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  const client = authClient.rawProvider;
  if (!client) throw new Error("Profile database is not configured.");
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user || authData.user.id !== id) {
    throw new Error("You are not authorized to read this profile.");
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}
