import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  WEAPON_EQUIPMENT_REGISTRY,
  WEAPON_EQUIPMENT_REGISTRY_SOURCE_SHA256,
  resolveProvenEquipmentRecord
} from "./generated_weapon_equipment_registry.mjs";

const sourceBytes = await readFile(
  "backend/registries/military_weapon_equipment_registry.json"
);
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
assert.equal(WEAPON_EQUIPMENT_REGISTRY_SOURCE_SHA256, sourceHash);
assert.equal(WEAPON_EQUIPMENT_REGISTRY.authorityOwner, "SCZN3 Weapon Library");
assert.equal(WEAPON_EQUIPMENT_REGISTRY.publicationStatus, "founder_review");
assert.equal(WEAPON_EQUIPMENT_REGISTRY.records.length, 1);

const recordId = "M4-IRON-DCH-FSP-AUTHORITY-2026-07-28";
const record = resolveProvenEquipmentRecord(recordId, "M4_IRON_DCH_FSP");
assert.ok(record);
assert.equal(record.status, "proven");
assert.equal(record.libraryPublicationStatus, "founder_review");
assert.equal(record.militaryDesignation, "M4/M4A1 Carbine");
assert.deepEqual(record.serviceBranches.map((entry) => entry.branch), ["Army"]);
assert.equal(record.axes.windage.movementPerClick, 0.75);
assert.equal(record.axes.elevation.movementPerClick, 1.5);
assert.equal(record.axes.windage.directionConvention.RIGHT, "CLOCKWISE");
assert.equal(record.axes.windage.directionConvention.LEFT, "COUNTERCLOCKWISE");
assert.equal(record.axes.elevation.directionConvention.UP, "CLOCKWISE");
assert.equal(record.axes.elevation.directionConvention.DOWN, "COUNTERCLOCKWISE");
assert.match(record.sourceDocumentation[0].url, /^https:\/\/api\.army\.mil\//);
assert.ok(record.validationRecord);
assert.equal(resolveProvenEquipmentRecord(recordId, "M4_IRON"), null);
assert.equal(resolveProvenEquipmentRecord("unknown-record", "M4_IRON_DCH_FSP"), null);

const missionConfig = await readFile("m4_sec_config.js", "utf8");
assert.match(missionConfig, new RegExp(recordId));
assert.match(missionConfig, /equipmentAuthorityRecordId/);
assert.doesNotMatch(missionConfig, /windagePerClick/);
assert.doesNotMatch(missionConfig, /elevationPerClick/);

const runtime = await readFile("m4_runtime.js", "utf8");
assert.match(runtime, /equipmentAuthorityRecordId/);
assert.doesNotMatch(runtime, /configuredSight\.windagePerClick/);
assert.doesNotMatch(runtime, /configuredSight\.elevationPerClick/);

console.log("PASS SCZN3 Military Weapon & Equipment Library authority contract");
