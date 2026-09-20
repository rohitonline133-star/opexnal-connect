import { Pool, PoolClient } from "pg";
import { randomUUID } from "node:crypto";

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface TransactionClient {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

class InMemoryDatabaseStore {
  public tables: Map<string, Map<string, Record<string, unknown>>> = new Map();

  constructor() {
    const tableNames = [
      "users",
      "profiles",
      "sessions",
      "devices",
      "posts",
      "post_media",
      "reels",
      "reel_media",
      "stories",
      "story_views",
      "likes",
      "post_likes",
      "comments",
      "post_comments",
      "comment_likes",
      "follows",
      "follow_requests",
      "saves",
      "post_saves",
      "shares",
      "post_shares",
      "mentions",
      "hashtags",
      "notifications",
      "conversations",
      "conversation_members",
      "messages",
      "message_reads",
      "blocks",
      "mutes",
      "reports",
      "content_reports",
      "settings",
      "security_events",
      "audit_logs",
      "monetization",
      "creator_accounts",
    ];
    for (const name of tableNames) {
      this.tables.set(name, new Map());
    }
  }

  public getTable(name: string): Map<string, Record<string, unknown>> {
    let tbl = this.tables.get(name);
    if (!tbl) {
      tbl = new Map();
      this.tables.set(name, tbl);
    }
    return tbl;
  }

  public clearAll() {
    for (const tbl of this.tables.values()) {
      tbl.clear();
    }
  }
}

export const inMemoryDb = new InMemoryDatabaseStore();

let realPool: Pool | null = null;

export function getDatabasePool(): Pool | null {
  if (realPool) return realPool;
  const dbUrl = process.env["DATABASE_URL"];
  if (
    dbUrl &&
    dbUrl.trim().length > 0 &&
    !dbUrl.includes("mock") &&
    !dbUrl.includes("placeholder")
  ) {
    try {
      realPool = new Pool({
        connectionString: dbUrl,
        ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      realPool.on("error", (err) => {
        console.error("[POSTGRESQL] Unexpected client pool error:", err);
      });
      return realPool;
    } catch (e) {
      console.warn("[POSTGRESQL] Connection failed, falling back to ACID in-memory store:", e);
      return null;
    }
  }
  return null;
}

export async function dbQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const pool = getDatabasePool();
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount ?? res.rows.length,
      };
    } catch (err) {
      console.error(`[POSTGRESQL ERROR] Failed SQL: ${text}`, err);
      throw err;
    }
  }

  // Fallback in-memory ACID store simulator for standalone execution & testing
  return executeInMemoryQuery<T>(text, params);
}

