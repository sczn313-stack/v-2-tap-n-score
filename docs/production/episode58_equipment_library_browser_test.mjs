import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(10000);
  await page.goto(`${baseUrl}/matrix.html?view=library`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New Equipment", exact: true }).click();
  await page.locator("[data-weapon-category='Rifle']").click();
  await page.locator("#weaponManufacturer").selectOption({ label: "Colt" });
  await page.locator("#weaponModelType").selectOption({ label: "AR Platform" });
  await page.locator("#weaponModelCaliber").selectOption({ label: "Colt LE6920 5.56 NATO" });
  await page.locator("#matrixDistanceValue").selectOption("100");
  await page.evaluate(() => {
    document.querySelector('[name="shooterName"]').value = "Transient Shooter";
    document.querySelector('[name="agency"]').value = "Transient Agency";
    for (const [name, value] of [["temperature", "72 F"], ["weather", "Clear"]]) {
      const input = document.createElement("input");
      input.name = name;
      input.value = value;
      input.hidden = true;
      document.querySelector("#matrixForm").append(input);
    }
  });
  await page.getByRole("button", { name: "Save to My Equipment", exact: true }).click();
  console.log("Episode 58 browser checkpoint: V2 equipment saved");

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("SCZN3_SAVED_EQUIPMENT_PROFILES") || "[]"));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].equipmentProfileSchemaVersion, "sczn3-equipment-profile-v2");
  assert.equal(saved[0].equipmentCatalogVersion, "episode58-gate2-pilot-2026-08-24");
  assert.equal(saved[0].equipmentIdentityStatus, "shooter_declared");
  assert.equal(saved[0].weaponManufacturer, "Colt");
  assert.equal(saved[0].weaponModelType, "AR Platform");
  assert.equal(saved[0].weaponModelCaliber, "Colt LE6920 5.56 NATO");
  assert.equal(saved[0].opticClickValue || "", "", "unknown sight adjustment must not become a default equipment fact");
  for (const transientField of ["targetDistanceValue", "targetDistance", "distance", "shooterName", "agency", "temperature", "weather", "targetProfileId", "qrId"]) {
    assert.equal(Object.hasOwn(saved[0], transientField), false, `${transientField} must not persist as equipment identity`);
  }
  assert.equal(await page.evaluate(() => localStorage.getItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID")), saved[0].setupId);
  assert.equal(await page.locator(".weapon-card.is-active").count(), 1);
  assert.equal(
    await page.locator(".active-equipment-badge").evaluate(badge => getComputedStyle(badge).backgroundColor),
    "rgb(38, 240, 106)",
    "the active equipment state uses the Founder-approved bright-green signal"
  );
  assert.equal(await page.locator("body").evaluate(body => body.scrollWidth <= body.clientWidth), true, "390px Equipment Library has no horizontal overflow");

  await page.reload({ waitUntil: "networkidle" });
  console.log("Episode 58 browser checkpoint: active equipment reloaded");
  assert.equal(await page.locator(".weapon-card.is-active").count(), 1, "active equipment survives reload");
  assert.equal(await page.locator(".weapon-card dt", { hasText: "Saved Distance" }).count(), 0, "arbitrary session distance is not shown as equipment truth");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  assert.equal(await page.locator("#weaponManufacturer").inputValue(), "Colt");
  assert.equal(await page.locator("#weaponModelType").inputValue(), "AR Platform");
  assert.equal(await page.locator("#weaponModelCaliber").inputValue(), "Colt LE6920 5.56 NATO");

  const exactReopen = await context.newPage();
  await exactReopen.goto(`${baseUrl}/matrix.html?view=library&equipment_profile_id=${encodeURIComponent(saved[0].setupId)}`, { waitUntil: "networkidle" });
  assert.equal(await exactReopen.locator("#savedSetupSelect").inputValue(), saved[0].setupId, "equipment identity reopens exactly by stable profile ID");
  console.log("Episode 58 browser checkpoint: exact equipment reopen passed");

  let preparedCandidate = null;
  await context.route("**/api/session/prepare", async route => {
    const body = route.request().postDataJSON();
    preparedCandidate = body.equipmentCandidates && body.equipmentCandidates[0];
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "test_stop_after_candidate_capture" }) });
  });
  const targetPage = await context.newPage();
  await targetPage.goto(`${baseUrl}/matrix.html?target_profile_id=baker_st_100yd_smart_zero`, { waitUntil: "networkidle" });
  console.log("Episode 58 browser checkpoint: applicable target opened");
  await targetPage.waitForFunction(() => document.querySelector("#sessionAuthorityStatus")?.textContent.length > 0);
  assert.equal(await targetPage.locator("#matrixDistanceValue").inputValue(), "100", "session distance comes from the active session/preparation context");
  assert.equal(await targetPage.locator('[name="shooterName"]').inputValue(), "", "personal context is not resurrected from durable equipment identity");
  assert.ok(preparedCandidate, "an applicable target experience consumes saved equipment without re-entry");
  assert.equal(preparedCandidate.setupId, saved[0].setupId);
  assert.equal(preparedCandidate.equipmentProfileSchemaVersion, "sczn3-equipment-profile-v2");
  assert.equal(preparedCandidate.weaponManufacturer, "Colt");
  assert.equal(preparedCandidate.weaponModelCaliber, "Colt LE6920 5.56 NATO");
  assert.equal(Object.hasOwn(preparedCandidate, "targetDistanceValue"), false);
  assert.equal(Object.hasOwn(preparedCandidate, "shooterName"), false);

  await context.close();
  console.log("PASS Episode 58 create, save, reload, exact reopen, active selection, 390px layout, and target inheritance");
} finally {
  await browser.close();
}
