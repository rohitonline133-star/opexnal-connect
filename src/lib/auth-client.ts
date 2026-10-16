import { createClient, type Session, type User } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  user_metadata?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
};

export type AuthSession = {
  token: string;
  access_token: string;
  userId: string;
  user: AuthUser;
  expiresAt: number;
};

type AuthListener = (event: string, session: AuthSession | null) => void;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const supabaseAuth =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

function mapUser(user: User): AuthUser {
  const username =
    typeof user.user_metadata?.username === "string"
      ? user.user_metadata.username
      : (user.email?.split("@")[0] ?? "user");
  const displayName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : username;
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : undefined;

  return {
    id: user.id,
    email: user.email ?? "",
    username,
    displayName,
    ...(avatarUrl ? { avatarUrl } : {}),
    user_metadata: {
      username,
      full_name: displayName,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    },
  };
}

let currentAccessToken = "";

function mapSession(session: Session | null): AuthSession | null {
  currentAccessToken = session?.access_token ?? "";
  if (!session) return null;
  const user = mapUser(session.user);
  return {
    token: session.access_token,
    access_token: session.access_token,
    userId: session.user.id,
    user,
    expiresAt: (session.expires_at ?? 0) * 1000,
  };
}

function unavailableError(): Error {
  return new Error(
    "Opexnal authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment environment.",
  );
}

class AuthClient {
  getAuthHeader(): Record<string, string> {
    // Set by getSession() or the Supabase auth-state listener; never invent tokens.
    return currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {};
  }

  async getUser(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    if (!supabaseAuth) return { data: { user: null }, error: unavailableError() };
    const { data, error } = await supabaseAuth.auth.getUser();
    return {
      data: { user: data.user ? mapUser(data.user) : null },
      error: error ?? null,
    };
  }

  async getSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
    if (!supabaseAuth) return { data: { session: null }, error: unavailableError() };
    const { data, error } = await supabaseAuth.auth.getSession();
    return { data: { session: mapSession(data.session) }, error: error ?? null };
  }

  async signInWithPassword(params: { email?: string; password?: string }): Promise<{
    data: { user: AuthUser; session: AuthSession; requires2fa?: boolean } | null;
    error: Error | null;
  }> {
    if (!supabaseAuth) return { data: null, error: unavailableError() };
    const identity = (params.email ?? "").trim();
    const password = params.password ?? "";
    if (!identity || !password) {
      return { data: null, error: new Error("Email/username and password are required.") };
    }

    let email = identity;
    if (!identity.includes("@")) {
      const { data: profile, error: profileError } = await supabaseAuth
        .from("profiles")
        .select("email")
        .eq("username", identity.toLowerCase())
        .maybeSingle();
      if (profileError || !profile || typeof profile.email !== "string") {
        return { data: null, error: new Error("Invalid email/username or password.") };
      }
      email = profile.email;
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
      return { data: null, error: new Error("Invalid email/username or password.") };
    }
    const session = mapSession(data.session);
    if (!session) return { data: null, error: new Error("Authentication session was not created.") };
    return { data: { user: mapUser(data.user), session }, error: null };
  }

  async signUp(params: {
    email: string;
    password: string;
    options?: { data?: { username?: string; full_name?: string } };
  }): Promise<{
    data: { user: AuthUser; session: AuthSession | null } | null;
    error: Error | null;
  }> {
    if (!supabaseAuth) return { data: null, error: unavailableError() };
    const email = params.email.trim().toLowerCase();
    const username = (params.options?.data?.username ?? email.split("@")[0] ?? "")
      .trim()
      .toLowerCase();
    if (!email.includes("@") || !username) {
      return { data: null, error: new Error("A valid email and username are required.") };
    }

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password: params.password,
      options: {
        data: {
          username,
          full_name: params.options?.data?.full_name ?? username,
        },
      },
    });
    if (error || !data.user) {
      return { data: null, error: error ?? new Error("Account registration failed.") };
    }
    return { data: { user: mapUser(data.user), session: mapSession(data.session) }, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    if (!supabaseAuth) return { error: unavailableError() };
    const { error } = await supabaseAuth.auth.signOut();
    return { error: error ?? null };
  }

  onAuthStateChange(callback: AuthListener) {
    if (!supabaseAuth) {
      return { data: { subscription: { unsubscribe: () => undefined } } };
    }
    const { data } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      callback(event, mapSession(session));
    });
    return { data: { subscription: data.subscription } };
  }
}

export const authClient = new AuthClient();
export const isSupabaseAuthConfigured = Boolean(supabaseAuth);
