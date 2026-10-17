export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  user_metadata?: { username?: string; full_name?: string; avatar_url?: string };
};

export type AuthSession = {
  token: string;
  access_token: string;
  userId: string;
  user: AuthUser;
  expiresAt: number;
};

type AuthListener = (event: string, session: AuthSession | null) => void;
type ApiUser = { id: string; username: string; email: string; displayName?: string; display_name?: string; avatarUrl?: string; avatar_url?: string };
type ApiSessionResponse = { user?: ApiUser; accessToken?: string; expiresIn?: number; error?: string; message?: string };

const apiBase = (import.meta.env["VITE_OPEXNAL_API_URL"] || "").replace(/\/+$/, "");
const TOKEN_KEY = "opexnal_access_token";
const USER_KEY = "opexnal_auth_user";
const listeners = new Set<AuthListener>();
let currentAccessToken = "";

function apiUrl(path: string) { return (apiBase || "") + "/api/v1" + path; }
function mapUser(user: ApiUser): AuthUser {
  const username = user.username || user.email.split("@")[0] || "user";
  const displayName = user.displayName || user.display_name || username;
  const avatarUrl = user.avatarUrl || user.avatar_url;
  return {
    id: user.id, email: user.email, username, displayName,
    ...(avatarUrl ? { avatarUrl } : {}),
    user_metadata: { username, full_name: displayName, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) },
  };
}
function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}
function createSession(token: string, user: AuthUser, expiresIn = 3600): AuthSession {
  currentAccessToken = token;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    window.sessionStorage.setItem("opexnal_token_expires_at", String(Date.now() + expiresIn * 1000));
  }
  return { token, access_token: token, userId: user.id, user, expiresAt: Date.now() + expiresIn * 1000 };
}
function clearSession() {
  currentAccessToken = "";
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem("opexnal_token_expires_at");
  }
}
function notify(event: string, session: AuthSession | null) { for (const listener of listeners) listener(event, session); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = currentAccessToken || (typeof window !== "undefined" ? window.sessionStorage.getItem(TOKEN_KEY) || "" : "");
  if (token && !headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);
  let response: Response;
  try { response = await fetch(apiUrl(path), { ...init, headers }); }
  catch { throw new Error("Opexnal API could not be reached. Configure VITE_OPEXNAL_API_URL and deploy the independent backend."); }
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Opexnal API request failed.");
  return body;
}

class AuthClient {
  getAuthHeader(): Record<string, string> {
    const token = currentAccessToken || (typeof window !== "undefined" ? window.sessionStorage.getItem(TOKEN_KEY) || "" : "");
    return token ? { Authorization: "Bearer " + token } : {};
  }

  async getUser(): Promise<{ data: { user: AuthUser | null }; error: Error | null }> {
    try {
      const result = await request<{ user: ApiUser }>("/auth/me");
      return { data: { user: mapUser(result.user) }, error: null };
    } catch (error) {
      if (error instanceof Error && /Invalid or expired|Authentication required|Account not found/i.test(error.message)) clearSession();
      return { data: { user: null }, error: error instanceof Error ? error : new Error("Unable to load account.") };
    }
  }

  async getSession(): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
    if (typeof window === "undefined") return { data: { session: null }, error: null };
    const token = window.sessionStorage.getItem(TOKEN_KEY) || "";
    const expiresAt = Number(window.sessionStorage.getItem("opexnal_token_expires_at") || "0");
    const user = readStoredUser();
    if (!token || !user || !expiresAt || expiresAt <= Date.now()) {
      clearSession();
      return { data: { session: null }, error: null };
    }
    currentAccessToken = token;
    return { data: { session: { token, access_token: token, userId: user.id, user, expiresAt } }, error: null };
  }

  async signInWithPassword(params: { email?: string; password?: string }): Promise<{
    data: { user: AuthUser; session: AuthSession; requires2fa?: boolean } | null;
    error: Error | null;
  }> {
    const identity = (params.email || "").trim();
    const password = params.password || "";
    if (!identity || !password) return { data: null, error: new Error("Email/username and password are required.") };
    try {
      const result = await request<ApiSessionResponse>("/auth/login", { method: "POST", body: JSON.stringify({ identity, password }) });
      if (!result.user || !result.accessToken) return { data: null, error: new Error("The API did not return a valid login session.") };
      const user = mapUser(result.user);
      const session = createSession(result.accessToken, user, result.expiresIn || 3600);
      notify("SIGNED_IN", session);
      return { data: { user, session }, error: null };
    } catch (error) { return { data: null, error: error instanceof Error ? error : new Error("Login failed.") }; }
  }

  async signUp(params: {
    email: string; password: string; options?: { data?: { username?: string; full_name?: string } };
  }): Promise<{ data: { user: AuthUser; session: AuthSession | null } | null; error: Error | null }> {
    const email = params.email.trim().toLowerCase();
    const username = (params.options?.data?.username || email.split("@")[0] || "").trim().toLowerCase();
    if (!email.includes("@") || !username) return { data: null, error: new Error("A valid email and username are required.") };
    try {
      const result = await request<{ user: ApiUser; message?: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, username, password: params.password, displayName: params.options?.data?.full_name || username }),
      });
      if (!result.user) return { data: null, error: new Error("Registration failed.") };
      return { data: { user: mapUser(result.user), session: null }, error: null };
    } catch (error) { return { data: null, error: error instanceof Error ? error : new Error("Registration failed.") }; }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try { await request("/auth/logout", { method: "POST", body: JSON.stringify({}) }); }
    catch { /* Always clear local credentials, even if the API is offline. */ }
    clearSession();
    notify("SIGNED_OUT", null);
    return { error: null };
  }

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  }
}

export const authClient = new AuthClient();
export const isOpexnalApiConfigured = Boolean(apiBase);
