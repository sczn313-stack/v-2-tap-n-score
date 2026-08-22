import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const baker = await context.newPage();
    await baker.goto(`${baseUrl}/t/baker/sl-st1/`, { waitUntil: "domcontentloaded" });
    assert.equal((await baker.locator(".sl-header-target-identity").textContent()).trim(), "USPSA Practice Target");
    assert.equal((await baker.locator(".sl-printer").textContent()).trim(), "Baker Targets");
    assert.equal((await baker.locator("#targetName").textContent()).trim(), "Silhouette Target (USPSA)");

    const m4sec = await context.newPage();
    await m4sec.goto(`${baseUrl}/sec.html?reviewSession=003`, { waitUntil: "domcontentloaded" });
    assert.equal((await m4sec.locator(".sec-target-profile-identity").textContent()).trim(), "M4 25m Zero • 25 Meter Zero");
    assert.equal((await m4sec.locator(".sec-publisher-bar a").textContent()).trim(), "BakerTargets.com");

    for (const [id, expected] of [
      ["m4_25m_zero", "M4 25m Zero • 25 Meter Zero"],
      ["baker_st_100yd_smart_zero", "100 Yard Bullseye • 100 Yard Zero"],
      ["gssf_ac_1", "GSSF Practice"]
    ]) {
      const target = await context.newPage();
      const sessionId = `item2-${id}-${viewport.width}`;
      await target.addInitScript(({ id, sessionId }) => {
        const session = {
          persistenceSchema: "sczn3-canonical-session-v1",
          sessionId,
          authoritativeSessionId: sessionId,
          sessionIdAuthority: "backend",
          sessionNumber: 1,
          sessionLabel: "Session #001",
          sessionNumberAuthority: "device-local-temporary",
          timestamp: "2026-08-16T12:00:00-04:00",
          targetProfileId: id,
          target_profile_id: id,
          matrixSnapshot: { targetProfileId: id, target_profile_id: id }
        };
        localStorage.setItem(`SCZN3_SESSION_RECORD_${encodeURIComponent(sessionId)}`, JSON.stringify(session));
        localStorage.setItem("SCZN3_ACTIVE_SESSION", JSON.stringify({ persistenceSchema: "sczn3-session-ref-v1", sessionId }));
        localStorage.setItem("SCZN3_SESSION_HISTORY", JSON.stringify([{ persistenceSchema: "sczn3-session-ref-v1", sessionId }]));
      }, { id, sessionId });
      await target.goto(`${baseUrl}/shoot.html?session=${encodeURIComponent(sessionId)}&target_profile_id=${encodeURIComponent(id)}`, { waitUntil: "domcontentloaded" });
      await target.waitForFunction(() => window.SCZN3TargetProfiles && document.getElementById("targetHeaderIdentity"));
      const actual = await target.locator("#targetHeaderIdentity").textContent();
      assert.equal(actual.trim(), expected, `${id} uses the governed profile identity at ${viewport.width}px`);
      assert.equal(actual.includes("Baker"), false, `${id} persistent profile identity remains publisher-neutral`);
      await target.close();
    }
    await context.close();
    console.log(`PASS Episode 54 Item 2 visible identity separation at ${viewport.width}px`);
  }
} finally {
  await browser.close();
}
