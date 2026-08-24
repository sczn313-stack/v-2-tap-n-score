import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const baseUrl = process.env.SCZN3_TEST_BASE_URL || "http://127.0.0.1:8101";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SCZN3_CHROME_EXECUTABLE || undefined
});

async function selectRegisteredEquipment(page, manufacturer, query, exactLabel) {
  await page.getByRole("button", { name: "New Equipment", exact: true }).click();
  await page.locator("[data-weapon-category='Pistol']").click();
  await page.locator("#weaponManufacturer").selectOption({ label: manufacturer });
  await page.locator("#glockModelSearch").fill(query);
  await page.locator("#weaponModelCaliber").selectOption({ label: exactLabel });
  const identity = await page.evaluate(() => ({
    recordId: document.querySelector("#equipmentCatalogAuthorityRecordId").value,
    configurationId: document.querySelector("#equipmentConfigurationId").value,
    entityType: document.querySelector("#equipmentEntityType").value,
    schemaId: document.querySelector("#equipmentKnowledgeSchemaId").value,
    registryVersion: document.querySelector("#equipmentKnowledgeRegistryVersion").value,
    barrelLength: document.querySelector('[name="barrelLength"]').value
  }));
  await page.getByRole("button", { name: "Save to My Equipment", exact: true }).click();
  return identity;
}

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/matrix.html?view=library`, { waitUntil: "networkidle" });

  const canik = await selectRegisteredEquipment(page, "Canik", "Prime", "METE MC9 PRIME 9mm");
  assert.equal(canik.recordId, "canik-mete-mc9-prime-9mm-current");
  assert.equal(canik.configurationId, "canik-mete-mc9-prime-9mm");
  assert.equal(canik.entityType, "complete_firearm");
  assert.equal(canik.schemaId, "sczn3-equipment-knowledge-v1.1");
  assert.equal(canik.registryVersion, "episode58-gate2-pilot-2026-08-24");
  assert.equal(canik.barrelLength, "3.64 in");

  await page.getByRole("button", { name: "New Equipment", exact: true }).click();
  await page.locator("[data-weapon-category='Pistol']").click();
  await page.locator("#weaponManufacturer").selectOption({ label: "Glock" });
  await page.locator("#glockModelSearch").fill("Gen6");
  const gen6Options = await page.locator("#weaponModelCaliber option").allTextContents();
  assert.deepEqual(gen6Options.filter(label => label.includes("Gen6")), ["G17 Gen6 9mm", "G19 Gen6 9mm", "G45 Gen6 9mm"]);
  await page.locator("#weaponModelCaliber").selectOption({ label: "G17 Gen6 9mm" });
  const glock = await page.evaluate(() => ({
    recordId: document.querySelector("#equipmentCatalogAuthorityRecordId").value,
    configurationId: document.querySelector("#equipmentConfigurationId").value,
    entityType: document.querySelector("#equipmentEntityType").value,
    barrelLength: document.querySelector('[name="barrelLength"]').value
  }));
  assert.equal(glock.recordId, "glock-g17-gen6-9mm-current");
  assert.equal(glock.configurationId, "glock-g17-gen6-9mm");
  assert.equal(glock.entityType, "complete_firearm");
  assert.equal(glock.barrelLength, "", "an unpublished Gen6 barrel fact must remain unresolved rather than inherit Gen5 data");
  await page.getByRole("button", { name: "Save to My Equipment", exact: true }).click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("SCZN3_SAVED_EQUIPMENT_PROFILES") || "[]"));
  assert.equal(saved.length, 2);
  const savedCanik = saved.find(item => item.equipmentConfigurationId === "canik-mete-mc9-prime-9mm");
  const savedGlock = saved.find(item => item.equipmentConfigurationId === "glock-g17-gen6-9mm");
  assert.ok(savedCanik && savedGlock);
  assert.equal(savedCanik.equipmentIdentitySource, "equipment_knowledge_registry");
  assert.equal(savedGlock.equipmentIdentitySource, "equipment_knowledge_registry");
  assert.equal(await page.locator("body").evaluate(body => body.scrollWidth <= body.clientWidth), true);

  for (const savedProfile of [savedCanik, savedGlock]) {
    const reopen = await context.newPage();
    await reopen.goto(`${baseUrl}/matrix.html?view=library&equipment_profile_id=${encodeURIComponent(savedProfile.setupId)}`, { waitUntil: "networkidle" });
    assert.equal(await reopen.locator("#savedSetupSelect").inputValue(), savedProfile.setupId);
    assert.equal(await reopen.locator("#equipmentConfigurationId").inputValue(), savedProfile.equipmentConfigurationId);
    await reopen.close();
  }

  let preparedCandidate = null;
  await context.route("**/api/session/prepare", async route => {
    const body = route.request().postDataJSON();
    preparedCandidate = body.equipmentCandidates && body.equipmentCandidates[0];
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, reason: "test_stop_after_candidate_capture" }) });
  });
  const targetPage = await context.newPage();
  await targetPage.goto(`${baseUrl}/matrix.html?target_profile_id=baker_st_100yd_smart_zero`, { waitUntil: "networkidle" });
  await targetPage.waitForFunction(() => document.querySelector("#sessionAuthorityStatus")?.textContent.length > 0);
  assert.ok(preparedCandidate);
  assert.equal(preparedCandidate.equipmentConfigurationId, "glock-g17-gen6-9mm");
  assert.equal(preparedCandidate.equipmentCatalogAuthorityRecordId, "glock-g17-gen6-9mm-current");

  await context.close();
  console.log("PASS Episode 58 Gate 2 browser: MC9 PRIME + Glock Gen6 find, select, save, exact reopen, and inherited use at 390px");
} finally {
  await browser.close();
}

