/**
 * Opexnal First-Party Database & Auth Client Adapter
 *
 * Replaces external Supabase dependencies with Opexnal's first-party backend architecture.
 * Completely eliminates any network calls to external Supabase servers while preserving
 * compatibility across existing components and query calls.
 */

import { authClient, AuthUser, AuthSession } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-client";

export type { Database } from "./types";

// In-memory/localStorage seed store for client-side local cache
const LOCAL_STORE_PREFIX = "opexnal_db_";
const memoryTables = new Map<string, Record<string, unknown>[]>();

function getLocalTable(table: string): Record<string, unknown>[] {
  if (typeof window === "undefined") {
    return memoryTables.get(table) || [];
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORE_PREFIX + table);
    return raw ? JSON.parse(raw) : memoryTables.get(table) || [];
  } catch {
    return memoryTables.get(table) || [];
  }
}

function setLocalTable(table: string, data: Record<string, unknown>[]) {
  memoryTables.set(table, data);
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORE_PREFIX + table, JSON.stringify(data));
  } catch {
    // quota exceeded or SSR
  }
}

export type QueryResult<T = unknown> = {
  data: T | null;
  error: Error | null;
};

class QueryBuilder<T = unknown> {
  private tableName: string;
  private selectedFields = "*";
  private filters: Array<(row: Record<string, unknown>) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: unknown = null;

  constructor(table: string) {
    this.tableName = table;
  }

  select(fields = "*") {
    this.selectedFields = fields;
    return this;
  }

  insert(data: unknown) {
    this.operation = "insert";
    this.payload = data;
    return this;
  }

