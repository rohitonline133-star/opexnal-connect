import { apiUrl } from "@/lib/api-client";

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

type AuthListener = (event: string, session: AuthSession | null) => void;

class AuthClient {
  private listeners: Set<AuthListener> = new Set();
  private memorySession: AuthSession | null = null;
  private memoryUser: AuthUser | null = null;

  constructor() {
    this.memoryUser = null;
    this.memorySession = null;
    if (typeof window === "undefined") return;
    try {
      const storedSession = sessionStorage.getItem(AUTH_SESSION_KEY);
      const storedUser = sessionStorage.getItem(AUTH_USER_KEY);
      if (!storedSession || !storedUser) return;

      const session = JSON.parse(storedSession) as AuthSession;
      const user = JSON.parse(storedUser) as AuthUser;
      const token = session?.token;
      if (
        typeof token !== "string" ||
        !token ||
        token.startsWith("opexnal_demo_") ||
        token.startsWith("opexnal_jwt_") ||
        !session.userId ||
        session.userId !== user.id ||
        !Number.isFinite(session.expiresAt) ||
        session.expiresAt <= Date.now()
      ) {
        sessionStorage.removeItem(AUTH_USER_KEY);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        return;
      }
      this.memorySession = session;
      this.memoryUser = user;
    } catch {
      try {
        sessionStorage.removeItem(AUTH_USER_KEY);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } catch {
        // Storage may be unavailable; the user remains signed out.
      }
    }
  }

