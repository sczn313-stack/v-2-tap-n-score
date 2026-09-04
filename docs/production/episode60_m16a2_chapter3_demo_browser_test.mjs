import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8098";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(() => {
      const voices = [{ name: "Samantha", lang: "en-US", localService: true, default: true }];
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          cancel() {}, pause() {}, resume() {}, getVoices() { return voices; },
          speak(utterance) { window.setTimeout(() => utterance.onend && utterance.onend(), 5); }
        }
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: class { constructor(text) { this.text = text; } }
      });
    });
    const page = await context.newPage();
    const errors = [];
    const preservedSurfaceRequests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
      if (/records\.html\?.*(?:view=sec|selected=)/.test(request.url())) preservedSurfaceRequests.push(request.url());
    });
    await page.goto(`${baseUrl}/shoot.html?target_profile_id=baker_m16a2_25m_zero&prepared_demo=1&talking_demo=1&m16a2_demo=1&autoplay=1&founder_review=1`, { waitUntil: "networkidle" });
    await page.locator('#workspaceStageShell[data-player-status="completed"]').waitFor({ timeout: 120000 });

    assert.match(await page.locator("#markSurface > img").getAttribute("src"), /BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg$/);
    const state = await page.evaluate(() => ({
      states: window.__SCZN3_PREPARED_DEMO_STATES__ || [],
      session: JSON.parse(sessionStorage.getItem("SCZN3_TALKING_TARGET_DEMO_SESSION") || "null"),
      scene: document.getElementById("bakerSampleDemoScene")?.innerText || "",
      href: document.querySelector(".prepared-demo-return")?.getAttribute("href") || "",
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    for (const expected of ["aim", "shoot-observations", "group-center", "vector", "results", "confirmation", "save", "sec", "vault", "complete"]) {
      assert.ok(state.states.includes(expected), `prepared demo includes ${expected} at ${viewport.width}px`);
    }
    assert.equal(state.session.savedToSEC, true);
    assert.equal(state.session.preservationStatus, "saved");
    assert.equal(state.session.experienceMode, "demonstration");
    assert.equal(state.session.simulation, false);
    assert.equal(state.session.confirmationAuthorityPackage.validation.confirmed, true);
    assert.equal(state.session.authorityPackage.mechanicalSightAuthority.adjustmentProfileId, "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011");
    assert.deepEqual({
      windageClicks: state.session.authorityPackage.clicks.windageClicks,
      windageDirection: state.session.authorityPackage.clicks.windageDirection,
      windageTurnDirection: state.session.authorityPackage.clicks.windageTurnDirection,
      elevationClicks: state.session.authorityPackage.clicks.elevationClicks,
      elevationDirection: state.session.authorityPackage.clicks.elevationDirection,
      elevationTurnDirection: state.session.authorityPackage.clicks.elevationTurnDirection
    }, {
      windageClicks: 5, windageDirection: "LEFT", windageTurnDirection: "COUNTERCLOCKWISE",
      elevationClicks: 2, elevationDirection: "DOWN", elevationTurnDirection: "COUNTERCLOCKWISE"
    });
    assert.ok(preservedSurfaceRequests.some(url => url.includes("view=sec")), "demo opens the existing SEC surface");
    assert.ok(preservedSurfaceRequests.some(url => url.includes("selected=")), "demo opens the existing Ballistic Vault record surface");
    assert.match(state.scene, /DEMONSTRATION COMPLETE[\s\S]*YOUR TURN/);
    assert.equal(state.href, "m16a2-tstt.html?chapter=4");
    assert.equal(state.overflow, false);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("PASS Episode 60 Chapter 3 prepared M16A2 demonstration at 1440px and 390px");
} finally {
  await browser.close();
}