  update(data: unknown) {
    this.operation = "update";
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  upsert(data: unknown, _options?: unknown) {
    this.operation = "upsert";
    this.payload = data;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((r) => r[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    const set = new Set(values);
    this.filters.push((r) => set.has(r[column]));
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push((r) => {
      const val = r[column];
      if (typeof val === "string" && typeof value === "string") return val < value;
      if (typeof val === "number" && typeof value === "number") return val < value;
      return false;
    });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((r) => r[column] !== value);
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push((r) => {
      const val = r[column];
      if (typeof val === "string" && typeof value === "string") return val > value;
      if (typeof val === "number" && typeof value === "number") return val > value;
      return false;
    });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push((r) => {
      const val = r[column];
      if (typeof val === "string" && typeof value === "string") return val >= value;
      if (typeof val === "number" && typeof value === "number") return val >= value;
      return false;
    });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push((r) => {
      const val = r[column];
      if (typeof val === "string" && typeof value === "string") return val <= value;
      if (typeof val === "number" && typeof value === "number") return val <= value;
      return false;
    });
    return this;
  }

  or(filterString: string) {
    // Basic ilike or parser, e.g. username.ilike.%foo%,display_name.ilike.%foo%
    const parts = filterString.split(",").map((s) => s.trim());
    this.filters.push((r) => {
      return parts.some((p) => {
        const [col, op, pattern] = p.split(".");
        if (!col || !op) return false;
        const val = String(r[col] ?? "").toLowerCase();
        const search = (pattern ?? "").replace(/%/g, "").toLowerCase();
        if (op === "ilike") {
          return val.includes(search);
        }
        if (op === "eq") {
          return val === search;
        }
        return false;
      });
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderField = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async execute(): Promise<QueryResult<T>> {
    try {
      // First attempt first-party API endpoint if available
      if (this.tableName === "posts" && this.operation === "select") {
        const res = await fetch(apiUrl("/api/v1/posts/feed"), {
          headers: authClient.getAuthHeader(),
          cache: "no-store",
        });
        if (!res.ok) {
          return {
            data: null,
            error: new Error(`Feed request failed with status ${res.status}.`),
          };
        }
        const json = (await res.json()) as { posts?: Record<string, unknown>[] };
        let rows: Record<string, unknown>[] = json.posts || [];
        for (const f of this.filters) {
          rows = rows.filter(f);
        }
        if (this.limitCount) rows = rows.slice(0, this.limitCount);
        return { data: rows as unknown as T, error: null };
      }

      if (this.tableName === "stories" && this.operation === "select") {
        const res = await fetch(apiUrl("/api/v1/stories"), {
          headers: authClient.getAuthHeader(),
          cache: "no-store",
        });
        if (!res.ok) {
          return {
            data: null,
            error: new Error(`Stories request failed with status ${res.status}.`),
          };
        }
        const json = (await res.json()) as { stories?: unknown[] };
        return { data: (json.stories || []) as unknown as T, error: null };
      }

      if (
        (this.tableName === "posts" || this.tableName === "stories") &&
        this.operation === "insert"
      ) {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        if (items.length !== 1 || !items[0] || typeof items[0] !== "object") {
          return {
            data: null,
            error: new Error("Only one post or story can be created per request."),
          };
        }
        const item = items[0] as Record<string, unknown>;
        const mediaUrl =
          typeof item.media_url === "string"
            ? item.media_url
            : typeof item.mediaUrl === "string"
              ? item.mediaUrl
              : null;
        const mediaTypeValue = item.media_type ?? item.mediaType;
        const mediaType =
          typeof mediaTypeValue === "string"
            ? mediaTypeValue
            : this.tableName === "posts" && !mediaUrl
              ? "text"
              : "image";
        const endpoint = this.tableName === "posts" ? "/api/v1/posts" : "/api/v1/stories";
        try {
          const response = await fetch(apiUrl(endpoint), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authClient.getAuthHeader(),
            },
            body: JSON.stringify({
              caption: typeof item.caption === "string" ? item.caption : "",
              mediaUrl,
              mediaType,
              visibility: item.visibility === "private" ? "private" : "public",
            }),
            cache: "no-store",
          });
          const payload = (await response.json().catch(() => ({}))) as {
            post?: Record<string, unknown>;
            story?: Record<string, unknown>;
            error?: string;
          };
          if (!response.ok) {
            return {
              data: null,
              error: new Error(payload.error || `Create request failed with status ${response.status}.`),
            };
          }
          const created = this.tableName === "posts" ? payload.post : payload.story;
          if (!created) {
            return { data: null, error: new Error("The API returned no created record.") };
          }
          return { data: created as unknown as T, error: null };
        } catch (error: unknown) {
          return {
            data: null,
            error: error instanceof Error ? error : new Error("Create request failed."),
          };
        }
      }

      // Browser-local storage is only a development convenience. In production,
      // unsupported tables must fail explicitly rather than pretending data persisted.
      if (!import.meta.env.DEV) {
        return {
          data: null,
          error: new Error(
            `First-party API adapter does not support ${this.operation} on "${this.tableName}". No local data was written.`,
          ),
        };
      }

      // Development-only local persistent table fallback
      let tableData = getLocalTable(this.tableName);

      if (this.operation === "insert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const newRows = items.map((item) => ({
          id:
            (item as Record<string, unknown>)?.["id"] ||
            `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(item as Record<string, unknown>),
        }));
        tableData = [...tableData, ...newRows];
        setLocalTable(this.tableName, tableData);
        return {
          data: (Array.isArray(this.payload) ? newRows : newRows[0]) as unknown as T,
          error: null,
        };
      }

      if (this.operation === "update") {
        tableData = tableData.map((row) => {
          const match = this.filters.every((f) => f(row));
          if (match) {
            return { ...row, ...(this.payload as object), updated_at: new Date().toISOString() };
          }
          return row;
        });
        setLocalTable(this.tableName, tableData);
        return { data: this.payload as T, error: null };
      }

      if (this.operation === "delete") {
        tableData = tableData.filter((row) => !this.filters.every((f) => f(row)));
        setLocalTable(this.tableName, tableData);
        return { data: null, error: null };
      }

      // SELECT
      let result = [...tableData];
      for (const filter of this.filters) {
        result = result.filter(filter);
      }

      if (this.orderField) {
        const field = this.orderField;
        const asc = this.orderAscending;
        result.sort((a, b) => {
          const valA = String(a[field] ?? "");
          const valB = String(b[field] ?? "");
          if (valA < valB) return asc ? -1 : 1;
          if (valA > valB) return asc ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount) {
        result = result.slice(0, this.limitCount);
      }

      return { data: result as unknown as T, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // TanStack & Supabase standard thenable interface
  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single(): Promise<QueryResult<T>> {
    const res = await this.execute();
    if (res.error) return res;
    if (Array.isArray(res.data)) {
      return {
        data: (res.data[0] || null) as T,
        error: res.data.length === 0 ? new Error("Not found") : null,
      };
    }
    return res;
  }

  async maybeSingle(): Promise<QueryResult<T>> {
    const res = await this.execute();
    if (res.error) return res;
    if (Array.isArray(res.data)) {
      return { data: (res.data[0] || null) as T, error: null };
    }
    return res;
  }
}

class StorageBucketClient {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File | Blob, _options?: unknown) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", this.bucket);

      const res = await fetch(apiUrl("/api/v1/storage/upload"), {
        method: "POST",
        headers: authClient.getAuthHeader(),
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({ error: "Upload failed" }))) as {
          error?: string;
        };
        return { data: null, error: new Error(body.error || "Upload failed") };
      }

      const body = (await res.json()) as { storagePath: string };
      return { data: { path: body.storagePath }, error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e : new Error("Network error") };
    }
  }

  async createSignedUrl(path: string, expiresIn = 300) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return { data: { signedUrl: path }, error: null };
    }
    const objectKey = path.startsWith("/api/v1/storage/")
      ? path.slice("/api/v1/storage/".length)
      : path;
    try {
      const res = await fetch(apiUrl("/api/v1/storage/signed-url"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authClient.getAuthHeader(),
        },
        body: JSON.stringify({ path: objectKey, expiresIn }),
        cache: "no-store",
      });
      const body = (await res.json().catch(() => ({}))) as {
        signedUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.signedUrl) {
        return { data: null, error: new Error(body.error || "Could not create a signed media URL.") };
      }
      return { data: { signedUrl: body.signedUrl }, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error : new Error("Media URL request failed.") };
    }
  }

  getPublicUrl(path: string) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return { data: { publicUrl: path } };
    }
    const objectKey = path.startsWith("/api/v1/storage/")
      ? path.slice("/api/v1/storage/".length)
      : path;
    return { data: { publicUrl: `/api/v1/storage/public/${encodeURIComponent(objectKey)}` } };
  }

  async remove(paths: string[]) {
    try {
      await Promise.all(
        paths.map(async (path) => {
          const objectKey = path.startsWith("/api/v1/storage/")
            ? path.slice("/api/v1/storage/".length)
            : path;
          const response = await fetch(apiUrl(`/api/v1/storage/${encodeURIComponent(objectKey)}`), {
            method: "DELETE",
            headers: authClient.getAuthHeader(),
          });
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) {
            throw new Error(payload.error || `Media delete failed with status ${response.status}.`);
          }
        }),
      );
      return { data: null, error: null };
    } catch (error: unknown) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Media delete failed."),
      };
    }
  }
}

export const supabase = {
  auth: {
    getUser: async () => {
      const res = await authClient.getUser();
      return {
        data: {
          user: res.data.user
            ? {
                id: res.data.user.id,
                email: res.data.user.email,
                user_metadata: {
                  username: res.data.user.username,
                  full_name: res.data.user.displayName,
                },
              }
            : null,
        },
        error: res.error,
      };
    },
    getSession: async () => {
      const res = await authClient.getSession();
      return {
        data: {
          session: res.data.session
            ? {
                access_token: res.data.session.token,
                user: {
                  id: res.data.session.userId,
                  email: "",
                },
              }
            : null,
        },
        error: res.error,
      };
    },
    setSession: async (_tokens: unknown) => {
      return {
        data: { session: null },
        error: new Error(
          "Third-party OAuth sessions are not accepted by Opexnal's first-party authentication backend.",
        ),
      };
    },
    signInWithPassword: (params: { email?: string; password?: string }) =>
      authClient.signInWithPassword(params),
    signUp: (params: {
      email: string;
      password: string;
      options?: { data?: { username?: string; full_name?: string } };
    }) => authClient.signUp(params),
    signOut: () => authClient.signOut(),
    onAuthStateChange: (callback: (event: string, session: AuthSession | null) => void) =>
      authClient.onAuthStateChange(callback),
    updateUser: async (attributes: { password?: string }) => {
      if (attributes.password) {
        return {
          data: null,
          error: new Error(
            "Password changes are unavailable until verified first-party password-reset tokens are configured.",
          ),
        };
      }
      return { data: null, error: new Error("Unsupported account update operation.") };
    },
  },
  storage: {
    from: (bucket: string) => new StorageBucketClient(bucket),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: <T = any>(tableName: string) => new QueryBuilder<T>(tableName),
  rpc: async (_func: string, _params?: Record<string, unknown>) => {
    return {
      data: null,
      error: new Error(
        "RPC is not implemented by the first-party API. No operation was performed.",
      ),
    };
  },
  channel: (_name: string) => ({
    on: (..._args: unknown[]) => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: (_channel: unknown) => {},
};
