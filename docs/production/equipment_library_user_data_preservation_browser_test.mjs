import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

const profileId = "founder-forward-preservation-rifle";
const photoDataUrl = "data:image/svg+xml;base64," + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12"><rect width="24" height="12" fill="#111"/><path d="M2 6h17" stroke="#d89b00" stroke-width="2"/></svg>'
).toString("base64");

const originalProfile = {
  setupId: profileId,
  setupName: "Ronnie's Working Rifle",
  equipmentProfileSchemaVersion: "sczn3-equipment-profile-v2",
  equipmentCatalogVersion: "episode58-gate2-pilot-2026-08-24",
  equipmentIdentityStatus: "publisher_catalog_match",
  equipmentIdentitySource: "equipment_knowledge_registry",
  equipmentProfileCreatedAt: "2026-08-24T14:00:00.000Z",
  equipmentProfileUpdatedAt: "2026-08-24T14:00:00.000Z",
  createdAt: "2026-08-24T14:00:00.000Z",
  updatedAt: "2026-08-24T14:00:00.000Z",
  weaponCategory: "Rifle",
  weaponManufacturer: "Colt",
  weaponModelType: "AR Platform",
  weaponModelCaliber: "Colt LE6920 5.56 NATO",
  weaponCatalogManufacturer: "Colt",
  weaponCatalogModel: "LE6920",
  weaponCatalogCaliber: "5.56 NATO",
  weaponFrameCategory: "Carbine",
  weaponVariantFlags: "Shooter-declared sling and stock configuration",
  weaponCatalogNotes: "Founder-entered durable note",
  equipmentCatalogAuthorityRecordId: "colt-le6920-556-current",
  equipmentConfigurationId: "colt-le6920-556",
  equipmentEntityType: "complete_firearm",
  equipmentKnowledgeSchemaId: "sczn3-equipment-knowledge-v1.1",
  equipmentKnowledgeRegistryVersion: "episode58-gate2-pilot-2026-08-24",
  opticType: "Scope",
  opticBrand: "Shooter Optic",
  opticModel: "Field 1-6x",
  opticAdjustmentUnit: "MOA",
  opticClickValue: "0.25",
  opticClickValueLabel: "1/4 MOA",
  opticClickValueMOA: 0.25,
  ammoCaliber: "5.56 NATO",
  ammoManufacturer: "Shooter Load",
  ammoLoad: "Practice load",
  bulletWeight: "55 gr",
  weaponPhoto: {
    dataUrl: photoDataUrl,
    name: "founder-working-rifle.svg",
    type: "image/svg+xml",
    savedAt: "2026-08-24T14:00:00.000Z"
  }
};

const preservedSession = {
  sessionId: "sczn3-session-equipment-forward-proof",
  sessionNumber: 1,
  sessionLabel: "Session #001",
  savedToSEC: true,
  timestamp: "2026-08-25T15:30:00.000Z",
  matrixSnapshot: {
    setupId: profileId,
    setupName: originalProfile.setupName,
    weaponManufacturer: originalProfile.weaponManufacturer,
    weaponModelCaliber: originalProfile.weaponModelCaliber
  }
};

const expandedRegistryScript = `window.SCZN3EquipmentKnowledgeRegistry = Object.freeze({
  schemaId: "sczn3-equipment-knowledge-v1.2-forward-proof",
  registryVersion: "m4-forward-expansion-proof-2026-08-31",
  records: Object.freeze([
    {
      recordId: "colt-le6920-556-current", configurationId: "colt-le6920-556", entityType: "complete_firearm",
      manufacturer: "Colt", model: "LE6920", aliases: ["Colt LE6920"], caliber: "5.56 NATO",
      frameCategory: "Carbine", barrelLength: "16 in", sightRadius: "", flags: ["AR Platform"],
      notes: "Existing catalog identity retained in the expanded registry."
    },
    {
      recordId: "colt-m4a1-556-forward-proof", configurationId: "colt-m4a1-556", entityType: "complete_firearm",
      manufacturer: "Colt", model: "M4A1", aliases: ["M4A1"], caliber: "5.56 NATO",
      frameCategory: "Carbine", barrelLength: "14.5 in", sightRadius: "", flags: ["M4", "Forward catalog proof"],
      technicalConfiguration: { operatingSystem: "direct_impingement", feedSystem: "detachable_box" },
      relationshipSchemaVersion: "sczn3-equipment-relationships-v2-forward-proof",
      notes: "Representative additive M4-era catalog/schema record."
    }
  ])
});`;

