export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
}

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED" | "TOKEN_REFRESHED";
export type AuthStateCallback = (event: AuthChangeEvent, session: AuthSession | null) => void;

class AuthClient {
  private currentSession: AuthSession | null = null;
  private currentUser: AuthUser | null = null;
  private listeners: Set<AuthStateCallback> = new Set();
  private isInitialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initFromStorage();
    }
  }

  private initFromStorage() {
    const savedToken = localStorage.getItem("opexnal_access_token");
    const savedUser = localStorage.getItem("opexnal_user");

    if (savedToken && savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.currentSession = {
          id: localStorage.getItem("opexnal_session_id") || "sess_stored",
          userId: this.currentUser?.id || "",
          token: savedToken,
        };
      } catch {
        this.clearStorage();
      }
    }
    this.isInitialized = true;
  }

  public async getSession(): Promise<{
    data: { session: AuthSession | null };
    error: Error | null;
  }> {
    if (this.currentSession) {
      return { data: { session: this.currentSession }, error: null };
    }

    try {
      const res = await fetch("/api/v1/auth/session");
      if (res.ok) {
        const body = (await res.json()) as {
          session: { id: string; userId: string } | null;
          user: AuthUser | null;
        };
        if (body.session && body.user) {
          const token = localStorage.getItem("opexnal_access_token") || "";
          this.currentSession = { id: body.session.id, userId: body.session.userId, token };
          this.currentUser = body.user;
          return { data: { session: this.currentSession }, error: null };
        }
      }
    } catch {
      // Network failure or unauthenticated
    }

    return { data: { session: null }, error: null };
  }

  public async getUser(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    if (this.currentUser) {
      return { data: { user: this.currentUser }, error: null };
    }

    const { data } = await this.getSession();
    if (data.session && this.currentUser) {
      return { data: { user: this.currentUser }, error: null };
    }

    return { data: { user: null }, error: null };
  }

  public async signInWithPassword(params: { email?: string; password?: string }): Promise<{
    data: {
      user: AuthUser | null;
      session: AuthSession | null;
      requires2fa?: boolean;
      userId?: string;
    };
    error: Error | null;
  }> {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: params.email,
          password: params.password,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        return {
          data: { user: null, session: null },
          error: new Error(body.error || "Login failed"),
        };
      }

      if (body.requires2fa) {
        return {
          data: { user: body.user, session: null, requires2fa: true, userId: body.user.id },
          error: null,
        };
      }

      this.saveSession(body.token, body.sessionId, body.user);
      this.notifyListeners("SIGNED_IN", this.currentSession);

      return {
        data: { user: body.user, session: this.currentSession },
        error: null,
      };
    } catch (e: unknown) {
      return {
        data: { user: null, session: null },
        error: e instanceof Error ? e : new Error("Network error"),
      };
    }
  }

  public async signUp(params: {
    email: string;
    password: string;
    options?: { data?: { username?: string; full_name?: string; phone?: string } };
  }): Promise<{
    data: { user: AuthUser | null; session: AuthSession | null };
    error: Error | null;
  }> {
    try {
      const email = params.email;
      const username = params.options?.data?.username || email.split("@")[0];
      const displayName = params.options?.data?.full_name || username;
      const phone = params.options?.data?.phone;

      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          username,
          password: params.password,
          displayName,
          phone,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        return {
          data: { user: null, session: null },
          error: new Error(body.error || "Registration failed"),
        };
      }

      this.saveSession(body.token, body.sessionId, body.user);
      this.notifyListeners("SIGNED_IN", this.currentSession);

      return { data: { user: body.user, session: this.currentSession }, error: null };
    } catch (e: unknown) {
      return {
        data: { user: null, session: null },
        error: e instanceof Error ? e : new Error("Network error"),
      };
    }
  }

  public async verify2fa(userId: string, token: string) {
    try {
      const res = await fetch("/api/v1/auth/2fa-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, token }),
      });
      const body = await res.json();
      if (!res.ok) {
        return { data: null, error: new Error(body.error || "2FA verification failed") };
      }

      this.saveSession(body.token, body.sessionId, body.user);
      this.notifyListeners("SIGNED_IN", this.currentSession);
      return { data: body, error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e : new Error("Network error") };
    }
  }

  public async signOut(): Promise<{ error: Error | null }> {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }

    this.clearStorage();
    this.notifyListeners("SIGNED_OUT", null);
    return { error: null };
  }

  public onAuthStateChange(callback: AuthStateCallback): {
    data: { subscription: { unsubscribe: () => void } };
  } {
    this.listeners.add(callback);
    // Initial call
    if (this.currentSession) {
      callback("SIGNED_IN", this.currentSession);
    }

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

  public getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem("opexnal_access_token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  private saveSession(token: string, sessionId: string, user: AuthUser) {
    this.currentUser = user;
    this.currentSession = { id: sessionId, userId: user.id, token };

    if (typeof window !== "undefined") {
      localStorage.setItem("opexnal_access_token", token);
      localStorage.setItem("opexnal_session_id", sessionId);
      localStorage.setItem("opexnal_user", JSON.stringify(user));
    }
  }

  private clearStorage() {
    this.currentUser = null;
    this.currentSession = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("opexnal_access_token");
      localStorage.removeItem("opexnal_session_id");
      localStorage.removeItem("opexnal_user");
    }
  }

  private notifyListeners(event: AuthChangeEvent, session: AuthSession | null) {
    this.listeners.forEach((cb) => cb(event, session));
  }
}

export const authClient = new AuthClient();
