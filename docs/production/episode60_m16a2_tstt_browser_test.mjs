import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8093";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__speechSynthesisCalls = [];
      window.__tsttAudio = [];
      class ControlledAudio {
        constructor() {
          this.src = "";
          this.paused = true;
          this.onplay = null;
          this.onended = null;
          this.onerror = null;
          window.__tsttAudio.push(this);
        }
        play() {
          this.paused = false;
          queueMicrotask(() => this.onplay?.());
          return Promise.resolve();
        }
        pause() { this.paused = true; }
        finish() {
          this.paused = true;
          this.onended?.();
        }
      }
      Object.defineProperty(window, "Audio", { configurable: true, value: ControlledAudio });
      const voices = [
        { name: "Albert", lang: "en-US", localService: true, default: true },
        { name: "Daniel", lang: "en-GB", localService: true, default: false },
        { name: "Samantha", lang: "en-US", voiceURI: "com.apple.voice.compact.en-US.Samantha", localService: true, default: false },
        { name: "Reed (English (US))", lang: "en-US", voiceURI: "com.apple.eloquence.en-US.Reed", localService: true, default: false }
      ];
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() { window.__speechSynthesisCalls.push("cancel"); }, speak() { window.__speechSynthesisCalls.push("speak"); }, pause() { window.__speechSynthesisCalls.push("pause"); }, resume() { window.__speechSynthesisCalls.push("resume"); }, getVoices() { return voices; }, speaking: false } });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
      localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "founder-m16a2");
      localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
        setupId: "founder-m16a2",
        setupName: "M16A2 • STANDARD IRON SIGHTS",
        weaponModelType: "M16A2",
        opticType: "Iron Sights",
        equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
        adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
      }]));
    });
    await page.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });

    assert.match(await page.locator('meta[name="viewport"]').getAttribute("content"), /maximum-scale=1[\s\S]*user-scalable=no/);
    assert.equal(await page.locator("html").getAttribute("data-tstt-page-zoom"), "locked");
    assert.equal(await page.locator("html").evaluate(element => getComputedStyle(element).touchAction), "pan-x pan-y");
    const blockedPageGestures = await page.evaluate(() => {
      const gesture = new Event("gesturestart", { bubbles: true, cancelable: true });
      document.dispatchEvent(gesture);
      const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -100 });
      document.dispatchEvent(wheel);
      return { gesture: gesture.defaultPrevented, wheel: wheel.defaultPrevented };
    });
    assert.deepEqual(blockedPageGestures, { gesture: true, wheel: true }, `outer TSTT page pinch gestures are blocked at ${viewport.width}px`);
    assert.equal(await page.locator("#runtimeVoiceStatus, #runtimeVoiceCheck, .voice-diagnostic").count(), 0);
    assert.equal(await page.locator("#targetIdentity").innerText(), "25 METERS ZEROING TARGET\nM16A2");
    assert.equal(await page.locator("#lessonProgress > span").count(), 4);
    assert.match(await page.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply/);
    assert.equal(await page.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
    assert.equal(await page.locator("#lessonSummary").isHidden(), false);
    assert.equal(await page.locator("#lessonTitle").innerText(), "KNOW YOUR TARGET.");
    assert.equal(await page.locator("#lessonSummary").innerText(), "Before making any sight adjustments, understand what this target is telling you.");
    assert.match(await page.locator("#visualStage").innerText(), /AIM POINT[\s\S]*Always make the center crosshairs your aim point[\s\S]*READ THE GRID[\s\S]*Each small square measures[\s\S]*READ THE CLICKS[\s\S]*columns represents one front-sight up-or-down click[\s\S]*rows represents three rear-windage clicks[\s\S]*FIRE THE SHOT PATTERN[\s\S]*THE CENTER OF YOUR SHOT PATTERN[\s\S]*LET TAP-N-SCORE READ IT/);
    await page.getByRole("button", { name: "START SESSION", exact: true }).click();
    await page.waitForFunction(() => window.__tsttAudio.length === 1);
    assert.match(await page.evaluate(() => window.__tsttAudio.at(-1).src), /assets\/audio\/episode60\/chapter1\/01\.wav$/);
    assert.deepEqual(await page.evaluate(() => window.__speechSynthesisCalls), ["cancel", "cancel"], "Chapter 1 uses native audio instead of Web Speech");
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "RESUME");
    assert.equal(await page.evaluate(() => window.__tsttAudio.at(-1).paused), true);
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "PAUSE");
    assert.equal(await page.evaluate(() => window.__tsttAudio.at(-1).paused), false);
    assert.equal(await page.getByRole("button", { name: "THIS MATCHES MY GEAR", exact: true }).count(), 0);
    await page.locator("#shootingSetup").click();
    assert.equal(await page.locator("#sessionDistance").inputValue(), "25");
    assert.equal(await page.locator("#sessionDistanceUnit").inputValue(), "METERS");
    assert.equal(await page.locator("#sessionAdjustmentUnit").inputValue(), "MOA");
    assert.equal(await page.locator("#sessionAdjustmentIncrement").inputValue(), "Elevation 1.25 · Windage 0.5");
    assert.equal(await page.getByText("NEXT CHAPTER", { exact: true }).count(), 0);
    for (let index = 0; index < 9; index += 1) {
      const expectedPath = `chapter1/${String(index + 1).padStart(2, "0")}.wav`;
      assert.ok((await page.evaluate(() => window.__tsttAudio.at(-1).src)).endsWith(expectedPath));
      if (index === 3) assert.equal(await page.locator('[data-grid-cue="columns"]').getAttribute("class"), "grid-teaching-cue is-column is-active");
      if (index === 4) assert.equal(await page.locator('[data-grid-cue="rows"]').getAttribute("class"), "grid-teaching-cue is-row is-active");
      const count = await page.evaluate(() => window.__tsttAudio.length);
      await page.evaluate(() => window.__tsttAudio.at(-1).finish());
      if (index < 8) await page.waitForFunction(previous => window.__tsttAudio.length > previous, count);
    }
    await page.waitForFunction(() => document.getElementById("chapterNumber")?.textContent === "CHAPTER 2 OF 4");
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 4");
    assert.equal(await page.locator("#lessonTitle").innerText(), "KNOW YOUR SIGHTS.");
    assert.match(await page.locator("#visualStage").innerText(), /FRONT SIGHT POST[\s\S]*Controls elevation — moves your shot pattern up or down\.[\s\S]*REAR WINDAGE KNOB[\s\S]*Controls windage — moves your shot pattern right or left\.[\s\S]*REAR ELEVATION DRUM[\s\S]*For your 25-meter zero, set the drum to 8\/3, then turn it one click CLOCKWISE past 8\/3\.[\s\S]*After your zero is confirmed, turn it one click COUNTERCLOCKWISE back to 8\/3 for the 300-meter setting\./);
    assert.equal(await page.locator("#visualStage .sight-card").count(), 3);
    assert.equal(await page.locator("#visualStage .sight-photo img").count(), 3);
    assert.equal(await page.locator("#visualStage svg").count(), 0);
    assert.equal(await page.locator("#taskCard:visible").count(), 0);
    assert.equal(await page.getByRole("button", { name: "I CAN FIND THE THREE SIGHTS", exact: true }).count(), 0);
    assert.equal(await page.locator("#visualStage .sight-recap").count(), 0);
    assert.equal(await page.locator("#visualStage .sight-intro, #visualStage .sight-job, #visualStage .drum-sequence, #visualStage figcaption, #visualStage .review-asset-note").count(), 0);
    assert.doesNotMatch(await page.locator("#visualStage").innerText(), /\bFIND\b|\bJOB\b|FOUNDER REVIEW REFERENCES/);
    assert.match(await page.locator("#visualStage").innerText(), /Now you know which sight controls you'll adjust when Tap-n-Score tells you how to move your shot pattern\./);
    assert.equal(await page.getByText("NEXT CHAPTER", { exact: true }).count(), 0);
    for (let index = 0; index < 5; index += 1) {
      const expectedPath = `chapter2/${String(index + 1).padStart(2, "0")}.wav`;
      assert.ok((await page.evaluate(() => window.__tsttAudio.at(-1).src)).endsWith(expectedPath));
      const count = await page.evaluate(() => window.__tsttAudio.length);
      await page.evaluate(() => window.__tsttAudio.at(-1).finish());
      if (index < 4) await page.waitForFunction(previous => window.__tsttAudio.length > previous, count);
    }
    const demo = page.frameLocator("#chapterThreeRuntime");
    await demo.locator('#workspaceStageShell[data-player-status="playing"]').waitFor({ timeout: 30000 });
    assert.equal(await demo.locator("html").getAttribute("data-tstt-page-zoom"), "locked", "embedded Chapter 3 shell also blocks browser page zoom");
    assert.match(page.url(), /m16a2-tstt\.html$/);
    assert.equal(await page.locator("[data-demo-proof], [data-audio-proof], [data-step-proof], [data-player-proof]").count(), 0, "finished TSTT exposes no development instrumentation");
    assert.match(await demo.locator("#markSurface > img").getAttribute("src"), /BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg$/);
    assert.deepEqual(
      await demo.locator(".m16a2-tstt-demo-controls button").allTextContents(),
      ["⏸ PAUSE", "■ STOP", "↺ REPLAY CHAPTER", "☷ CHAPTERS", "⟲ RESTART"]
    );
    assert.deepEqual(await demo.locator("body").evaluate(() => window.__speechSynthesisCalls), [], "Chapter 3 never calls Web Speech");
    await demo.getByRole("button", { name: "PAUSE", exact: true }).click();
    assert.equal(await demo.locator("#workspaceStageShell").getAttribute("data-player-status"), "paused");
    await demo.getByRole("button", { name: "RESUME", exact: true }).click();
    assert.equal(await demo.locator("#workspaceStageShell").getAttribute("data-player-status"), "playing");
    await demo.getByRole("button", { name: "REPLAY CHAPTER", exact: true }).click();
    assert.equal(await demo.locator("#bakerSampleDemoLayer").getAttribute("data-demo-state"), "intro");
    await demo.getByRole("button", { name: "STOP", exact: true }).click();
    await page.waitForURL(/m16a2-tstt\.html\?chapter=4$/, { timeout: 30000 });
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 4");
    assert.equal(await page.locator("#lessonTitle").innerText(), "YOU'RE UP!");
    assert.match(await page.locator("#visualStage").innerText(), /Shoot Your Own Target/i);

    await page.goto(`${baseUrl}/m16a2-tstt.html?chapter=3`, { waitUntil: "networkidle" });
    await page.locator("[data-start-chapter-three]").click();
    const resumedDemo = page.frameLocator("#chapterThreeRuntime");
    await resumedDemo.locator('#workspaceStageShell[data-player-status="playing"]').waitFor({ timeout: 30000 });
    await resumedDemo.getByRole("button", { name: "CHAPTERS", exact: true }).click();
    await page.waitForURL(/m16a2-tstt\.html\?chapter=3&chapter_menu=1/, { timeout: 30000 });
    assert.equal(await page.locator("#chapterDialog").getAttribute("open"), "");
    assert.deepEqual(await page.locator("#chapterList button b").allTextContents(), ["TARGET AND EQUIPMENT", "KNOW YOUR SIGHTS", "LET TAP-N-SCORE SHOW YOU", "YOU'RE UP!"]);
    await page.getByRole("button", { name: /LET TAP-N-SCORE SHOW YOU/i }).click();
    const replayedDemo = page.frameLocator("#chapterThreeRuntime");
    await replayedDemo.locator('#workspaceStageShell[data-player-status="playing"]').waitFor({ timeout: 30000 });
    await replayedDemo.getByRole("button", { name: "RESTART", exact: true }).click();
    await page.waitForURL(/m16a2-tstt\.html$/, { timeout: 30000 });
    assert.equal(await page.getByRole("button", { name: "START SESSION", exact: true }).count(), 1);

    await page.goto(`${baseUrl}/m16a2-tstt.html?chapter=4`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 4");
    assert.equal(await page.locator("#lessonTitle").innerText(), "YOU'RE UP!");
    assert.equal(await page.locator("#lessonSummary").innerText(), "Shoot three to five shots while aiming at the center crosshairs.");
    assert.match(await page.locator("#visualStage").innerText(), /YOU'RE UP![\s\S]*Shoot Your Own Target[\s\S]*Take a photo of your target or choose one from your photos\.[\s\S]*TAKE PHOTO[\s\S]*CHOOSE EXISTING PHOTO/i);
    assert.match(await page.locator("#visualStage .adjustment-target img").getAttribute("src"), /BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg$/);
    assert.equal(await page.locator(".chapter-action.has-next-chapter").count(), 0, "Chapter 4 uses its governed photo-entry road rather than a fabricated next chapter");
    for (const name of ["TAKE PHOTO", "CHOOSE EXISTING PHOTO"]) {
      const href = await page.getByRole("link", { name, exact: true }).getAttribute("href");
      assert.match(href, /tstt_chapter=4/);
      assert.match(href, /target_profile_id=baker_m16a2_25m_zero/);
      assert.match(href, /equipment_profile_id=founder-m16a2/);
    }

    await page.locator('[data-control="chapters"]').click();
    assert.equal(await page.locator("#chapterList button:not([disabled])").count(), 4);
    assert.equal(await page.locator("#chapterList .you-are-here").innerText(), "YOU ARE HERE");
    assert.deepEqual(await page.locator("#chapterList button b").allTextContents(), ["TARGET AND EQUIPMENT", "KNOW YOUR SIGHTS", "LET TAP-N-SCORE SHOW YOU", "YOU'RE UP!"]);
    assert.match(await page.locator(".proficiency-status").innerText(), /PROFICIENCY[\s\S]*☆☆☆/);
    await page.getByRole("button", { name: /YOU'RE UP!/ }).click();
    await page.locator('[data-control="replay"]').click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 4");
    await page.locator('[data-control="restart"]').click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 1 OF 4");
    assert.equal(await page.getByRole("button", { name: "START SESSION", exact: true }).count(), 1);

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(horizontalOverflow, false, `no horizontal overflow at ${viewport.width}px`);
    assert.deepEqual(errors, [], `no page errors at ${viewport.width}px`);
    await context.close();
  }

  const returningContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const returningPage = await returningContext.newPage();
  await returningPage.addInitScript(() => {
    localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "founder-m16a2");
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
      setupId: "founder-m16a2", setupName: "M16A2 · Standard Iron Sights", weaponModelType: "M16A2",
      opticType: "Iron Sights", equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
      adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
    }]));
  });
  await returningPage.goto(`${baseUrl}/m16a2-tstt.html?chapter=4`, { waitUntil: "networkidle" });
  assert.equal(await returningPage.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 4");
  assert.equal(await returningPage.locator("#lessonTitle").innerText(), "YOU'RE UP!");
  assert.equal(await returningPage.locator("#chapterList button:not([disabled])").count(), 4);
  assert.equal(await returningPage.getByRole("link", { name: "TAKE PHOTO", exact: true }).count(), 1);
  assert.equal(await returningPage.getByRole("link", { name: "CHOOSE EXISTING PHOTO", exact: true }).count(), 1);
  await returningPage.getByRole("link", { name: "CHOOSE EXISTING PHOTO", exact: true }).click();
  await returningPage.waitForURL(/shoot\.html\?.*photo_source=existing/, { timeout: 30000 });
  await returningPage.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
  assert.equal(await returningPage.locator("#targetImageInput[type=file]").count(), 1);
  assert.match(await returningPage.locator("#targetSessionSummary").innerText(), /Baker M16A2 25 Meter Zeroing Target/i);
  await returningContext.close();

  const cameraContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const cameraPage = await cameraContext.newPage();
  await cameraPage.addInitScript(() => {
    localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "founder-m16a2-camera");
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
      setupId: "founder-m16a2-camera", setupName: "M16A2 · Standard Iron Sights", weaponModelType: "M16A2",
      opticType: "Iron Sights", equipmentConfigurationId: "M16A2-STANDARD-IRON-FSP-REAR-DRUM",
      adjustmentProfileId: "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011"
    }]));
  });
  await cameraPage.goto(`${baseUrl}/m16a2-tstt.html?chapter=4`, { waitUntil: "networkidle" });
  await cameraPage.getByRole("link", { name: "TAKE PHOTO", exact: true }).click();
  await cameraPage.waitForURL(/shoot\.html\?.*photo_source=camera/, { timeout: 30000 });
  await cameraPage.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
  assert.match(await cameraPage.locator("#targetSessionSummary").innerText(), /Baker M16A2 25 Meter Zeroing Target/i);
  await cameraContext.close();

  const newEquipmentContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const newEquipmentPage = await newEquipmentContext.newPage();
  await newEquipmentPage.goto(`${baseUrl}/m16a2-tstt.html?chapter=4`, { waitUntil: "networkidle" });
  const newEquipmentHref = await newEquipmentPage.getByRole("link", { name: "CHOOSE EXISTING PHOTO", exact: true }).getAttribute("href");
  assert.match(newEquipmentHref, /target_profile_id=baker_m16a2_25m_zero/);
  assert.match(newEquipmentHref, /view=library/);
  assert.match(newEquipmentHref, /photo_source=existing/);
  await newEquipmentPage.getByRole("link", { name: "CHOOSE EXISTING PHOTO", exact: true }).click();
  await newEquipmentPage.waitForURL(/matrix\.html\?.*view=library.*photo_source=existing/);
  assert.equal(await newEquipmentPage.getByText("Your Equipment Library Is Empty", { exact: true }).isVisible(), true);
  await newEquipmentPage.getByRole("button", { name: "🟨 New Equipment", exact: true }).click();
  await newEquipmentPage.locator("#weaponManufacturer").selectOption("Military M-Series Rifles");
  await newEquipmentPage.locator("#weaponModelType").selectOption("M16A2");
  await newEquipmentPage.locator("#weaponModelCaliber").selectOption("5.56 NATO");
  await newEquipmentPage.getByRole("button", { name: "Save to My Equipment", exact: true }).click();
  await newEquipmentPage.waitForURL(/shoot\.html\?.*photo_source=existing/, { timeout: 30000 });
  await newEquipmentPage.locator("#precisionTapPhotoPicker:visible").waitFor({ timeout: 30000 });
  assert.match(await newEquipmentPage.locator("#targetSessionSummary").innerText(), /Baker M16A2 25 Meter Zeroing Target/i);
  await newEquipmentContext.close();

  const coldContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const coldPage = await coldContext.newPage();
  const coldErrors = [];
  coldPage.on("pageerror", error => coldErrors.push(error.message));
  await coldPage.addInitScript(() => {
    window.__coldSpoken = [];
    const voices = [{ name: "Reed (English (US))", lang: "en-US", voiceURI: "com.apple.eloquence.en-US.Reed", localService: true }];
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak(utterance) { window.__coldSpoken.push(utterance); }, pause() {}, resume() {}, getVoices() { return voices; }, addEventListener() {}, speaking: false } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(text) { this.text = text; } } });
  });
  await coldPage.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });
  assert.equal(await coldPage.locator("#runtimeVoiceStatus, #runtimeVoiceCheck, .voice-diagnostic").count(), 0);
  assert.equal(await coldPage.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
  assert.match(await coldPage.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply/);
  assert.equal(await coldPage.locator("#visualStage figcaption").count(), 0);
  assert.equal(await coldPage.locator("#visualStage .is-full-target").count(), 1);
  assert.equal(await coldPage.locator("#visualStage .target-marker, #visualStage .sample-group").count(), 0);
  const startBox = await coldPage.getByRole("button", { name: "START SESSION", exact: true }).boundingBox();
  assert.ok(startBox && startBox.y >= 0 && startBox.y + startBox.height <= 844, "START SESSION is visible in the initial 390x844 viewport");
  assert.equal(await coldPage.locator('.player-controls [data-control="pause"]:visible').count(), 0);

  await coldPage.getByRole("button", { name: "START SESSION", exact: true }).click();
  assert.equal(await coldPage.evaluate(() => window.__coldSpoken.length), 0, "production never substitutes Reed when Samantha is unavailable");
  assert.equal(await coldPage.getByRole("button", { name: "START SESSION", exact: true }).count(), 0);
  assert.equal(await coldPage.locator('.player-controls [data-control="pause"]:visible').count(), 1);
  assert.equal(await coldPage.locator("#chapterList button:not([disabled])").count(), 4);
  await coldPage.locator('[data-control="chapters"]').click();
  await coldPage.getByRole("button", { name: /KNOW YOUR SIGHTS/i }).click();
  await coldPage.locator('[data-control="pause"]').click();
  await coldPage.locator("#shootingSetup").click();
  await coldPage.getByRole("link", { name: "EQUIPMENT LIBRARY", exact: true }).click();
  await coldPage.waitForURL(/matrix\.html\?view=library.*return_chapter=2/);
  assert.match(await coldPage.locator("#originReturnBar").innerText(), /RETURN TO TRAINING[\s\S]*RETURN TO CHAPTER 2/);
  await coldPage.getByRole("button", { name: "🟨 New Equipment", exact: true }).click();
  const manufacturers = await coldPage.locator("#weaponManufacturer option").allTextContents();
  assert.equal(manufacturers.at(-1), "Other");
  assert.ok(manufacturers.indexOf("Aero Precision") < manufacturers.indexOf("BCM"));
  assert.ok(manufacturers.indexOf("Military M-Series Rifles") < manufacturers.indexOf("Remington"));
  await coldPage.locator("#weaponManufacturer").selectOption("Military M-Series Rifles");
  await coldPage.locator("#weaponModelType").selectOption("M16A2");
  await coldPage.locator("#weaponModelCaliber").selectOption("5.56 NATO");
  assert.equal(await coldPage.locator("#equipmentConfigurationId").inputValue(), "M16A2-STANDARD-IRON-FSP-REAR-DRUM");
  assert.equal(await coldPage.locator("#adjustmentProfileId").inputValue(), "M16A2-IRON-FSP-REAR-DRUM-ADJUSTMENT-PROFILE-2011");
  await coldPage.getByRole("button", { name: "Save to My Equipment", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 4");
  assert.equal(await coldPage.locator("#tsttApp").getAttribute("data-status"), "paused");

  await coldPage.locator("#shootingSetup").click();
  await coldPage.getByRole("link", { name: "EQUIPMENT LIBRARY", exact: true }).click();
  await coldPage.waitForURL(/matrix\.html/);
  await coldPage.getByRole("button", { name: "Selected", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 4");
  assert.equal(await coldPage.locator("#tsttApp").getAttribute("data-status"), "paused");
  assert.deepEqual(coldErrors, [], "cold-start Equipment Library round trip has no page errors");
  await coldContext.close();

  const generalContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const generalPage = await generalContext.newPage();
  await generalPage.addInitScript(() => {
    localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", "cz-optic");
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([{
      setupId: "cz-optic", weaponCategory: "Rifle", weaponManufacturer: "CZ", weaponModelType: "Bolt Action",
      weaponModelCaliber: "CZ 600 .223 Rem", opticType: "Scope", opticBrand: "Vortex", opticModel: "Other"
    }]));
  });
  await generalPage.goto(`${baseUrl}/m16a2-tstt.html`, { waitUntil: "networkidle" });
  assert.equal(await generalPage.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
  assert.match(await generalPage.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*some instructions may not apply/i);
  await generalPage.locator("#shootingSetup").click();
  assert.match(await generalPage.locator("#shootingSetupNote").innerText(), /Different equipment requires its own governed adjustment authority/);
  await generalPage.getByRole("button", { name: "START SESSION", exact: true }).click();
  assert.equal(await generalPage.locator("#chapterList button:not([disabled])").count(), 4);
  assert.equal(await generalPage.getByText("NEXT CHAPTER", { exact: true }).count(), 0);
  assert.equal(await generalPage.getByRole("button", { name: "THIS MATCHES MY GEAR", exact: true }).count(), 0);
  await generalPage.locator('[data-control="chapters"]').click();
  assert.deepEqual(await generalPage.locator("#chapterList button b").allTextContents(), ["TARGET AND EQUIPMENT", "KNOW YOUR SIGHTS", "LET TAP-N-SCORE SHOW YOU", "YOU'RE UP!"]);
  await generalContext.close();
} finally {
  await browser.close();
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT browser flow at 390px and 1440px");
