import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

async function checkRoute(path: string, expectedStatus: number = 200) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  console.log(`Route [${path}] status: ${res.status}`);
  assert.ok(
    res.status === expectedStatus || (expectedStatus === 200 && res.status === 307),
    `Expected status ${expectedStatus} for ${path}, got ${res.status}`,
  );
  return res;
}

async function run() {
  console.log("=== VERIFYING RUNNING DEV SERVER ===");

  // 1. Core routes
  const routes = [
    "/",
    "/auth",
    "/home",
    "/explore",
    "/reels",
    "/create",
    "/activity",
    "/messages",
    "/settings",
    "/profile",
    "/ai",
  ];

  for (const r of routes) {
    await checkRoute(r, r === "/auth" ? 307 : 200);
  }

  // 2. Dynamic routes
  await checkRoute("/p/seed_post_1", 200);
  await checkRoute("/u/maya_creates", 200);
  await checkRoute("/tag/designinspo", 200);

  // 3. Client bundle compilation
  const clientEntry = await fetch(`${BASE_URL}/@id/virtual:tanstack-start-dev-client-entry`);
  assert.strictEqual(clientEntry.status, 200, "Client entry should compile with 200");
  const clientEntryText = await clientEntry.text();
  assert.ok(clientEntryText.length > 50, "Client entry bundle should have content");
  console.log("✓ Vite dev server bundle compilation verified");

  // 4. Check HTML structure of /home
  const homeRes = await fetch(`${BASE_URL}/home`);
  const html = await homeRes.text();
  assert.ok(html.includes("Opexnal"), "HTML should contain Opexnal title/meta");
  assert.ok(html.includes("tanstack-start-dev-client-entry"), "HTML should include client script");
  console.log("✓ HTML SSR entry and hydration tags verified");

  console.log("\nAll live server endpoint checks PASSED!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
