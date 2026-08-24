import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const navigationLabels = ["Equipment Library", "Smart Targets", "Ballistic Vault"];
const doorNames = [
  "DIAGNOSE & ZERO", "PRACTICE", "COMPETE", "QUALIFY",
  "LAW ENFORCEMENT", "FUN & GAMES", "JUST SHOOT", "MILITARY"
];

const browser = await chromium.launch({ headless: true, executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined });
try {
  for (const viewport of [{ width: 1280, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__speechCancelCount = 0;
      window.__speechSpeakCount = 0;
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
        cancel() { window.__speechCancelCount += 1; },
        speak() { window.__speechSpeakCount += 1; }
      } });
      window.SpeechSynthesisUtterance = class { constructor(message) { this.text = message; } };
    });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${baseUrl}/index.html?episode57=${viewport.width}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.dataset.sczn3NavigationReady === "true");

    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const drawer = page.locator("#packageMenuDrawer");
    assert.deepEqual((await drawer.locator("a").allTextContents()).map(value => value.trim()), navigationLabels);
    assert.equal(await page.locator(".ecosystem-brand").getAttribute("href"), "index.html");
    const smartTargetsUrl = new URL(await drawer.getByRole("link", { name: "Smart Targets", exact: true }).getAttribute("href"));
    assert.equal(smartTargetsUrl.hash, "#targetExperiences");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await drawer.waitFor({ state: "hidden" });

    const hero = await page.locator(".ecosystem-hero-line").evaluateAll(lines => lines.map(line => ({
      text: line.textContent.replace(/\s+/g, " ").trim(),
      lead: getComputedStyle(line.querySelector("strong")).color,
      finish: getComputedStyle(line.querySelector(":scope > span")).color
    })));
    assert.deepEqual(hero.map(line => line.text), ["ZERO FASTER.", "SHOOT SMARTER.", "KEEP GETTING BETTER."]);
    assert.ok(hero.every(line => line.lead !== line.finish));

    const bodyText = await page.locator("body").innerText();
    assert.doesNotMatch(bodyText, /Available Now|Coming Soon|Recommended Targets/i);
    assert.equal((await page.locator("[data-printer-explore-kicker]").textContent()).trim(), "LOOKING FOR MORE SMART TARGETS?");
    assert.equal((await page.locator("[data-printer-explore-title]").textContent()).replace(/\s+/g, " ").trim(), "Visit BakerTargets.com →");
    assert.equal(await page.locator("[data-printer-explore]").getAttribute("href"), "https://bakertargets.com/shop/");
    assert.equal(await page.locator("[data-printer-explore-note]").isHidden(), true, "Baker outbound box carries no replacement disclaimer");
    const cameraPhoto = page.locator("#landingCameraInput");
    const libraryPhoto = page.locator("#landingPhotoInput");
    assert.equal(await cameraPhoto.getAttribute("accept"), "image/*");
    assert.equal(await cameraPhoto.getAttribute("capture"), "environment");
    assert.equal(await libraryPhoto.getAttribute("accept"), "image/*");
    assert.equal(await libraryPhoto.getAttribute("capture"), null);
    const entryPositions = await page.locator("[data-guided-entry]").evaluateAll(entries => Object.fromEntries(entries.map(entry => {
      const bounds = entry.getBoundingClientRect();
      return [entry.dataset.guidedEntry, { top: bounds.top, left: bounds.left }];
    })));
    assert.equal(viewport.width > 700
      ? entryPositions.choose.left < entryPositions.photo.left
      : entryPositions.photo.top < entryPositions.choose.top, true, "entry cards use the Founder-approved responsive order");
    assert.match(bodyText, /CHOOSE OUR TARGET\s+Tap here to select a target below\./);
    assert.match(bodyText, /SHOW US YOUR TARGET\s+Tap here to take or choose a photo\s+of the target you already have\./i);
    assert.match(bodyText, /LET THE TARGET TALK\.\s+Tap-n-Score will visually and verbally walk you through your target\./);
    assert.equal(await page.locator(".ecosystem-talk-action").count(), 0, "the oversized standalone Talk action is removed");
    let prematureChooser = false;
    page.once("filechooser", () => { prematureChooser = true; });
    await page.locator('[data-guided-entry="photo"]').click();
    await page.waitForTimeout(100);
    assert.equal(prematureChooser, false, "the green card does not bypass the Founder-approved source picker");
    assert.equal(await page.locator("#landingPhotoPicker").isVisible(), true);
    assert.deepEqual((await page.locator(".ecosystem-photo-picker-action").allTextContents()).map(value => value.trim()), ["Take Photo", "Choose Existing Photo"]);
    const [cameraChooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByText("Take Photo", { exact: true }).click()]);
    assert.equal(cameraChooser.isMultiple(), false);
    const [libraryChooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByText("Choose Existing Photo", { exact: true }).click()]);
    assert.equal(libraryChooser.isMultiple(), false);
    await page.locator('[data-guided-entry="choose"]').click();
    assert.match(await page.locator("[data-talk-status]").textContent(), /experience this target authorizes/i);
    assert.equal(await page.locator("body").evaluate(body => body.classList.contains("ecosystem-talk-enabled")), true);

    const doors = page.locator("[data-door-id]");
    assert.equal(await doors.count(), 8);
    assert.deepEqual((await page.locator("[data-door-item] .ecosystem-door-title").allTextContents()).map(value => value.trim()), doorNames);
    assert.equal(await page.locator("[data-representative-target-id] .ecosystem-qrc").count(), 8);
    const renderedTargetIds = await page.locator("[data-target-id]").evaluateAll(nodes => nodes.map(node => node.dataset.targetId.toLowerCase()));
    assert.equal(new Set(renderedTargetIds).size, renderedTargetIds.length, "every target identity appears exactly once across representatives and all expanded choices");
    assert.equal(renderedTargetIds.filter(id => id === "m4_25m_zero").length, 1, "M4 appears only as the Military representative");
    assert.equal(await page.locator(".ecosystem-representative-start").count(), 0, "the duplicate representative start row is removed");
    const shooterDescriptions = await page.locator(".ecosystem-door-choice [data-shooter-description]").allTextContents();
    assert.ok(shooterDescriptions.length > 0 && shooterDescriptions.every(value => value.trim().length > 0), "every expanded target has dedicated shooter-facing copy");
    assert.ok(shooterDescriptions.every(value => !/\b(?:registered|authority|admitted|capabilit(?:y|ies)|evidence|unavailable|scoring rules)\b/i.test(value)), "expanded target copy does not expose machine or governance terminology");
    assert.equal(await page.evaluate(() => Object.values(window.SCZN3TargetExperiences.experiences).every(experience => typeof experience.shooterDescription === "string" && !("description" in experience))), true, "target presentation data uses an explicit shooterDescription field");
    const columns = await page.locator(".ecosystem-door-grid").evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
    assert.equal(columns, viewport.width > 700 ? 2 : 1);
    const compete = page.locator('[data-door-item="compete"]');
    assert.match((await compete.locator("[data-door-id]").innerText()).replace(/\s+/g, " "), /SEE TARGETS ↓/);
    await compete.locator("[data-door-id]").click();
    assert.equal(await compete.locator(".ecosystem-door-targets").isVisible(), true);
    assert.match((await compete.locator("[data-door-id]").innerText()).replace(/\s+/g, " "), /CLOSE ↑/);
    assert.equal(await compete.locator('[data-experience-id="uspsa-practice-target"]').count(), 0, "the representative target is not repeated as an additional target card");
    assert.equal(await compete.locator('.ecosystem-door-representative-entry[data-target-id="BAKER_SL_ST1"]').getAttribute("href"), "t/baker/sl-st1/");
    assert.equal(await page.locator("[data-printer-explore]").getAttribute("href"), "https://bakertargets.com/shop/");
    const cancelBeforeClose = await page.evaluate(() => window.__speechCancelCount);
    await compete.locator("[data-door-id]").click();
    assert.equal(await compete.locator(".ecosystem-door-targets").isHidden(), true);
    assert.match((await compete.locator("[data-door-id]").innerText()).replace(/\s+/g, " "), /SEE TARGETS ↓/);
    assert.ok(await page.evaluate(() => window.__speechCancelCount) > cancelBeforeClose, "CLOSE cancels active activity narration immediately");

    const diagnose = page.locator('[data-door-item="diagnose-zero"]');
    await diagnose.locator("[data-door-id]").click();
    assert.equal(await diagnose.locator('[data-experience-id="hundred-yard-bullseye"]').count(), 0);
    await diagnose.locator('[data-experience-id="gunfun-five-circles"]').hover();
    assert.equal(await page.locator("[data-printer-explore]").getAttribute("href"), "https://gunfun.com/shop/");

    const practiceNames = await page.locator(".ecosystem-practice-name span:last-child").allTextContents();
    assert.ok(practiceNames.length >= 3 && practiceNames.every(value => value.trim() === "Practice Target"));

    assert.match(bodyText, /EVERY TARGET\.\s+EVERY SESSION\.\s+YOUR HISTORY\./);
    assert.deepEqual((await page.locator("#preservationPayoffTitle > span").allTextContents()).map(value => value.trim()), ["EVERY TARGET.", "EVERY SESSION.", "YOUR HISTORY."], "Ballistic Vault payoff uses three deliberate lines");
    assert.match(bodyText, /Save your SEC and shooting history\./);
    assert.equal(await page.locator(".ecosystem-payoff-half--vault").getAttribute("href"), "records.html");
    assert.match(await page.locator("[data-printer-explore-title]").textContent(), /Explore More from GunFun Shooting Targets/);
    assert.equal(await page.locator(".ecosystem-family-card").isVisible(), true);
    assert.match(bodyText, /COME BE PART OF THE\s+SMART TARGET FAMILY\./i);
    assert.match(bodyText, /EXPLORE SMART TARGETS\s+→/i);
    assert.doesNotMatch(bodyText, /HELP THE SMART TARGET FAMILY GROW|Tell us what targets you shoot|Help shape the next generation/i);
    assert.equal(await page.locator('.ecosystem-family-card a[href="survey.html"]').count(), 0, "retired survey solicitation is absent from Home");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.equal(await page.locator(".ecosystem-entry-card, .ecosystem-door-representative-entry, [data-door-id], .ecosystem-preservation-payoff a").evaluateAll(controls => controls.filter(control => {
      const style = getComputedStyle(control);
      return style.display !== "none" && style.visibility !== "hidden";
    }).every(control => {
      const bounds = control.getBoundingClientRect();
      return bounds.width >= 44 && bounds.height >= 44;
    })), true, `${viewport.width}px visible primary actions meet the 44px tap target minimum`);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS Episode 57 landing contracts at ${viewport.width}px`);
  }

  const standardContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const standardSetup = {
    candidateId: "standard-gssf-pistol", weaponCategory: "Pistol", manufacturer: "Standard Setup",
    modelType: "Pistol", modelCaliber: "Shooter ammunition", opticType: "Pistol sights",
    adjustmentUnit: "", clickValue: null, source: "backend_standard_setup",
    setupAuthority: "backend-target-authority", setupAuthorityId: "GSSF_AC_1_STANDARD_SETUP_v1",
    displayFields: [{ label: "Firearm", value: "Pistol" }]
  };
  let selectedEquipment = null;
  await standardContext.route("**/api/session/prepare", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, status: "prepared", preparationToken: "landing-standard-gssf", expiresAt: "2026-08-25T00:00:00Z",
      target: { targetId: "gssf_ac_1", targetName: "GSSF AC-1" },
      targetAdmission: { status: "admitted", targetId: "gssf_ac_1" },
      missionIdentity: { missionFamily: "gssf", missionId: "GSSF_AC_1_PAPER_PENALTY", resultPackageType: "gssfPaperPenaltyResult" },
      governedDistance: { value: null, unit: null, locked: false },
      equipmentRequirements: { weaponCategories: ["Pistol"] },
      standardSetup, setupMode: "standard",
      equipmentAssessments: [{ candidateId: standardSetup.candidateId, officialMission: { status: "eligible", restrictionIds: [] }, capabilities: { evidence: { status: "available" } }, restrictions: [] }]
    })
  }));
  await standardContext.route("**/api/session/start", async route => {
    selectedEquipment = route.request().postDataJSON().selectedEquipment;
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
      ok: true, status: "created", authoritativeSessionId: "landing-standard-session", createdAt: "2026-08-21T22:30:00Z",
      sessionLifecycle: "created", sessionMode: "official_mission",
      target: { targetId: "gssf_ac_1", targetAuthorityId: "gssf_ac_1", targetName: "GSSF AC-1", targetProfileVersion: "1", atpId: "gssf-ac-1-atp-v1" },
      missionIdentity: { missionFamily: "gssf", missionId: "GSSF_AC_1_PAPER_PENALTY", resultPackageType: "gssfPaperPenaltyResult" },
      targetAdmission: { status: "admitted", targetId: "gssf_ac_1" },
      officialMission: { status: "eligible", restrictionIds: [] },
      capabilities: { evidence: { status: "available" } }, restrictions: [],
      governedDistance: { value: null, unit: null, locked: false }, selectedEquipment: standardSetup
    }) });
  });
  const standardPage = await standardContext.newPage();
  await standardPage.goto(`${baseUrl}/index.html?standard-equipment=1`, { waitUntil: "networkidle" });
  const qualify = standardPage.locator('[data-door-item="qualify"]');
  await qualify.locator('.ecosystem-door-representative-entry[data-target-id="gssf_ac_1"]').click();
  await standardPage.waitForURL(url => url.pathname.endsWith("/shoot.html"));
  assert.deepEqual(selectedEquipment, standardSetup, "landing target selection defaults to the backend-governed Standard setup");
  await standardContext.close();
  console.log("PASS landing target selection inherits Standard equipment without an equipment roadblock");
} finally {
  await browser.close();
}