function durableProjection(profile) {
  return {
    setupId: profile.setupId,
    setupName: profile.setupName,
    equipmentProfileSchemaVersion: profile.equipmentProfileSchemaVersion,
    weaponCategory: profile.weaponCategory,
    weaponManufacturer: profile.weaponManufacturer,
    weaponModelType: profile.weaponModelType,
    weaponModelCaliber: profile.weaponModelCaliber,
    weaponCatalogManufacturer: profile.weaponCatalogManufacturer,
    weaponCatalogModel: profile.weaponCatalogModel,
    weaponCatalogCaliber: profile.weaponCatalogCaliber,
    weaponVariantFlags: profile.weaponVariantFlags,
    weaponCatalogNotes: profile.weaponCatalogNotes,
    equipmentCatalogAuthorityRecordId: profile.equipmentCatalogAuthorityRecordId,
    equipmentConfigurationId: profile.equipmentConfigurationId,
    equipmentEntityType: profile.equipmentEntityType,
    opticType: profile.opticType,
    opticBrand: profile.opticBrand,
    opticModel: profile.opticModel,
    opticAdjustmentUnit: profile.opticAdjustmentUnit,
    opticClickValue: profile.opticClickValue,
    ammoCaliber: profile.ammoCaliber,
    ammoManufacturer: profile.ammoManufacturer,
    ammoLoad: profile.ammoLoad,
    bulletWeight: profile.bulletWeight,
    weaponPhoto: profile.weaponPhoto ? {
      dataUrl: profile.weaponPhoto.dataUrl,
      name: profile.weaponPhoto.name,
      type: profile.weaponPhoto.type,
      savedAt: profile.weaponPhoto.savedAt
    } : null
  };
}

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/equipment_knowledge_registry.js*", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: expandedRegistryScript
  }));
  await context.addInitScript(({ profile, session, activeId }) => {
    localStorage.setItem("SCZN3_SAVED_EQUIPMENT_PROFILES", JSON.stringify([profile]));
    localStorage.setItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID", activeId);
    localStorage.setItem("SCZN3_SESSION_HISTORY", JSON.stringify([session]));
  }, { profile: originalProfile, session: preservedSession, activeId: profileId });

  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.setDefaultNavigationTimeout(12000);
  await page.goto(`${baseUrl}/matrix.html?view=library&equipment_profile_id=${profileId}`, { waitUntil: "networkidle" });

  assert.equal(await page.evaluate(() => window.SCZN3EquipmentKnowledgeRegistry.registryVersion), "m4-forward-expansion-proof-2026-08-31");
  assert.equal(await page.evaluate(() => window.SCZN3EquipmentKnowledgeRegistry.records.some(record => record.model === "M4A1")), true);
  assert.equal(await page.locator("#savedSetupSelect").inputValue(), profileId, "stable profile identity reopens after catalog expansion");
  assert.equal(await page.locator(".weapon-card.is-active").count(), 1, "active equipment selection survives expansion");
  assert.equal(await page.locator(".weapon-card-photo img").count(), 1, "shooter photo remains usable");
  assert.equal(await page.locator(".weapon-card dd", { hasText: "1" }).count() >= 1, true, "session relationship remains visible");
  assert.equal(await page.locator("body").evaluate(body => body.scrollWidth <= body.clientWidth), true, "expanded catalog remains usable at 390px");

  const hydratedBefore = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("SCZN3_SAVED_EQUIPMENT_PROFILES") || "[]");
    return window.SCZN3M4.hydrateStoredMedia(stored)[0];
  });
  assert.deepEqual(durableProjection(hydratedBefore), durableProjection(originalProfile), "shooter-owned durable fields survive the forward-expanded catalog unchanged");
  assert.equal(hydratedBefore.equipmentCatalogVersion, originalProfile.equipmentCatalogVersion, "catalog expansion does not silently rewrite saved provenance");

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  assert.equal(await page.locator("#setupName").inputValue(), originalProfile.setupName);
  assert.equal(await page.locator("#weaponPhotoPreview img").count(), 1);
  await page.getByRole("button", { name: "Save to My Equipment", exact: true }).click();

  const hydratedAfter = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem("SCZN3_SAVED_EQUIPMENT_PROFILES") || "[]");
    return window.SCZN3M4.hydrateStoredMedia(stored)[0];
  });
  assert.deepEqual(durableProjection(hydratedAfter), durableProjection(originalProfile), "editing and resaving after expansion preserves shooter data, photo, and exact equipment identity");
  assert.equal(hydratedAfter.equipmentCatalogVersion, "m4-forward-expansion-proof-2026-08-31", "resave truthfully records the catalog version in use");
  assert.equal(await page.evaluate(id => localStorage.getItem("SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID") === id, profileId), true);
  assert.equal(await page.evaluate(id => {
    const sessions = window.SCZN3M4.getSessionHistory();
    return sessions.length === 1 && sessions[0].matrixSnapshot.setupId === id && sessions[0].savedToSEC === true;
  }, profileId), true, "preserved session keeps its exact equipment-profile relationship");

  let candidate = null;
  await context.route("**/api/session/prepare", async route => {
    const body = route.request().postDataJSON();
    candidate = body.equipmentCandidates && body.equipmentCandidates[0];
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "proof_capture_complete" }) });
  });
  const targetPage = await context.newPage();
  await targetPage.goto(`${baseUrl}/matrix.html?target_profile_id=baker_st_100yd_smart_zero`, { waitUntil: "networkidle" });
  await targetPage.waitForFunction(() => document.querySelector("#sessionAuthorityStatus")?.textContent.length > 0);
  assert.ok(candidate, "an applicable future session still inherits the saved equipment profile");
  assert.equal(candidate.setupId, profileId);
  assert.equal(candidate.equipmentCatalogAuthorityRecordId, originalProfile.equipmentCatalogAuthorityRecordId);
  assert.equal(candidate.weaponManufacturer, originalProfile.weaponManufacturer);
  assert.equal(candidate.weaponModelCaliber, originalProfile.weaponModelCaliber);
  assert.equal(candidate.opticClickValue, originalProfile.opticClickValue);

  await context.close();
  console.log("PASS Equipment Library shooter-owned data, photo, active selection, exact reopen, session relationship, resave, and applicable-session inheritance across representative M4 catalog/schema expansion");
} finally {
  await browser.close();
}
