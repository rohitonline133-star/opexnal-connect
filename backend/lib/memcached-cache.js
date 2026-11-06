import net from "node:net";
import { createHash } from "node:crypto";

const MAX_VALUE_BYTES = 1024 * 1024;
const MAX_KEY_BYTES = 250;
const MAX_TTL_SECONDS = 30 * 24 * 60 * 60;

export function parseMemcachedServers(value) {
  if (typeof value !== "string" || !value.trim()) return [];
  const servers = [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  for (const server of servers) {
    const match = /^([a-zA-Z0-9.-]+):(\d{1,5})$/.exec(server);
    if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) {
      throw new Error("MEMCACHED_SERVERS must contain host:port entries.");
    }
  }
  return servers;
}

function validateKey(key) {
  if (
    typeof key !== "string" ||
    !/^[A-Za-z0-9:_-]+$/.test(key) ||
    Buffer.byteLength(key) > MAX_KEY_BYTES
  ) {
    throw new TypeError("Memcached keys must be 1–250 safe ASCII characters.");
  }
}

function validateTtl(ttlSeconds) {
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > MAX_TTL_SECONDS) {
    throw new RangeError("Memcached TTL must be an integer from 1 to 2592000 seconds.");
  }
}

function selectServer(servers, key) {
  let selected = servers[0];
  let highest = -1n;
  for (const server of servers) {
    const digest = createHash("sha256").update(server + ":" + key).digest("hex").slice(0, 16);
    const score = BigInt("0x" + digest);
    if (score > highest) {
      highest = score;
      selected = server;
    }
  }
  return selected;
}

function command(server, payload, timeoutMs = 750) {
  const [host, portText] = server.split(":");
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(portText) });
    const chunks = [];
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(Buffer.concat(chunks).toString("utf8"));
    };
    socket.setTimeout(timeoutMs, () => finish(new Error("Memcached request timed out.")));
    socket.on("error", (error) => finish(error));
    socket.on("data", (chunk) => {
      chunks.push(chunk);
      const data = Buffer.concat(chunks);
      if (data.length > MAX_VALUE_BYTES + 4096) {
        return finish(new Error("Memcached response exceeded limit."));
      }
      const text = data.toString("utf8");
      if (
        text.endsWith("END\\r\\n") ||
        text === "STORED\\r\\n" ||
        text === "NOT_STORED\\r\\n" ||
        text === "DELETED\\r\\n" ||
        text === "NOT_FOUND\\r\\n" ||
        text.startsWith("CLIENT_ERROR") ||
        text.startsWith("SERVER_ERROR") ||
        text.startsWith("ERROR")
      ) {
        finish(null, text);
      }
    });
    socket.on("connect", () => socket.write(payload));
  });
}

export function createMemcachedCache({ servers = [], timeoutMs = 750 } = {}) {
  const configured = Array.isArray(servers)
    ? parseMemcachedServers(servers.join(","))
    : parseMemcachedServers(servers);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 50 || timeoutMs > 5000) {
    throw new RangeError("Memcached timeout must be 50–5000 ms.");
  }
  return {
    enabled: configured.length > 0,
    async getJson(key) {
      if (!configured.length) return null;
      validateKey(key);
      try {
        const response = await command(selectServer(configured, key), `get ${key}\r\n`, timeoutMs);
        if (response === "END\r\n") return null;
        const match = /^VALUE [^ ]+ \d+ (\d+)\r\n([\s\S]*)\r\nEND\r\n$/.exec(response);
        if (!match) return null;
        const bytes = Number(match[1]);
        if (bytes !== Buffer.byteLength(match[2])) return null;
        return JSON.parse(match[2]);
      } catch {
        return null;
      }
    },
    async setJson(key, value, ttlSeconds = 30) {
      if (!configured.length) return false;
      validateKey(key);
      validateTtl(ttlSeconds);
      try {
        const body = JSON.stringify(value);
        if (typeof body !== "string" || Buffer.byteLength(body) > MAX_VALUE_BYTES) return false;
        const response = await command(
          selectServer(configured, key),
          `set ${key} 0 ${ttlSeconds} ${Buffer.byteLength(body)}\r\n${body}\r\n`,
          timeoutMs,
        );
        return response === "STORED\r\n";
      } catch {
        return false;
      }
    },
    async delete(key) {
      if (!configured.length) return false;
      validateKey(key);
      try {
        const response = await command(selectServer(configured, key), `delete ${key}\r\n`, timeoutMs);
        return response === "DELETED\r\n";
      } catch {
        return false;
      }
    },
  };
}