  setSession(session: AuthSession | null) {
    this.memorySession = session;
    this.memoryUser = session ? session.user : null;
    if (typeof window !== "undefined") {
      try {
        if (session) {
          sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        } else {
          sessionStorage.removeItem(AUTH_USER_KEY);
          sessionStorage.removeItem(AUTH_SESSION_KEY);
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
    const session = this.memorySession;
    if (!session?.token) return { data: { user: null }, error: null };
    if (session.expiresAt <= Date.now()) {
      await this.signOut();
      return { data: { user: null }, error: new Error("Session expired. Please sign in again.") };
    }

    try {
      const response = await fetch(apiUrl("/api/v1/auth/me"), {
        headers: { Authorization: `Bearer ${session.token}` },
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        await this.signOut();
        return { data: { user: null }, error: new Error("Your session is no longer valid. Please sign in again.") };
      }
      if (!response.ok) {
        return { data: { user: null }, error: new Error("Unable to verify your session with Opexnal's API.") };
      }

      const payload = (await response.json()) as { user?: Partial<AuthUser> & { id?: string } };
      const user = payload.user;
      if (!user || typeof user.id !== "string" || typeof user.username !== "string") {
        await this.signOut();
        return { data: { user: null }, error: new Error("The API returned an invalid user record.") };
      }
      const verifiedUser: AuthUser = {
        id: user.id,
        email: typeof user.email === "string" ? user.email : "",
        username: user.username,
        displayName: typeof user.displayName === "string" ? user.displayName : user.username,
        ...(typeof user.avatarUrl === "string" ? { avatarUrl: user.avatarUrl } : {}),
        user_metadata: {
          username: user.username,
          full_name: typeof user.displayName === "string" ? user.displayName : user.username,
        },
      };
      const changed =
        session.user.username !== verifiedUser.username ||
        session.user.displayName !== verifiedUser.displayName ||
        session.user.avatarUrl !== verifiedUser.avatarUrl ||
        session.user.email !== verifiedUser.email;
      if (changed) {
        this.setSession({ ...session, user: verifiedUser });
      } else {
        this.memoryUser = verifiedUser;
        this.memorySession = { ...session, user: verifiedUser };
      }
      return { data: { user: verifiedUser }, error: null };
    } catch {
      return { data: { user: null }, error: new Error("Could not reach Opexnal's authentication API.") };
    }
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
    const identity = params.email?.trim() || "";
    if (!identity || !params.password) {
      return { data: null, error: new Error("Email/username and password are required.") };
    }
    try {
      const response = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password: params.password }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        accessToken?: string;
        expiresIn?: number;
        user?: {
          id?: string;
          username?: string;
          email?: string;
          displayName?: string;
          avatarUrl?: string | null;
        };
      };
      if (!response.ok) {
        return {
          data: null,
          error: new Error(payload.error || "Sign in failed."),
        };
      }
      if (
        typeof payload.accessToken !== "string" ||
        !payload.accessToken ||
        !payload.user?.id ||
        !payload.user.username
      ) {
        return { data: null, error: new Error("The authentication API returned an invalid response.") };
      }

      const user: AuthUser = {
        id: payload.user.id,
        username: payload.user.username,
        email: payload.user.email || "",
        displayName: payload.user.displayName || payload.user.username,
        ...(payload.user.avatarUrl ? { avatarUrl: payload.user.avatarUrl } : {}),
        user_metadata: {
          username: payload.user.username,
          full_name: payload.user.displayName || payload.user.username,
        },
      };
      const session: AuthSession = {
        token: payload.accessToken,
        access_token: payload.accessToken,
        userId: user.id,
        user,
        expiresAt: Date.now() + Math.max(60, payload.expiresIn || 3600) * 1000,
      };
      this.setSession(session);
      return { data: { user, session }, error: null };
    } catch {
      return {
        data: null,
        error: new Error("Could not reach Opexnal's authentication API. Check backend deployment and OPEXNAL_API_URL."),
      };
    }
  }

  async signUp(params: {
    email: string;
    password: string;
    dateOfBirth?: string;
    options?: { data?: { username?: string; full_name?: string } };
  }): Promise<{
    data: { user: AuthUser; session: AuthSession | null; emailVerificationRequired?: boolean } | null;
    error: Error | null;
  }> {
    const username = params.options?.data?.username?.trim() || params.email.split("@")[0] || "";
    try {
      const response = await fetch(apiUrl("/api/v1/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: params.email.trim(),
          password: params.password,
          displayName: params.options?.data?.full_name?.trim() || username,
          dateOfBirth: params.dateOfBirth,
        }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        emailVerificationRequired?: boolean;
        user?: {
          id?: string;
          username?: string;
          email?: string;
          displayName?: string;
          avatarUrl?: string | null;
        };
      };
      if (!response.ok) {
        return { data: null, error: new Error(payload.error || "Signup failed.") };
      }
      if (!payload.user?.id || !payload.user.username) {
        return { data: null, error: new Error("The signup API returned an invalid user record.") };
      }
      const user: AuthUser = {
        id: payload.user.id,
        username: payload.user.username,
        email: payload.user.email || params.email,
        displayName: payload.user.displayName || username,
        ...(payload.user.avatarUrl ? { avatarUrl: payload.user.avatarUrl } : {}),
        user_metadata: {
          username: payload.user.username,
          full_name: payload.user.displayName || username,
        },
      };
      return {
        data: {
          user,
          session: null,
          emailVerificationRequired: Boolean(payload.emailVerificationRequired),
        },
        error: null,
      };
    } catch {
      return {
        data: null,
        error: new Error("Could not reach Opexnal's signup API. Check backend deployment and OPEXNAL_API_URL."),
      };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    const token = this.memorySession?.token;
    let revokeError: Error | null = null;
    if (token) {
      try {
        const response = await fetch(apiUrl("/api/v1/auth/logout"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok && response.status >= 500) {
          revokeError = new Error("Signed out locally, but the server could not revoke this session.");
        }
      } catch {
        revokeError = new Error("Signed out locally, but server-side session revocation could not be confirmed.");
      }
    }

    this.memoryUser = null;
    this.memorySession = null;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(AUTH_USER_KEY);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } catch {
        // The in-memory session is still cleared.
      }
    }

    this.notify("SIGNED_OUT", null);
    return { error: revokeError };
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