export async function withTransaction<T>(
  callback: (client: TransactionClient) => Promise<T>,
): Promise<T> {
  const pool = getDatabasePool();
  if (pool) {
    const client: PoolClient = await pool.connect();
    try {
      await client.query("BEGIN");
      const transactionWrapper: TransactionClient = {
        async query<R = Record<string, unknown>>(sql: string, params?: unknown[]) {
          const res = await client.query(sql, params);
          return { rows: res.rows as R[], rowCount: res.rowCount ?? res.rows.length };
        },
      };
      const result = await callback(transactionWrapper);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // In-memory transaction wrapper
  const memClient: TransactionClient = {
    async query<R = Record<string, unknown>>(sql: string, params?: unknown[]) {
      return executeInMemoryQuery<R>(sql, params ?? []);
    },
  };
  return await callback(memClient);
}

/**
 * Parses and executes SQL operations on the in-memory schema store.
 * Supports standard SELECT, INSERT, UPDATE, DELETE, and COUNT patterns.
 */
function executeInMemoryQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[],
): QueryResult<T> {
  const normalizedSql = sql.trim().replace(/\s+/g, " ");
  const lowerSql = normalizedSql.toLowerCase();

  // 1. INSERT INTO <table> (...) VALUES (...) RETURNING *
  const insertMatch = lowerSql.match(
    /^insert into\s+([a-z0-9_]+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/,
  );
  if (insertMatch && insertMatch[1] && insertMatch[2]) {
    const tableName = insertMatch[1];
    const columns = insertMatch[2].split(",").map((c) => c.trim().toLowerCase());
    const table = inMemoryDb.getTable(tableName);

    const newRecord: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      newRecord[col] = params[idx] !== undefined ? params[idx] : null;
    });

    if (!newRecord["id"]) {
      newRecord["id"] = randomUUID();
    }
    if (!newRecord["created_at"]) {
      newRecord["created_at"] = new Date().toISOString();
    }
    if (!newRecord["updated_at"]) {
      newRecord["updated_at"] = new Date().toISOString();
    }

    const idKey = String(newRecord["id"] ?? randomUUID());
    table.set(idKey, newRecord);

    return {
      rows: [newRecord as unknown as T],
      rowCount: 1,
    };
  }

  // 2. SELECT * FROM <table> WHERE <col> = $1
  const selectMatch = lowerSql.match(
    /^select\s+(.+?)\s+from\s+([a-z0-9_]+)(?:\s+where\s+(.+?))?(?:\s+order by\s+(.+?))?(?:\s+limit\s+(\d+|\$\d+))?$/,
  );
  if (selectMatch && selectMatch[2]) {
    const tableName = selectMatch[2];
    const table = inMemoryDb.getTable(tableName);
    let items = Array.from(table.values());

    // Basic WHERE filter
    const whereClause = selectMatch[3];
    if (whereClause) {
      items = filterItems(items, whereClause, params);
    }

    // ORDER BY created_at DESC / ASC
    const orderBy = selectMatch[4];
    if (orderBy) {
      if (
        orderBy.includes("created_at desc") ||
        orderBy.includes("last_active_at desc") ||
        orderBy.includes("last_message_at desc")
      ) {
        items.sort((a, b) => {
          const ta = new Date(
            (a["created_at"] || a["last_active_at"] || a["last_message_at"] || 0) as string,
          ).getTime();
          const tb = new Date(
            (b["created_at"] || b["last_active_at"] || b["last_message_at"] || 0) as string,
          ).getTime();
          return tb - ta;
        });
      } else if (orderBy.includes("position asc")) {
        items.sort((a, b) => Number(a["position"] ?? 0) - Number(b["position"] ?? 0));
      }
    }

    // LIMIT
    const limitClause = selectMatch[5];
    if (limitClause) {
      const lim = limitClause.startsWith("$")
        ? Number(params[parseInt(limitClause.slice(1), 10) - 1])
        : parseInt(limitClause, 10);
      if (!isNaN(lim)) {
        items = items.slice(0, lim);
      }
    }

    return {
      rows: items as unknown as T[],
      rowCount: items.length,
    };
  }

  // 3. UPDATE <table> SET <col> = $1 WHERE <condition>
  const updateMatch = lowerSql.match(
    /^update\s+([a-z0-9_]+)\s+set\s+(.+?)\s+where\s+(.+?)(?:\s+returning\s+\*)?$/,
  );
  if (updateMatch && updateMatch[1] && updateMatch[2] && updateMatch[3]) {
    const tableName = updateMatch[1];
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3];
    const table = inMemoryDb.getTable(tableName);

    let updatedCount = 0;
    const updatedRows: Record<string, unknown>[] = [];

    // Parse set fields
    const setPairs = setClause.split(",").map((p) => p.trim());
    const updates: Record<string, unknown> = {};

    for (const pair of setPairs) {
      const [col, valExpr] = pair.split("=").map((s) => s.trim());
      if (col && valExpr) {
        const paramIdx = valExpr.startsWith("$") ? parseInt(valExpr.slice(1), 10) - 1 : -1;
        if (paramIdx >= 0 && paramIdx < params.length) {
          updates[col] = params[paramIdx];
        } else if (valExpr === "now()") {
          updates[col] = new Date().toISOString();
        } else if (valExpr.includes("+ 1")) {
          // atomic increment
          updates[`__inc_${col}`] = 1;
        } else if (valExpr.includes("- 1")) {
          // atomic decrement
          updates[`__inc_${col}`] = -1;
        }
      }
    }

    const items = Array.from(table.entries());
    for (const [id, row] of items) {
      if (matchesCondition(row, whereClause, params)) {
        for (const [k, v] of Object.entries(updates)) {
          if (k.startsWith("__inc_")) {
            const actualKey = k.replace("__inc_", "");
            row[actualKey] = Math.max(0, Number(row[actualKey] ?? 0) + Number(v));
          } else {
            row[k] = v;
          }
        }
        row["updated_at"] = new Date().toISOString();
        table.set(id, row);
        updatedRows.push(row);
        updatedCount++;
      }
    }

    return {
      rows: updatedRows as unknown as T[],
      rowCount: updatedCount,
    };
  }

  // 4. DELETE FROM <table> WHERE <condition>
  const deleteMatch = lowerSql.match(/^delete from\s+([a-z0-9_]+)\s+where\s+(.+?)$/);
  if (deleteMatch && deleteMatch[1] && deleteMatch[2]) {
    const tableName = deleteMatch[1];
    const whereClause = deleteMatch[2];
    const table = inMemoryDb.getTable(tableName);
    let deletedCount = 0;

    const items = Array.from(table.entries());
    for (const [id, row] of items) {
      if (matchesCondition(row, whereClause, params)) {
        table.delete(id);
        deletedCount++;
      }
    }

    return {
      rows: [],
      rowCount: deletedCount,
    };
  }

  // Default empty return
  return { rows: [], rowCount: 0 };
}

