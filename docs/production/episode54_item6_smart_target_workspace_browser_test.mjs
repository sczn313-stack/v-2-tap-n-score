import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const targetFixture = path.resolve("authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp");
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

async function seedTarget(page, targetProfileId, sessionId) {
  await page.addInitScript(({ targetProfileId, sessionId }) => {
    const session = {
      persistenceSchema: "sczn3-canonical-session-v1",
      sessionId,
      authoritativeSessionId: sessionId,
      sessionIdAuthority: "backend",
      sessionNumber: 1,
      sessionLabel: "Session #001",
      timestamp: "2026-08-16T12:00:00-04:00",
      targetProfileId,
      target_profile_id: targetProfileId,
      matrixSnapshot: { targetProfileId, target_profile_id: targetProfileId }
    };
    localStorage.setItem(`SCZN3_SESSION_RECORD_${encodeURIComponent(sessionId)}`, JSON.stringify(session));
    localStorage.setItem("SCZN3_ACTIVE_SESSION", JSON.stringify({ persistenceSchema: "sczn3-session-ref-v1", sessionId }));
    localStorage.setItem("SCZN3_SESSION_HISTORY", JSON.stringify([{ persistenceSchema: "sczn3-session-ref-v1", sessionId }]));
  }, { targetProfileId, sessionId });
}

async function assertContained(page, rootSelector, evidenceSelector, actionSelector) {
  const geometry = await page.evaluate(({ rootSelector, evidenceSelector, actionSelector }) => {
    const root = document.querySelector(rootSelector);
    const evidence = document.querySelector(evidenceSelector);
    const actions = document.querySelector(actionSelector);
    const rootRect = root.getBoundingClientRect();
    const evidenceRect = evidence.getBoundingClientRect();
    const actionRect = actions.getBoundingClientRect();
    const visualBottom = (visualViewport?.offsetTop || 0) + (visualViewport?.height || innerHeight);
    return {
      owner: root.dataset.sczn3WorkspaceOwner,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      evidenceWidth: evidenceRect.width,
      evidenceHeight: evidenceRect.height,
      rootBottom: rootRect.bottom,
      actionBottom: actionRect.bottom,
      visualBottom
    };
  }, { rootSelector, evidenceSelector, actionSelector });
  assert.equal(geometry.owner, "SCZN3SmartTargetWorkspace");
  assert.ok(geometry.overflow <= 1, `no horizontal overflow (${geometry.overflow}px)`);
  assert.ok(geometry.evidenceWidth > 0 && geometry.evidenceHeight > 0, "workspace evidence remains visible");
  assert.ok(geometry.actionBottom <= geometry.visualBottom + 1, "action region remains inside the visible viewport");
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport });

    const baker = await context.newPage();
    await baker.goto(`${baseUrl}/t/baker/sl-st1/?v=episode54-item6`, { waitUntil: "domcontentloaded" });
    assert.equal(await baker.locator("#targetWorkspace").isHidden(), true, "USPSA workspace remains concealed before evidence selection");
    await baker.locator("#libraryInput").setInputFiles(targetFixture);
    await baker.locator("#targetWorkspace:not([hidden])").waitFor();
    await baker.waitForFunction(() => {
      const image = document.getElementById("targetImage");
      return image?.complete && image.naturalWidth > 0;
    });
    assert.equal((await baker.locator(".sl-header-target-identity").textContent()).trim(), "USPSA Practice Target");
    await assertContained(baker, "#targetWorkspace", "#imageFrame", "#workflowDock");

    for (const [targetProfileId, expectedIdentity, photoRequired] of [
      ["m4_25m_zero", "M4 25m Zero • 25 Meter Zero", true],
      ["baker_st_100yd_smart_zero", "100 Yard Bullseye • 100 Yard Zero", true],
      ["gssf_ac_1", "GSSF Practice", false]
    ]) {
      const page = await context.newPage();
      const sessionId = `item6-${targetProfileId}-${viewport.width}`;
      await seedTarget(page, targetProfileId, sessionId);
      await page.goto(`${baseUrl}/shoot.html?session=${encodeURIComponent(sessionId)}&target_profile_id=${encodeURIComponent(targetProfileId)}&v=episode54-item6`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.getElementById("workspaceStageShell")?.dataset.sczn3WorkspaceOwner === "SCZN3SmartTargetWorkspace");
      assert.equal((await page.locator("#targetHeaderIdentity").textContent()).trim(), expectedIdentity);
      if (photoRequired) {
        await page.locator("#targetImageInput").setInputFiles(targetFixture);
        await page.locator("#markSurface:not([hidden])").waitFor();
        await page.waitForFunction(() => document.querySelector("#markSurface img")?.naturalWidth > 0);
      }
      const ownership = await page.evaluate(() => ({
        root: document.getElementById("workspaceStageShell").dataset.sczn3WorkspaceOwner,
        evidence: document.getElementById("targetEvidencePreview").dataset.sczn3WorkspaceEvidence,
        actions: document.querySelector(".workflow-control-row").dataset.sczn3WorkspaceActions,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      }));
      assert.deepEqual(ownership, { root: "SCZN3SmartTargetWorkspace", evidence: "true", actions: "true", overflow: 0 });
      await page.close();
    }

    await context.close();
    console.log(`PASS Episode 54 Item 6 four-target inheritance at ${viewport.width}px`);
  }

  const shortContext = await browser.newContext({ viewport: { width: 1050, height: 417 } });
  const shortPage = await shortContext.newPage();
  await shortPage.goto(`${baseUrl}/t/baker/sl-st1/?v=episode54-item6-short`, { waitUntil: "domcontentloaded" });
  await shortPage.locator("#libraryInput").setInputFiles(targetFixture);
  await shortPage.locator("#targetWorkspace:not([hidden])").waitFor();
  await assertContained(shortPage, "#targetWorkspace", "#imageFrame", "#workflowDock");
  await shortContext.close();
  console.log("PASS Episode 54 Item 6 short-height containment");
} finally {
  await browser.close();
}
