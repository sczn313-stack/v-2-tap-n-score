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
  const legacyProfile = {
    setupId: "legacy-v1-profile",
    setupName: "Legacy Rifle",
    equipmentProfileSchemaVersion: "sczn3-equipment-profile-v1",
    weaponCategory: "Rifle",
    weaponManufacturer: "Colt",
    weaponModelType: "AR Platform",
    weaponModelCaliber: "Colt LE6920 5.56 NATO",
    shooterName: "Legacy Shooter",
    agency: "Legacy Agency",
    weather: "Rain",
    targetDistanceValue: "25",
    targetDistanceUnit: "M",
    targetDistance: "25 m",
    distance: "25 m",
    targetProfileId: "m4_25m_zero",
    qrId: "legacy-qr",
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z"
  };
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(10000);
  await page.addInitScript(profile => {
    if (sessionStorage.getItem("SCZN3_EP58_V1_FIXTURE_INSTALLED") === "true") return;
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([profile]));
    sessionStorage.setItem("SCZN3_EP58_V1_FIXTURE_INSTALLED", "true");
  }, legacyProfile);
  await page.goto(`${baseUrl}/matrix.html?view=library&equipment_profile_id=legacy-v1-profile`, { waitUntil: "networkidle" });
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem("SCZN3_SAVED_EQUIPMENT_PROFILES") || "[]")[0]);
  assert.equal(migrated.equipmentProfileSchemaVersion, "sczn3-equipment-profile-v2");
  assert.equal(migrated.weaponManufacturer, "Colt");
  assert.equal(migrated.weaponModelCaliber, "Colt LE6920 5.56 NATO");
  assert.equal(migrated.setupName, "Legacy Rifle");
  assert.deepEqual(migrated.equipmentProfileMigration.transientFieldsRemoved.sort(), ["agency", "distance", "qrId", "shooterName", "targetDistance", "targetDistanceUnit", "targetDistanceValue", "targetProfileId", "weather"].sort());
  assert.equal(await page.locator('[name="shooterName"]').inputValue(), "");
  assert.equal(await page.locator("#matrixDistanceValue").inputValue(), "Select Distance");
  assert.equal(await page.locator(".weapon-card dt", { hasText: "Saved Distance" }).count(), 0);

  const governedZeroProfile = {
    ...migrated,
    setupId: "governed-zero-profile",
    setupName: "Governed Zero Rifle",
    targetZeroRelationship: {
      relationshipId: "zero-rel-test-1",
      authorityStatus: "governed",
      zeroDistance: "25",
      zeroDistanceUnit: "m",
      confirmationDistance: "300",
      confirmationDistanceUnit: "m",
      envelope: {
        source: "test-authoritative-sec",
        sourceOwner: "SCZN3 Backend Authority",
        observedAt: "2026-08-24T00:00:00.000Z",
        factGrade: "locked_runtime_authority",
        scope: "test-equipment-configuration",
        status: "active"
      }
    }
  };
  await page.evaluate(profile => {
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([profile]));
  }, governedZeroProfile);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".weapon-card dt", { hasText: "Zero" }).count(), 1);
  assert.equal(await page.locator(".weapon-card dd", { hasText: "25 m · Confirm 300 m" }).count(), 1);
  assert.equal(await page.locator("body").evaluate(body => body.scrollWidth <= body.clientWidth), true);

  await context.close();
  console.log("PASS Episode 58 Equipment Profile V2 migration, context stripping, and governed-zero display");
} finally {
  await browser.close();
}