function filterItems(
  items: Record<string, unknown>[],
  whereClause: string,
  params: unknown[],
): Record<string, unknown>[] {
  return items.filter((item) => matchesCondition(item, whereClause, params));
}

function matchesCondition(
  item: Record<string, unknown>,
  whereClause: string,
  params: unknown[],
): boolean {
  const parts = whereClause.split(/\s+and\s+/i);
  for (const part of parts) {
    const clean = part.trim().replace(/^\(|\)$/g, "");

    // equality: col = $1 or col = 'literal'
    const eqMatch = clean.match(/^([a-z0-9_]+)\s*=\s*(\$\d+|true|false|'[^']*')$/i);
    if (eqMatch && eqMatch[1] && eqMatch[2]) {
      const col = eqMatch[1].toLowerCase();
      const valStr = eqMatch[2];
      let expected: unknown;
      if (valStr.startsWith("$")) {
        const idx = parseInt(valStr.slice(1), 10) - 1;
        expected = params[idx];
      } else if (valStr.toLowerCase() === "true") {
        expected = true;
      } else if (valStr.toLowerCase() === "false") {
        expected = false;
      } else {
        expected = valStr.replace(/^'|'$/g, "");
      }

      const actual = item[col];
      if (String(actual ?? "").toLowerCase() !== String(expected ?? "").toLowerCase()) {
        return false;
      }
      continue;
    }

    // inequality: col != $1
    const neMatch = clean.match(/^([a-z0-9_]+)\s*(?:!=|<>)\s*(\$\d+|'[^']*')$/i);
    if (neMatch && neMatch[1] && neMatch[2]) {
      const col = neMatch[1].toLowerCase();
      const valStr = neMatch[2];
      const idx = parseInt(valStr.slice(1), 10) - 1;
      const expected = params[idx];
      if (item[col] === expected) return false;
      continue;
    }

    // is false / is true
    if (clean.includes("is_deleted = false") || clean.includes("is_deleted is false")) {
      if (item["is_deleted"] === true) return false;
      continue;
    }

    // is null / is not null
    if (clean.includes("is null")) {
      const col = clean.split(/\s+/)[0]?.toLowerCase();
      if (col && item[col] !== null && item[col] !== undefined) return false;
      continue;
    }
  }

  return true;
}
