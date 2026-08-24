import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const matrix = await readFile("matrix.html", "utf8");
const appState = await readFile("app_state.js", "utf8");
const sessionAuthority = await readFile("backend/session_authority.py", "utf8");
const census = JSON.parse(await readFile(
  "authority-evidence/publisher-os/2026-08-23-weapon-library-full-catalog-intelligence/CURRENT_MENU_BASELINE.json",
  "utf8"
));

assert.equal(census.firearmManufacturers.length, 21);
assert.equal(census.opticManufacturers.length, 7);
assert.equal(census.ammunitionManufacturers.length, 14);
for (const manufacturer of [
  ...census.firearmManufacturers,
  ...census.opticManufacturers,
  ...census.ammunitionManufacturers
]) {
  assert.ok(matrix.includes(manufacturer), `Episode 58 baseline manufacturer missing from data-driven controls: ${manufacturer}`);
}

assert.match(matrix, /sczn3-equipment-profile-v2/);
assert.match(matrix, /LEGACY_EQUIPMENT_PROFILE_SCHEMA_VERSION = "sczn3-equipment-profile-v1"/);
assert.match(matrix, /SCZN3_ACTIVE_EQUIPMENT_PROFILE_ID/);
assert.match(appState, /activeEquipmentProfile/);
assert.match(matrix, /equipment_profile_id/);
assert.match(matrix, /equipmentCatalogVersion/);
assert.match(matrix, /publisher_catalog_match/);
assert.match(matrix, /shooter_declared/);
const durablePayload = matrix.match(/function setupPayload\(snapshot\) \{([\s\S]*?)\n\}/)?.[1] || "";
for (const transientField of [
  "targetDistanceValue", "shooterName", "agency", "weather", "targetProfileId", "qrId", "targetName"
]) {
  assert.doesNotMatch(durablePayload, new RegExp(`"${transientField}"`), `${transientField} must not be part of durable Equipment Profile V2`);
}
assert.match(matrix, /function migrateEquipmentProfile/);
assert.match(matrix, /equipment_identity_only/);
assert.doesNotMatch(matrix, /<dt>Saved Distance<\/dt>/);
assert.match(matrix, /<dt>Zero<\/dt>/);
assert.match(sessionAuthority, /equipmentProfileSchemaVersion/);
assert.match(sessionAuthority, /catalogModel/);
assert.match(sessionAuthority, /ammoManufacturer/);
assert.doesNotMatch(matrix, /data-setup-id="(?:glock|canik|colt|m4)/i, "cards must not route by manufacturer/model identity");
assert.match(matrix, /Select Click Value/);
assert.doesNotMatch(matrix, /selectedString \? "Custom" : options\[0\]\.value/);

console.log("PASS Episode 58 equipment identity, census coverage, and data-driven inheritance contract");
