import { createClient, type Session as SupabaseSession, type User as SupabaseUser } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  user_metadata?: { username?: string; full_name?: string; display_name?: string; avatar_url?: string };
};

export type AuthSession = {
  token: string;
  access_token: string;
  userId: string;
  user: AuthUser;
  expiresAt: number;
};

type AuthListener = (event: string, session: AuthSession | null) => void;

const env = import.meta.env as Record<string, string | boolean | undefined>;
const supabaseUrl = String(env["VITE_SUPABASE_URL"] || "");
const supabaseAnonKey = String(env["VITE_SUPABASE_ANON_KEY"] || env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "");

const provider = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

function configurationError(): Error {
  return new Error(
    "Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in the app environment, then rebuild and redeploy.",
  );
}

function mapUser(user: SupabaseUser): AuthUser {
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || "",
    username: String(metadata.username || ""),
    displayName: String(metadata.display_name || metadata.full_name || metadata.username || ""),
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
    user_metadata: {
      username: typeof metadata.username === "string" ? metadata.username : undefined,
      full_name: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
      display_name: typeof metadata.display_name === "string" ? metadata.display_name : undefined,
      avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
    },
  };
}

function mapSession(session: SupabaseSession | null): AuthSession | null {
  if (!session) return null;
  const user = mapUser(session.user);
  return {
    token: session.access_token,
    access_token: session.access_token,
    userId: session.user.id,
    user,
    expiresAt: (session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600)) * 1000,
  };
}

class AuthClient {
  private listeners = new Set<AuthListener>();
  private currentSession: AuthSession | null = null;

  constructor() {
    if (provider) {
      provider.auth.onAuthStateChange((event, session) => {
        this.currentSession = mapSession(session);
        for (const listener of this.listeners) {
          try { listener(event, this.currentSession); } catch (error) {
            console.error("[AuthClient] Listener error", error);
          }
        }
      });
    }
  }

  setSession(session: AuthSession | null) {
    // Only sessions returned by Supabase are trusted. Arbitrary callers cannot install sessions.
    if (session && !provider) return;
    this.currentSession = session;
  }

  getAuthHeader(): Record<string, string> {
    return this.currentSession?.access_token
      ? { Authorization: `Bearer ${this.currentSession.access_token}` }
      : {};
  }

  async getUser() {
    if (!provider) return { data: { user: null }, error: configurationError() };
    const { data, error } = await provider.auth.getUser();
    return { data: { user: data.user ? mapUser(data.user) : null }, error };
  }

  async getSession() {
    if (!provider) return { data: { session: null }, error: configurationError() };
    const { data, error } = await provider.auth.getSession();
    this.currentSession = mapSession(data.session);
    return { data: { session: this.currentSession }, error };
  }

  async signInWithPassword(params: { email?: string; password?: string }) {
    if (!provider) return { data: null, error: configurationError() };
    const identity = (params.email || "").trim();
    if (!identity || !params.password) {
      return { data: null, error: new Error("Email and password are required") };
    }
    if (!identity.includes("@")) {
      return { data: null, error: new Error("Sign in with your registered email address. Username login requires a verified server-side username lookup.") };
    }
    const { data, error } = await provider.auth.signInWithPassword({
      email: identity,
      password: params.password,
    });
    if (error || !data.user || !data.session) return { data: null, error: error || new Error("Authentication did not return a valid session") };
    this.currentSession = mapSession(data.session);
    return {
      data: {
        user: mapUser(data.user),
        session: this.currentSession!,
      },
      error: null,
    };
  }

  async signUp(params: {
    email: string;
    password: string;
    options?: { data?: { username?: string; full_name?: string; display_name?: string } };
  }) {
    if (!provider) return { data: null, error: configurationError() };
    const email = params.email.trim().toLowerCase();
    const username = (params.options?.data?.username || "").trim().toLowerCase();
    const displayName = (params.options?.data?.display_name || params.options?.data?.full_name || username).trim();
    if (!email || !email.includes("@")) return { data: null, error: new Error("Enter a valid email address") };
    if (!/^[a-z0-9._]{3,30}$/.test(username)) return { data: null, error: new Error("Username must be 3–30 characters using lowercase letters, numbers, dots, or underscores") };
    const { data, error } = await provider.auth.signUp({
      email,
      password: params.password,
      options: { data: { username, display_name: displayName, full_name: displayName } },
    });
    if (error || !data.user) return { data: null, error: error || new Error("The provider did not create an account") };
    this.currentSession = mapSession(data.session);
    return { data: { user: mapUser(data.user), session: this.currentSession }, error: null };
  }

  async resetPasswordForEmail(email: string, redirectTo?: string) {
    if (!provider) return { error: configurationError() };
    return provider.auth.resetPasswordForEmail(email.trim(), redirectTo ? { redirectTo } : undefined);
  }

  async updatePassword(password: string) {
    if (!provider) return { data: null, error: configurationError() };
    return provider.auth.updateUser({ password });
  }

  async signOut() {
    if (!provider) {
      this.currentSession = null;
      return { error: configurationError() };
    }
    const { error } = await provider.auth.signOut({ scope: "local" });
    if (!error) this.currentSession = null;
    return { error };
  }

  onAuthStateChange(callback: AuthListener) {
    this.listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => this.listeners.delete(callback) } } };
  }

  get providerConfigured() {
    return Boolean(provider);
  }

  get rawProvider() {
    return provider;
  }
}

export const authClient = new AuthClient();
