import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const { chromium } = createRequire(import.meta.url)("playwright");
const origin = process.env.SCZN3_TST12_ORIGIN;
assert.ok(origin, "SCZN3_TST12_ORIGIN is required; no default listener is permitted");
const parsed = new URL(origin);
assert.equal(parsed.hostname, "127.0.0.1", "the release gate requires the authorized loopback host");
assert.equal(parsed.port, "8272", "the release gate requires the Founder-authorized port 8272");

async function prepare(payload) {
  const response = await fetch(`${origin}/api/session/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return { status: response.status, body: await response.json() };
}

for (const [targetId, experienceMode] of [
  ["baker_tst12_17_5x23", "simulation"],
  ["baker_tst12_17_5x23", "actual"],
  ["baker_tst12_23x35", "simulation"]
]) {
  const result = await prepare({ targetId, missionFamily: "targetScoring", experienceMode });
  assert.equal(result.status, 200, `${targetId} ${experienceMode} prepares`);
  assert.equal(result.body.experienceMode, experienceMode);
  assert.equal(result.body.experienceAvailabilityPolicyId, "sczn3-tst12-three-path-release-20261109-1");
}

const withheld = await prepare({
  targetId: "baker_tst12_23x35",
  missionFamily: "targetScoring",
  experienceMode: "actual"
});
assert.equal(withheld.status, 409);
assert.equal(withheld.body.status, "experience_unavailable");
assert.equal(withheld.body.reason, "experience_mode_not_available");

const missing = await prepare({ targetId: "baker_tst12_17_5x23", missionFamily: "targetScoring" });
assert.equal(missing.status, 400);
assert.equal(missing.body.reason, "experience_mode_required");

const malformed = await prepare({
  targetId: "baker_tst12_17_5x23",
  missionFamily: "targetScoring",
  experienceMode: "practice"
});
assert.equal(malformed.status, 400);
assert.equal(malformed.body.reason, "experience_mode_invalid");

const unaffected = await prepare({ targetId: "m4_25m_zero" });
assert.equal(unaffected.status, 200, "an existing non-TST-12 target retains its missing-mode contract");

const systemChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(systemChrome) ? { executablePath: systemChrome } : {})
});
try {
  const context = await browser.newContext();
  for (const [query, expectedReason] of [
    ["target=baker_tst12_23x35&missionFamily=targetScoring&experienceMode=actual", "experience_mode_not_available"],
    ["target=baker_tst12_17_5x23&missionFamily=targetScoring", "experience_mode_required"],
    ["target=baker_tst12_17_5x23&missionFamily=targetScoring&experienceMode=practice", "experience_mode_invalid"]
  ]) {
    const page = await context.newPage();
    let preparationRequests = 0;
    page.on("request", request => {
      if (request.method() === "POST" && new URL(request.url()).pathname === "/api/session/prepare") preparationRequests += 1;
    });
    await page.goto(`${origin}/target-experience.html?${query}`, { waitUntil: "domcontentloaded" });
    const unavailable = page.locator(".tst12-experience-unavailable");
    await unavailable.waitFor({ state: "visible" });
    assert.equal(await unavailable.getAttribute("data-tst12-unavailable-reason"), expectedReason);
    assert.equal(preparationRequests, 0, `${expectedReason} creates no browser preparation request`);
    assert.equal(await page.locator("#contractStart").isVisible(), false);
    assert.equal(await page.locator("#contractCapture").isVisible(), false);
    await page.close();
  }
  await context.close();
} finally {
  await browser.close();
}

console.log("PASS three approved preparations, withheld/missing/malformed fail closed, non-TST-12 unaffected, direct URLs never initialize");
