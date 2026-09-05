import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { stat } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8098";
const chapterThreeAudioPaths = [
  "assets/audio/episode60/chapter3/01-intro.wav",
  "assets/audio/episode60/chapter3/02-aim.wav",
  "assets/audio/episode60/chapter3/03-shot-observations.wav",
  "assets/audio/episode60/chapter3/04-authority.wav",
  "assets/audio/episode60/chapter3/05-pattern-center.wav",
  "assets/audio/episode60/chapter3/06-measurement.wav",
  "assets/audio/episode60/chapter3/07-adjustment.wav",
  "assets/audio/episode60/chapter3/08-begin-confirmation.wav",
  "assets/audio/episode60/chapter3/09-confirmation-shots.wav",
  "assets/audio/episode60/chapter3/10-confirmed-zero.wav",
  "assets/audio/episode60/chapter3/11-finalize-drum.wav",
  "assets/audio/episode60/chapter3/12-sec.wav",
  "assets/audio/episode60/chapter3/13-vault.wav",
  "assets/audio/episode60/chapter3/14-complete.wav"
];
for (const path of chapterThreeAudioPaths) assert.ok((await stat(path)).size > 4096, `${path} contains rendered audio frames`);
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(() => {
      window.__m16SpeechCalls = [];
      window.__m16AudioPlayback = [];
      class TestAudio {
        constructor() { this.src = ""; this.currentTime = 0; this.paused = true; this.onended = null; this.onerror = null; }
        play() {
          this.paused = false;
          window.__m16AudioPlayback.push(this.src);
          window.setTimeout(() => { this.paused = true; if (this.onended) this.onended(); }, 5);
          return Promise.resolve();
        }
        pause() { this.paused = true; }
      }
      Object.defineProperty(window, "Audio", { configurable: true, value: TestAudio });
      const voices = [{ name: "Samantha", lang: "en-US", localService: true, default: true }];
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          cancel() { window.__m16SpeechCalls.push("cancel"); },
          pause() { window.__m16SpeechCalls.push("pause"); },
          resume() { window.__m16SpeechCalls.push("resume"); },
          getVoices() { return voices; },
          speak() { window.__m16SpeechCalls.push("speak"); }
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
    await page.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "START TRAINING", exact: true }).click();
    await page.getByRole("button", { name: "NEXT, WE'LL LEARN THE SIGHTS.", exact: true }).click();
    await page.locator('[data-control="chapters"]').click();
    await page.getByRole("button", { name: /Let Tap-n-Score show you/ }).click();
    const demo = page.frameLocator("#chapterThreeRuntime");
    await demo.locator('#workspaceStageShell[data-player-status="completed"]').waitFor({ timeout: 120000 });
    const demoFrame = page.frames().find(frame => frame.url().includes("embedded_tstt=1"));
    assert.ok(demoFrame, "the same-origin Chapter 3 runtime is present");

    assert.match(await demo.locator("#markSurface > img").getAttribute("src"), /BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg$/);
    const state = await demoFrame.evaluate(() => ({
      states: window.__SCZN3_PREPARED_DEMO_STATES__ || [],
      session: JSON.parse(sessionStorage.getItem("SCZN3_TALKING_TARGET_DEMO_SESSION") || "null"),
      scene: document.getElementById("bakerSampleDemoScene")?.innerText || "",
      href: document.querySelector(".prepared-demo-return")?.getAttribute("href") || "",
      audio: window.__m16AudioPlayback || [],
      speechCalls: window.__m16SpeechCalls || [],
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
    const demoAudio = state.audio.slice(-14);
    assert.deepEqual(demoAudio, chapterThreeAudioPaths, "every Chapter 3 Samantha clip plays exactly once and in choreography order");
    assert.deepEqual(state.speechCalls, [], "Chapter 3 never calls Web Speech");
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

  const directContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await directContext.addInitScript(() => {
    const voices = [{ name: "Samantha", lang: "en-US", localService: true, default: true }];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, pause() {}, resume() {}, getVoices() { return voices; }, speak() {} } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
  });
  const directPage = await directContext.newPage();
  await directPage.goto(`${baseUrl}/m16a2-tstt.html?chapter=3`, { waitUntil: "networkidle" });
  assert.equal(await directPage.locator("[data-start-chapter-three]").isVisible(), true, "direct Chapter 3 entry waits for the required user gesture");
  await directPage.locator("[data-start-chapter-three]").click();
  const directDemo = directPage.frameLocator("#chapterThreeRuntime");
  await directDemo.locator('#workspaceStageShell[data-player-status="playing"]').waitFor({ timeout: 30000 });
  assert.equal(await directDemo.locator(".m16a2-tstt-demo-controls").count(), 1);
  await directContext.close();
  console.log("PASS Episode 60 Chapter 3 prepared M16A2 demonstration at 1440px and 390px");
} finally {
  await browser.close();
}
