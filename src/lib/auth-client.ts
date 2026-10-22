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

const AUTH_USER_KEY = "opexnal_auth_user";
const AUTH_SESSION_KEY = "opexnal_auth_session";

export const DEFAULT_USER: AuthUser = {
  id: "user_maya",
  email: "maya@opexnal.local",
  username: "maya_codes",
  displayName: "Maya Chen",
  avatarUrl:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  user_metadata: {
    username: "maya_codes",
    full_name: "Maya Chen",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
};

export const DEFAULT_SESSION: AuthSession = {
  token: "opexnal_demo_jwt_token_user_maya",
  access_token: "opexnal_demo_jwt_token_user_maya",
  userId: "user_maya",
  user: DEFAULT_USER,
  expiresAt: 1893456000000,
};

type AuthListener = (event: string, session: AuthSession | null) => void;

class AuthClient {
  private listeners: Set<AuthListener> = new Set();
  private memorySession: AuthSession | null = null;
  private memoryUser: AuthUser | null = null;

  constructor() {
    this.memoryUser = null;
    this.memorySession = null;
    // Previously persisted client-generated tokens are not proof of identity.
    // Clear them instead of restoring an unverified local session.
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_SESSION_KEY);
      } catch {
        // Storage may be unavailable; authentication still fails closed.
      }
    }
  }

  setSession(session: AuthSession | null) {
    this.memorySession = session;
    this.memoryUser = session ? session.user : null;
    if (typeof window !== "undefined") {
      try {
        if (session) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        } else {
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      } catch {
        // storage quota
      }
    }
    this.notify(session ? "SIGNED_IN" : "SIGNED_OUT", session);
  }

  private notify(event: string, session: AuthSession | null) {
    for (const listener of this.listeners) {
      try {
        listener(event, session);
      } catch (err) {
        console.error("[AuthClient] Listener error:", err);
      }
    }
  }

  getAuthHeader(): Record<string, string> {
    const session = this.memorySession;
    if (session?.token) {
      return { Authorization: `Bearer ${session.token}` };
    }
    return {};
  }

  async getUser(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    return {
      data: { user: this.memoryUser },
      error: null,
    };
  }

  async getSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
    return {
      data: { session: this.memorySession },
      error: null,
    };
  }

  async signInWithPassword(_params: { email?: string; password?: string }): Promise<{
    data: { user: AuthUser; session: AuthSession; requires2fa?: boolean } | null;
    error: Error | null;
  }> {
    return { data: null, error: new Error("Secure login is not configured. No session was created.") };
  }

  async signUp(_params: {
    email: string;
    password: string;
    options?: { data?: { username?: string; full_name?: string } };
  }): Promise<{
    data: { user: AuthUser; session: AuthSession } | null;
    error: Error | null;
  }> {
    return { data: null, error: new Error("Secure signup is not configured. No account or session was created.") };
  }

  async signOut(): Promise<{ error: Error | null }> {
    this.memoryUser = null;
    this.memorySession = null;

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_SESSION_KEY);
      } catch {
        // ignore
      }
    }

    this.notify("SIGNED_OUT", null);
    return { error: null };
  }

  onAuthStateChange(callback: AuthListener) {
    this.listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }
}

export const authClient = new AuthClient();
