import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const evidenceDir = process.env.SCZN3_STORAGE_EVIDENCE_DIR || "/private/tmp/sczn3-storage-cyan-evidence";
await mkdir(evidenceDir, { recursive: true });
const appState = await readFile("app_state.js", "utf8");
const universalCss = await readFile("tst12-universal-experience.css", "utf8");

const browser = await chromium.launch({
  headless: true,
  ...(process.env.SCZN3_CHROMIUM_EXECUTABLE ? { executablePath: process.env.SCZN3_CHROMIUM_EXECUTABLE } : {})
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route("https://sczn3-quota-test.invalid/**", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><body></body></html>"
  }));
  await page.goto("https://sczn3-quota-test.invalid/");
  await page.evaluate(() => {
    localStorage.setItem("SCZN3_EXISTING_HISTORY_SENTINEL", JSON.stringify({ preserved: true }));
    window.__storageEvents = [];
    window.addEventListener("sczn3:browser-storage-unavailable", event => window.__storageEvents.push(event.detail));
    let lastError = null;
    for (const size of [240_000, 50_000, 5_000, 500, 50, 5]) {
      const block = "x".repeat(size);
      for (let index = 0; index < 200; index += 1) {
        try { localStorage.setItem(`SATURATION_${size}_${index}`, block); }
        catch (error) {
          lastError = error;
          break;
        }
      }
    }
    window.__quotaEvidence = { name: lastError && lastError.name, message: lastError && lastError.message, entries: localStorage.length };
  });
  await page.addScriptTag({ content: appState });
  const continuity = await page.evaluate(() => {
    const before = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      before[key] = localStorage.getItem(key);
    }
    const authority = {
      ok: true,
      authoritativeSessionId: "browser-quota-authority-001",
      sessionLifecycle: "created",
      sessionMode: "simulation",
      target: { targetId: "baker_tst12_17_5x23", targetAuthorityId: "baker_tst12_17_5x23", targetName: "TST-12 17.5 × 23", targetProfileVersion: "test-v1" },
      missionIdentity: { missionFamily: "targetScoring", missionId: "tst12-score", resultPackageType: "target_score" },
      governedDistance: { value: 10, unit: "YDS", locked: false },
      selectedEquipment: { source: "shooter-selected", weaponCategory: "Rifle", modelCaliber: ".223" }
    };
    const matrix = { targetProfileId: "baker_tst12_17_5x23", targetName: "TST-12 17.5 × 23", missionFamily: "targetScoring", experienceMode: "simulation" };
    const created = window.SCZN3M4.createAuthoritativeSession(authority, matrix);
    const updated = window.SCZN3M4.updateSessionById(created.sessionId, {
      observations: [{ observationId: "browser-observation-001", stationRegionId: "station_1_square", x: 0.5, y: 0.5 }]
    });
    const after = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      after[key] = localStorage.getItem(key);
    }
    return {
      quota: window.__quotaEvidence,
      sessionId: created.sessionId,
      sessionIdAuthority: created.sessionIdAuthority,
      observationIds: updated.observations.map(item => item.observationId),
      warningEvents: window.__storageEvents,
      storageUnchanged: JSON.stringify(before) === JSON.stringify(after),
      sentinel: JSON.parse(localStorage.getItem("SCZN3_EXISTING_HISTORY_SENTINEL"))
    };
  });
  assert.equal(continuity.quota.name, "QuotaExceededError");
  assert.equal(continuity.sessionIdAuthority, "backend");
  assert.deepEqual(continuity.observationIds, ["browser-observation-001"]);
  assert.equal(continuity.warningEvents.length, 2);
  assert.equal(continuity.warningEvents[0].storageMode, "memory_only");
  assert.equal(continuity.storageUnchanged, true);
  assert.equal(continuity.sentinel.preserved, true);

  const layout = [];
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.setContent(`<!doctype html><html><head><style>${universalCss}</style></head><body data-tst12-experience="true"><main style="width:min(100%,460px);margin:auto"><div class="tst12-round-progress" id="tst12RoundProgress"><strong class="tst12-round-instruction">TAP WHERE YOUR SHOTS HIT</strong><span class="tst12-round-counts"><span class="tst12-round-metric">STATION <b class="tst12-round-value">3</b></span><i class="tst12-round-separator">|</i><span class="tst12-round-metric">RECORDED <b class="tst12-round-value">0</b></span><i class="tst12-round-separator">|</i><span class="tst12-round-metric">TOTAL <b class="tst12-round-value">0</b></span></span></div></main></body></html>`);
    const measurement = await page.locator("#tst12RoundProgress").evaluate(element => {
      const counts = element.querySelector(".tst12-round-counts");
      const instruction = element.querySelector(".tst12-round-instruction");
      const label = element.querySelector(".tst12-round-metric");
      const value = element.querySelector(".tst12-round-value");
      const instructionRect = instruction.getBoundingClientRect();
      const countsRect = counts.getBoundingClientRect();
      return {
        width: window.innerWidth,
        progressClientWidth: element.clientWidth,
        progressScrollWidth: element.scrollWidth,
        countsClientWidth: counts.clientWidth,
        countsScrollWidth: counts.scrollWidth,
        instructionBottom: instructionRect.bottom,
        countsTop: countsRect.top,
        labelFontSize: parseFloat(getComputedStyle(label).fontSize),
        valueFontSize: parseFloat(getComputedStyle(value).fontSize),
        valueFontWeight: Number(getComputedStyle(value).fontWeight)
      };
    });
    console.log("LAYOUT", JSON.stringify(measurement));
    assert.equal(measurement.width, width);
    assert.ok(measurement.progressScrollWidth <= measurement.progressClientWidth + 1, `${width}px progress must not clip`);
    assert.ok(measurement.countsScrollWidth <= measurement.countsClientWidth + 1, `${width}px counts must not clip`);
    assert.ok(measurement.instructionBottom <= measurement.countsTop + 1, `${width}px counts must render below the instruction`);
    assert.ok(measurement.valueFontSize > measurement.labelFontSize, `${width}px count values must outweigh labels`);
    assert.ok(measurement.valueFontWeight >= 900, `${width}px count values must be prominent`);
    await page.screenshot({ path: path.join(evidenceDir, `cyan-status-${width}.png`), fullPage: true });
    layout.push(measurement);
  }

  console.log(JSON.stringify({ verdict: "PASS", browser: await browser.version(), continuity, layout, evidenceDir }, null, 2));
} finally {
  await browser.close();
}
