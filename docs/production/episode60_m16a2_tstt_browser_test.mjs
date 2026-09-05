import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8093";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__spokenUtterances = [];
      window.__speechSynthesisCalls = [];
      const voices = [
        { name: "Albert", lang: "en-US", localService: true, default: true },
        { name: "Daniel", lang: "en-GB", localService: true, default: false },
        { name: "Samantha", lang: "en-US", voiceURI: "com.apple.voice.compact.en-US.Samantha", localService: true, default: false },
        { name: "Reed (English (US))", lang: "en-US", voiceURI: "com.apple.eloquence.en-US.Reed", localService: true, default: false }
      ];
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() { window.__speechSynthesisCalls.push("cancel"); }, speak(utterance) { window.__speechSynthesisCalls.push("speak"); window.__spokenUtterances.push(utterance); }, pause() { window.__speechSynthesisCalls.push("pause"); }, resume() { window.__speechSynthesisCalls.push("resume"); }, getVoices() { return voices; }, speaking: false } });
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

    assert.equal(await page.locator("#runtimeVoiceStatus, #runtimeVoiceCheck, .voice-diagnostic").count(), 0);
    assert.equal(await page.locator("#targetIdentity").innerText(), "25 METERS ZEROING TARGET\nM16A2");
    assert.equal(await page.locator("#lessonProgress > span").count(), 5);
    assert.match(await page.locator("#taskCard").innerText(), /TRAINING SETUP[\s\S]*M16A2 · Standard Iron Sights[\s\S]*This training teaches this setup\. If yours is different, some instructions may not apply/);
    assert.equal(await page.getByText("CURRENT EQUIPMENT", { exact: true }).count(), 0);
    assert.equal(await page.locator("#lessonSummary").isHidden(), false);
    assert.equal(await page.locator("#lessonTitle").innerText(), "KNOW YOUR TARGET.");
    assert.equal(await page.locator("#lessonSummary").innerText(), "Before making any sight adjustments, understand what this target is telling you.");
    assert.match(await page.locator("#visualStage").innerText(), /AIM POINT[\s\S]*Always make the center crosshairs your aim point[\s\S]*READ THE GRID[\s\S]*Each small square measures[\s\S]*READ THE CLICKS[\s\S]*columns represents one front-sight up-or-down click[\s\S]*rows represents three rear-windage clicks[\s\S]*FIRE THE SHOT PATTERN[\s\S]*THE CENTER OF YOUR SHOT PATTERN[\s\S]*LET TAP-N-SCORE READ IT/);
    await page.getByRole("button", { name: "START TRAINING", exact: true }).click();
    const chapterOneSpeech = await page.evaluate(() => {
      const utterance = window.__spokenUtterances.at(-1);
      return { text: utterance.text, rate: utterance.rate, pitch: utterance.pitch, volume: utterance.volume, voice: utterance.voice?.name, lang: utterance.lang };
    });
    assert.deepEqual({ rate: chapterOneSpeech.rate, pitch: chapterOneSpeech.pitch, volume: chapterOneSpeech.volume, voice: chapterOneSpeech.voice, lang: chapterOneSpeech.lang }, { rate: 0.70, pitch: 1, volume: 1, voice: "Samantha", lang: "en-US" });
    assert.equal(chapterOneSpeech.text, "Before making any sight adjustments, understand what this target is telling you. Always make the center crosshairs your aim point when zeroing your weapon. Each small square measures how far your shots are landing from the center crosshairs. On this target, each square in the columns represents one front-sight up-or-down click. Each square in the rows represents three rear-windage clicks, right or left. Fire three to five shots before making an adjustment. The center of your shot pattern gives a better picture of where your shots are landing. Once you have a shot pattern, Tap-n-Score can measure where it is in relation to the center crosshairs and tell you what adjustment to make. Next, we'll learn the sights.");
    const spokenCountBeforePause = await page.evaluate(() => window.__spokenUtterances.length);
    await page.evaluate(() => window.__spokenUtterances.at(-1).onend());
    await page.waitForTimeout(550);
    assert.equal(await page.evaluate(() => window.__spokenUtterances.length), spokenCountBeforePause, "Chapter 1 remains one continuous known-good utterance");
    assert.equal(await page.getByRole("button", { name: "THIS MATCHES MY GEAR", exact: true }).count(), 0);
    await page.locator("#shootingSetup").click();
    assert.equal(await page.locator("#sessionDistance").inputValue(), "25");
    assert.equal(await page.locator("#sessionDistanceUnit").inputValue(), "METERS");
    assert.equal(await page.locator("#sessionAdjustmentUnit").inputValue(), "MOA");
    assert.equal(await page.locator("#sessionAdjustmentIncrement").inputValue(), "Elevation 1.25 · Windage 0.5");
    await page.getByRole("button", { name: /NEXT, WE'LL LEARN THE SIGHTS\./ }).click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
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
    const chapterTwoSpeech = await page.evaluate(() => {
      const utterance = window.__spokenUtterances.at(-1);
      return { text: utterance.text, rate: utterance.rate, voice: utterance.voice?.name };
    });
    assert.equal(chapterTwoSpeech.text, "Front sight post. Controls elevation — moves your shot pattern up or down. Rear windage knob. Controls windage — moves your shot pattern right or left. Rear elevation drum. For your twenty-five-meter zero, set the drum to 8/3, then turn it one click CLOCKWISE past 8/3. After your zero is confirmed, turn it one click COUNTERCLOCKWISE back to 8/3 for the three-hundred-meter setting. Now you know which sight controls you'll adjust when Tap-n-Score tells you how to move your shot pattern.");
    assert.deepEqual({ rate: chapterTwoSpeech.rate, voice: chapterTwoSpeech.voice }, { rate: 0.70, voice: "Samantha" });

    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "RESUME");
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "paused");
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("[data-pause-label]").innerText(), "PAUSE");
    await page.locator('[data-control="stop"]').click();
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "stopped");
    assert.equal(await page.locator("[data-pause-label]").innerText(), "RESUME");
    await page.locator('[data-control="pause"]').click();
    assert.equal(await page.locator("#tsttApp").getAttribute("data-status"), "active");

    await page.locator('[data-control="chapters"]').click();
    await page.getByRole("button", { name: /Let Tap-n-Score show you/ }).click();
    const demo = page.frameLocator("#chapterThreeRuntime");
    await demo.locator('#workspaceStageShell[data-player-status="playing"]').waitFor({ timeout: 30000 });
    assert.match(page.url(), /m16a2-tstt\.html$/);
    assert.equal(await page.locator("[data-demo-proof]").innerText(), "RUNNING");
    assert.equal(await page.locator("[data-audio-proof]").innerText(), "PLAYING");
    assert.equal(await page.locator("[data-step-proof]").innerText(), "1 / 14");
    assert.equal(await page.locator("[data-player-proof]").innerText(), "PLAYING");
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
    assert.equal(await demo.locator("#workspaceStageShell").getAttribute("data-player-status"), "idle");
    await demo.getByRole("button", { name: /Let the target talk/ }).click();
    assert.equal(await demo.locator("#workspaceStageShell").getAttribute("data-player-status"), "playing");
    await demo.getByRole("button", { name: "CHAPTERS", exact: true }).click();
    await page.waitForURL(/m16a2-tstt\.html\?chapter=3&chapter_menu=1/, { timeout: 30000 });
    assert.equal(await page.locator("#chapterDialog").getAttribute("open"), "");
    await page.getByRole("button", { name: /Let Tap-n-Score show you/ }).click();
    const replayedDemo = page.frameLocator("#chapterThreeRuntime");
    await replayedDemo.locator('#workspaceStageShell[data-player-status="playing"]').waitFor({ timeout: 30000 });
    await replayedDemo.getByRole("button", { name: "RESTART", exact: true }).click();
    await page.waitForURL(/m16a2-tstt\.html$/, { timeout: 30000 });
    assert.equal(await page.getByRole("button", { name: "START TRAINING", exact: true }).count(), 1);

    await page.goto(`${baseUrl}/m16a2-tstt.html?chapter=4`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 5");
    assert.equal(await page.locator("#lessonTitle").innerText(), "YOUR TURN.");
    assert.equal(await page.locator("#lessonSummary").innerText(), "Shoot three to five shots while aiming at the center crosshairs.");
    assert.match(await page.locator("#visualStage").innerText(), /YOUR TURN[\s\S]*Take a photo of your target or choose one from your photos\.[\s\S]*TAKE PHOTO[\s\S]*CHOOSE EXISTING PHOTO/i);
    assert.match(await page.locator("#visualStage .adjustment-target img").getAttribute("src"), /BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1\.jpg$/);
    for (const name of ["TAKE PHOTO", "CHOOSE EXISTING PHOTO"]) {
      const href = await page.getByRole("link", { name, exact: true }).getAttribute("href");
      assert.match(href, /tstt_chapter=4/);
      assert.match(href, /target_profile_id=baker_m16a2_25m_zero/);
      assert.match(href, /equipment_profile_id=founder-m16a2/);
    }

    await page.locator('[data-control="chapters"]').click();
    assert.equal(await page.locator("#chapterList button:not([disabled])").count(), 5);
    assert.equal(await page.locator("#chapterList .you-are-here").innerText(), "YOU ARE HERE");
    assert.match(await page.locator(".proficiency-status").innerText(), /PROFICIENCY[\s\S]*☆☆☆/);
    await page.getByRole("button", { name: /Ready for the first group/ }).click();
    assert.match(await page.locator("#lessonTitle").innerText(), /READY TO FIRE YOUR FIRST GROUP/i);
    assert.match(await page.locator("#visualStage").innerText(), /READY TO FIRE\s+YOUR FIRST GROUP/);
    assert.equal(await page.locator("text=ADD PHOTO").count(), 0);

    await page.locator('[data-control="replay"]').click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 5 OF 5");
    await page.locator('[data-control="restart"]').click();
    assert.equal(await page.locator("#chapterNumber").innerText(), "CHAPTER 1 OF 5");
    assert.equal(await page.getByRole("button", { name: "START TRAINING", exact: true }).count(), 1);

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
  assert.equal(await returningPage.locator("#chapterNumber").innerText(), "CHAPTER 4 OF 5");
  assert.equal(await returningPage.locator("#lessonTitle").innerText(), "YOUR TURN.");
  assert.equal(await returningPage.locator("#chapterList button:not([disabled])").count(), 5);
  assert.equal(await returningPage.getByRole("link", { name: "TAKE PHOTO", exact: true }).count(), 1);
  assert.equal(await returningPage.getByRole("link", { name: "CHOOSE EXISTING PHOTO", exact: true }).count(), 1);
  await returningPage.getByRole("link", { name: "CHOOSE EXISTING PHOTO", exact: true }).click();
  await returningPage.waitForURL(/shoot\.html\?.*photo_source=existing/, { timeout: 30000 });
  assert.equal(await returningPage.locator("#targetImageInput[type=file]").count(), 1);
  assert.match(await returningPage.locator("#targetSessionSummary").innerText(), /Baker M16A2 25 Meter Zeroing Target/i);
  await returningContext.close();

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
  const startBox = await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).boundingBox();
  assert.ok(startBox && startBox.y >= 0 && startBox.y + startBox.height <= 844, "START TRAINING is visible in the initial 390x844 viewport");
  assert.equal(await coldPage.locator('.player-controls [data-control="pause"]:visible').count(), 0);

  await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).click();
  assert.equal(await coldPage.evaluate(() => window.__coldSpoken.length), 0, "production never substitutes Reed when Samantha is unavailable");
  assert.equal(await coldPage.getByRole("button", { name: "START TRAINING", exact: true }).count(), 0);
  assert.equal(await coldPage.locator('.player-controls [data-control="pause"]:visible').count(), 1);
  assert.equal(await coldPage.locator("#chapterList button:not([disabled])").count(), 5);
  await coldPage.getByRole("button", { name: /NEXT, WE'LL LEARN THE SIGHTS\./ }).click();
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
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
  assert.equal(await coldPage.locator("#tsttApp").getAttribute("data-status"), "paused");

  await coldPage.locator("#shootingSetup").click();
  await coldPage.getByRole("link", { name: "EQUIPMENT LIBRARY", exact: true }).click();
  await coldPage.waitForURL(/matrix\.html/);
  await coldPage.getByRole("button", { name: "Selected", exact: true }).click();
  await coldPage.waitForURL(/m16a2-tstt\.html$/);
  assert.equal(await coldPage.locator("#chapterNumber").innerText(), "CHAPTER 2 OF 5");
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
  await generalPage.getByRole("button", { name: "START TRAINING", exact: true }).click();
  assert.equal(await generalPage.locator("#chapterList button:not([disabled])").count(), 5);
  assert.equal(await generalPage.getByRole("button", { name: /NEXT, WE'LL LEARN THE SIGHTS\./ }).count(), 1);
  assert.equal(await generalPage.getByRole("button", { name: "THIS MATCHES MY GEAR", exact: true }).count(), 0);
  await generalPage.locator('[data-control="chapters"]').click();
  await generalPage.getByRole("button", { name: /Ready for the first group/ }).click();
  assert.match(await generalPage.locator("#visualStage").innerText(), /PREFIRE TRAINING COMPLETE[\s\S]*Training setup: M16A2 with standard iron sights/);
  assert.doesNotMatch(await generalPage.locator("#visualStage").innerText(), /PREFIRE CHECK COMPLETE/);
  await generalContext.close();
} finally {
  await browser.close();
}

console.log("PASS Episode 60 Baker M16A2 pre-fire TSTT browser flow at 390px and 1440px");
