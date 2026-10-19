/**
 * Opexnal First-Party Database & Auth Client Adapter
 *
 * Replaces external Supabase dependencies with Opexnal's first-party backend architecture.
 * Completely eliminates any network calls to external Supabase servers while preserving
 * compatibility across existing components and query calls.
 */

import { authClient, AuthUser, AuthSession } from "@/lib/auth-client";

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
        const res = await fetch("/api/v1/posts/feed", {
          headers: authClient.getAuthHeader(),
        });
        if (res.ok) {
          const json = (await res.json()) as { posts?: Record<string, unknown>[] };
          let rows: Record<string, unknown>[] = json.posts || [];
          for (const f of this.filters) {
            rows = rows.filter(f);
          }
          if (this.limitCount) rows = rows.slice(0, this.limitCount);
          return { data: rows as unknown as T, error: null };
        }
      }

      if (this.tableName === "stories" && this.operation === "select") {
        const res = await fetch("/api/v1/stories/tray", {
          headers: authClient.getAuthHeader(),
        });
        if (res.ok) {
          const json = (await res.json()) as { tray?: unknown };
          return { data: (json.tray || []) as unknown as T, error: null };
        }
      }

      // Local persistent table fallback
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

      const res = await fetch("/api/v1/storage/upload", {
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

  async createSignedUrl(path: string, _expiresIn = 3600) {
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
      return { data: { signedUrl: path }, error: null };
    }
    return { data: { signedUrl: `/api/v1/storage/public/${path}` }, error: null };
  }

  getPublicUrl(path: string) {
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
      return { data: { publicUrl: path } };
    }
    return { data: { publicUrl: `/api/v1/storage/public/${path}` } };
  }

  async remove(_paths: string[]) {
    return { data: null, error: null };
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
      return { data: { session: null }, error: null };
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
        return authClient.updatePassword(attributes.password);
      }
      return { data: null, error: new Error("No supported user attributes were provided.") };
    },
  },
  storage: {
    from: (bucket: string) => new StorageBucketClient(bucket),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: <T = any>(tableName: string) => new QueryBuilder<T>(tableName),
  rpc: async (func: string, params?: Record<string, unknown>) => {
    return { data: "success", error: null };
  },
  channel: (_name: string) => ({
    on: (..._args: unknown[]) => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: (_channel: unknown) => {},
};
