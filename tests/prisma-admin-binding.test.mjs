import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("admin UIDs are bound from production as a secret instead of optional plain config", () => {
  const moduleText = source("../module.ts");
  assert.match(moduleText, /adminUids:\s*envSecret\("ADMIN_UIDS"\)/);
  assert.doesNotMatch(moduleText, /adminUids:\s*envParam/);
});

test("admin service input is required, so missing env blocks deployment", () => {
  const serviceText = source("../backend/service.ts");
  assert.match(serviceText, /adminUids:\s*secretString\(\)/);
  assert.doesNotMatch(serviceText, /["']adminUids\?["']/);
});

test("composer runtime unwraps secret; legacy backend fallback remains intact", () => {
  const adapter = source("../backend/prisma-server.ts");
  assert.match(adapter, /ADMIN_UIDS:\s*input\.adminUids\.expose\(\)/);
  const backend = source("../backend/server.js");
  assert.match(backend, /parseAdminUids\(runtimeConfig\.ADMIN_UIDS\)/);
  assert.match(backend, /const RELEASE_VERSION = "cloud-rewards-v7"/);
});
