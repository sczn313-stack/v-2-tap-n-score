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
    await page.getByRole("button", { name: "NEXT — KNOW YOUR SIGHTS", exact: true }).click();
    await page.locator('[data-control="chapters"]').click();
    await page.getByRole("button", { name: /Let Tap-n-Score show you/ }).click();
    assert.equal(await page.locator("[data-demo-proof], [data-audio-proof], [data-step-proof], [data-player-proof]").count(), 0, `development instrumentation is absent at ${viewport.width}px`);
    const demo = page.frameLocator("#chapterThreeRuntime");
    await demo.locator("#markSurface > img").waitFor({ timeout: 30000 });
    assert.equal(await demo.locator("html").getAttribute("data-tstt-page-zoom"), "locked", `embedded TSTT page zoom is locked at ${viewport.width}px`);
    assert.equal(await demo.locator("#chooseTargetButton").isVisible(), false, `Chapter 3 hides Add Photo at ${viewport.width}px`);
    assert.equal(await demo.locator("#precisionTapPhotoPicker").isVisible(), false, `Chapter 3 hides photo entry choices at ${viewport.width}px`);
    const sampleBadge = await demo.locator(".baker-sample-watermark").evaluate(element => {
      const style = getComputedStyle(element);
      return { color: style.color, fontSize: Number.parseFloat(style.fontSize), writingMode: style.writingMode, width: element.getBoundingClientRect().width };
    });
    assert.ok(sampleBadge.fontSize >= 36 && sampleBadge.width > 120, `SAMPLE is immediately readable on the target at ${viewport.width}px`);
    assert.match(sampleBadge.writingMode, /horizontal/);
    assert.match(sampleBadge.color, /rgba\([^)]*, 0\.17\)/, `SAMPLE remains translucent at ${viewport.width}px`);
    const targetViewport = demo.locator(".precision-tap-viewport");
    const calloutBox = await demo.locator(".baker-sample-demo-callout").boundingBox();
    const targetBox = await targetViewport.boundingBox();
    assert.ok(calloutBox && targetBox, "target and teaching overlay have measurable interaction areas");
    assert.equal(await demo.locator(".baker-sample-demo-layer").evaluate(element => getComputedStyle(element).pointerEvents), "none");
    const scaleBefore = Number(await targetViewport.getAttribute("data-precision-tap-scale"));
    await page.mouse.move(calloutBox.x + calloutBox.width / 2, calloutBox.y + calloutBox.height / 2);
    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(50);
    const scaleAfterOverlayZoom = Number(await targetViewport.getAttribute("data-precision-tap-scale"));
    assert.ok(scaleAfterOverlayZoom > scaleBefore, `target zoom works underneath the visible teaching overlay at ${viewport.width}px`);
    const transformBeforePan = await demo.locator(".precision-tap-plane").evaluate(element => element.style.transform);
    await page.mouse.move(targetBox.x + targetBox.width * .5, targetBox.y + targetBox.height * .72);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width * .36, targetBox.y + targetBox.height * .62, { steps: 5 });
    await page.mouse.up();
    const transformAfterPan = await demo.locator(".precision-tap-plane").evaluate(element => element.style.transform);
    assert.notEqual(transformAfterPan, transformBeforePan, `target pan works around the teaching overlay at ${viewport.width}px`);
    await demo.locator('#bakerSampleDemoLayer[data-demo-state="results"]').waitFor({ timeout: 30000 });
    assert.match(await demo.locator("#bakerSampleDemoScene").innerText(), /YOUR SIGHT ADJUSTMENT[\s\S]*REAR WINDAGE KNOB[\s\S]*8 CLICKS LEFT[\s\S]*FRONT SIGHT POST[\s\S]*4 CLICKS DOWN/);
    assert.equal(await demo.locator(".m16a2-demo-sight-photo img").count(), 2, `adjustment shows both approved hardware photographs at ${viewport.width}px`);
    await demo.locator('#bakerSampleDemoLayer[data-demo-state="begin-confirmation"]').waitFor({ timeout: 30000 });
    assert.match(await demo.locator("#bakerSampleDemoScene").innerText(), /SECOND PHOTO[\s\S]*SHOOT YOUR CONFIRMATION GROUP[\s\S]*Use this target or put up a new one[\s\S]*take another photo/i);
    assert.equal(await demo.locator(".m16a2-demo-confirmation-photo.is-entering img").count(), 1, `a distinct second photograph enters at ${viewport.width}px`);
    assert.equal(await demo.locator(".baker-sample-hole.is-confirmation").count(), 0, `confirmation holes do not appear before the second photograph at ${viewport.width}px`);
    await demo.locator('#bakerSampleDemoLayer[data-demo-state="confirmation"]').waitFor({ timeout: 30000 });
    assert.match(await demo.locator("#bakerSampleDemoScene").innerText(), /CONFIRMATION PHOTO[\s\S]*marks each shot on the new photograph/i);
    const confirmationHoleCenters = await demo.locator(".baker-sample-hole.is-confirmation").evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }));
    assert.equal(confirmationHoleCenters.length, 3, `three confirmation observations appear on the second photograph at ${viewport.width}px`);
    const closestConfirmationPair = Math.min(...confirmationHoleCenters.flatMap((point, index) => confirmationHoleCenters.slice(index + 1).map(other => Math.hypot(point.x - other.x, point.y - other.y))));
    assert.ok(closestConfirmationPair >= 12, `confirmation observations remain visually distinct at ${viewport.width}px`);
    await demo.locator('#bakerSampleDemoLayer[data-demo-state="save"]').waitFor({ timeout: 30000 });
    assert.match(await demo.locator("#bakerSampleDemoScene").innerText(), /300-METER SETTING[\s\S]*ONE CLICK COUNTERCLOCKWISE[\s\S]*BACK TO 8\/3/);
    assert.equal(await demo.locator(".m16a2-demo-sight-photo.is-rear-drum img").count(), 1);
    await demo.locator('#bakerSampleDemoLayer[data-demo-state="sec"]').waitFor({ timeout: 30000 });
    assert.match(await demo.locator(".baker-demo-preservation-caption").innerText(), /SHOOTER EXPERIENCE CARD[\s\S]*target, shots, adjustment, and confirmation are preserved together/i);
    assert.ok(Number.parseFloat(await demo.locator(".baker-demo-preservation-caption strong").evaluate(element => getComputedStyle(element).fontSize)) >= 15, `Shooter Experience Card is prominent at ${viewport.width}px`);
    await demo.locator('#bakerSampleDemoLayer[data-demo-state="vault"]').waitFor({ timeout: 30000 });
    assert.match(await demo.locator(".baker-demo-preservation-caption").innerText(), /BALLISTIC VAULT[\s\S]*complete shooting session is saved/i);
    assert.ok(Number.parseFloat(await demo.locator(".baker-demo-preservation-caption strong").evaluate(element => getComputedStyle(element).fontSize)) >= 15, `Ballistic Vault is prominent at ${viewport.width}px`);
    await demo.locator('#workspaceStageShell[data-player-status="completed"]').waitFor({ timeout: 120000 });
    const completionCardBox = await demo.locator(".baker-sample-stage-card").boundingBox();
    const completionTargetBox = await targetViewport.boundingBox();
    assert.ok(completionCardBox && completionTargetBox, "completion card and target have measurable bounds");
    assert.ok(Math.abs((completionCardBox.x + completionCardBox.width / 2) - (completionTargetBox.x + completionTargetBox.width / 2)) <= 2, `completion card is horizontally centered at ${viewport.width}px`);
    assert.ok(Math.abs((completionCardBox.y + completionCardBox.height / 2) - (completionTargetBox.y + completionTargetBox.height / 2)) <= 2, `completion card is vertically centered at ${viewport.width}px`);
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
      windageClicks: 8, windageDirection: "LEFT", windageTurnDirection: "COUNTERCLOCKWISE",
      elevationClicks: 4, elevationDirection: "DOWN", elevationTurnDirection: "COUNTERCLOCKWISE"
    });
    assert.ok(preservedSurfaceRequests.some(url => url.includes("view=sec")), "demo opens the existing SEC surface");
    assert.ok(preservedSurfaceRequests.some(url => url.includes("selected=")), "demo opens the existing Ballistic Vault record surface");
    assert.match(state.scene, /DEMONSTRATION COMPLETE[\s\S]*YOU'RE UP!!/);
    assert.doesNotMatch(state.scene, /Chapter 4 gives you the controls/);
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
