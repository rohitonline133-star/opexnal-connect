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
  private memorySession: AuthSession | null = DEFAULT_SESSION;
  private memoryUser: AuthUser | null = DEFAULT_USER;

  constructor() {
    this.memoryUser = DEFAULT_USER;
    this.memorySession = DEFAULT_SESSION;
    if (typeof window !== "undefined") {
      try {
        const storedSession = localStorage.getItem(AUTH_SESSION_KEY);
        const storedUser = localStorage.getItem(AUTH_USER_KEY);
        if (storedSession && storedUser) {
          this.memorySession = JSON.parse(storedSession);
          this.memoryUser = JSON.parse(storedUser);
        } else {
          // Initialize with default demo session for rich interactive preview
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(DEFAULT_USER));
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(DEFAULT_SESSION));
        }
      } catch {
        this.memoryUser = DEFAULT_USER;
        this.memorySession = DEFAULT_SESSION;
      }
    }
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

  async signInWithPassword(params: { email?: string; password?: string }): Promise<{
    data: { user: AuthUser; session: AuthSession; requires2fa?: boolean } | null;
    error: Error | null;
  }> {
    const emailOrUsername = (params.email || "").trim();
    if (!emailOrUsername) {
      return { data: null, error: new Error("Email or username is required") };
    }

    const username = emailOrUsername.includes("@")
      ? emailOrUsername.split("@")[0] || "user"
      : emailOrUsername;
    const userId = `user_${username.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;

    const user: AuthUser = {
      id: userId,
      email: emailOrUsername.includes("@") ? emailOrUsername : `${username}@opexnal.local`,
      username,
      displayName: username
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      user_metadata: {
        username,
        full_name: username,
      },
    };

    const session: AuthSession = {
      token: `opexnal_jwt_${Date.now()}_${userId}`,
      access_token: `opexnal_jwt_${Date.now()}_${userId}`,
      userId,
      user,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    this.memoryUser = user;
    this.memorySession = session;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      } catch {
        // storage quota
      }
    }

    this.notify("SIGNED_IN", session);
    return { data: { user, session }, error: null };
  }

  async signUp(params: {
    email: string;
    password: string;
    options?: { data?: { username?: string; full_name?: string } };
  }): Promise<{
    data: { user: AuthUser; session: AuthSession } | null;
    error: Error | null;
  }> {
    const email = params.email.trim();
    const rawUsername =
      params.options?.data?.username ||
      (email.includes("@") ? email.split("@")[0] : email) ||
      "user";
    const username = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const displayName = params.options?.data?.full_name || username;
    const userId = `user_${username}_${Date.now().toString(36)}`;

    const user: AuthUser = {
      id: userId,
      email,
      username,
      displayName,
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      user_metadata: {
        username,
        full_name: displayName,
      },
    };

    const session: AuthSession = {
      token: `opexnal_jwt_${Date.now()}_${userId}`,
      access_token: `opexnal_jwt_${Date.now()}_${userId}`,
      userId,
      user,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    this.memoryUser = user;
    this.memorySession = session;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      } catch {
        // storage quota
      }
    }

    this.notify("SIGNED_IN", session);
    return { data: { user, session }, error: null };
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
