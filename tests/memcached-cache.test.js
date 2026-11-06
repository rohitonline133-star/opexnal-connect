import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";
import {
  createMemcachedCache,
  parseMemcachedServers,
} from "../backend/lib/memcached-cache.js";

test("parses and validates a Memcached server list", () => {
  assert.deepEqual(parseMemcachedServers("cache-a:11211,cache-b:11211,cache-a:11211"), [
    "cache-a:11211",
    "cache-b:11211",
  ]);
  assert.deepEqual(parseMemcachedServers(" "), []);
  assert.throws(() => parseMemcachedServers("localhost"), /host:port/);
  assert.throws(() => parseMemcachedServers("localhost:70000"), /host:port/);
});

test("disabled cache is a safe no-op", async () => {
  const cache = createMemcachedCache();
  assert.equal(cache.enabled, false);
  assert.equal(await cache.getJson("profile:1"), null);
  assert.equal(await cache.setJson("profile:1", { ok: true }), false);
  assert.equal(await cache.delete("profile:1"), false);
});

test("validates keys, TTL, and timeout limits", async () => {
  const cache = createMemcachedCache({ servers: ["127.0.0.1:11211"] });
  await assert.rejects(cache.getJson("bad key"), /safe ASCII/);
  await assert.rejects(cache.setJson("safe:key", {}, 0), /TTL/);
  assert.throws(() => createMemcachedCache({ timeoutMs: 10 }), /timeout/);
});

test("speaks Memcached ASCII get/set/delete protocol and JSON round-trips", async () => {
  const values = new Map();
  const server = net.createServer((socket) => {
    let input = "";
    socket.on("data", (chunk) => {
      input += chunk.toString("utf8");
      const lineEnd = input.indexOf("\r\n");
      if (lineEnd < 0) return;
      const line = input.slice(0, lineEnd);
      const parts = line.split(" ");
      if (parts[0] === "set") {
        const byteCount = Number(parts[4]);
        const bodyStart = lineEnd + 2;
        if (Buffer.byteLength(input.slice(bodyStart)) < byteCount + 2) return;
        const body = input.slice(bodyStart, bodyStart + byteCount);
        values.set(parts[1], body);
        socket.end("STORED\r\n");
      } else if (parts[0] === "get") {
        const body = values.get(parts[1]);
        if (body === undefined) socket.end("END\r\n");
        else socket.end(`VALUE ${parts[1]} 0 ${Buffer.byteLength(body)}\r\n${body}\r\nEND\r\n`);
      } else if (parts[0] === "delete") {
        socket.end(values.delete(parts[1]) ? "DELETED\r\n" : "NOT_FOUND\r\n");
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const cache = createMemcachedCache({ servers: [`127.0.0.1:${address.port}`] });
  try {
    assert.equal(await cache.setJson("profile:42", { username: "sample", count: 2 }, 30), true);
    assert.deepEqual(await cache.getJson("profile:42"), { username: "sample", count: 2 });
    assert.equal(await cache.delete("profile:42"), true);
    assert.equal(await cache.getJson("profile:42"), null);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
