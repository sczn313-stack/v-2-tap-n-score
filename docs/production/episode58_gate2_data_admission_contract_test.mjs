import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const registry = JSON.parse(await readFile("backend/registries/equipment_knowledge_registry.json", "utf8"));
const browserRegistrySource = await readFile("equipment_knowledge_registry.js", "utf8");
const matrix = await readFile("matrix.html", "utf8");
const appState = await readFile("app_state.js", "utf8");
const sessionAuthority = await readFile("backend/session_authority.py", "utf8");

assert.equal(registry.schemaId, "sczn3-equipment-knowledge-v1.1");
assert.equal(registry.registryVersion, "episode58-gate2-pilot-2026-08-24");
assert.equal(registry.records.length, 4);
assert.deepEqual(registry.records.map(record => record.model).sort(), ["G17 Gen6", "G19 Gen6", "G45 Gen6", "METE MC9 PRIME"]);
assert.equal(new Set(registry.records.map(record => record.recordId)).size, registry.records.length);
assert.equal(new Set(registry.records.map(record => record.configurationId)).size, registry.records.length);

for (const record of registry.records) {
  assert.equal(record.entityType, "complete_firearm");
  assert.ok(record.manufacturer && record.model && record.caliber && record.configurationId);
  assert.ok(record.facts.length > 0, `${record.model} has evidence-bearing facts`);
  for (const assertion of [...record.facts, ...record.relationships]) {
    assert.ok(assertion.envelope, `${assertion.factId || assertion.relationshipId} carries its own envelope`);
    for (const field of ["source", "sourceOwner", "observedAt", "factGrade", "scope", "status"]) {
      assert.ok(assertion.envelope[field], `${assertion.factId || assertion.relationshipId} envelope includes ${field}`);
    }
  }
  const predicates = new Set(record.facts.map(fact => fact.predicate));
  assert.ok(predicates.has("modelAndCaliber") || (predicates.has("modelName") && predicates.has("caliber")), `${record.model} identity projection is fact-backed`);
  if (record.frameCategory) assert.ok(predicates.has("frameCategory"), `${record.model} frame category is fact-backed`);
  if (record.barrelLength) assert.ok(predicates.has("barrelLength"), `${record.model} barrel length is fact-backed`);
}

const sandbox = { window: {} };
vm.runInNewContext(browserRegistrySource, sandbox);
const browserRegistry = JSON.parse(JSON.stringify(sandbox.window.SCZN3EquipmentKnowledgeRegistry));
const projectionFields = ["recordId", "configurationId", "entityType", "manufacturer", "model", "aliases", "caliber", "frameCategory", "barrelLength", "sightRadius", "flags", "notes"];
const expectedProjection = registry.records.map(record => Object.fromEntries(projectionFields.map(field => [field, record[field]])));
assert.deepEqual(browserRegistry.records, expectedProjection, "browser projection exactly matches canonical registry identity/presentation facts");
assert.equal(browserRegistry.schemaId, registry.schemaId);
assert.equal(browserRegistry.registryVersion, registry.registryVersion);

assert.match(matrix, /SCZN3EquipmentKnowledgeRegistry/);
assert.match(matrix, /projectRegisteredEquipmentRecord/);
assert.match(matrix, /REGISTERED_EQUIPMENT_RECORDS/);
assert.match(matrix, /equipmentCatalogAuthorityRecordId/);
assert.match(sessionAuthority, /EQUIPMENT_KNOWLEDGE_BY_RECORD_ID/);
assert.match(sessionAuthority, /equipmentKnowledgeFacts/);
assert.match(sessionAuthority, /equipmentKnowledgeRelationships/);

const productionRoutingSurfaces = [matrix, appState, sessionAuthority].join("\n");
for (const forbiddenIdentity of ["METE MC9 PRIME", "G17 Gen6", "G19 Gen6", "G45 Gen6", "canik-mete-mc9-prime-9mm", "glock-g17-gen6-9mm"]) {
  assert.equal(productionRoutingSurfaces.includes(forbiddenIdentity), false, `${forbiddenIdentity} must exist in governed data, not production routing`);
}
assert.doesNotMatch(matrix, /if\s*\([^)]*(?:mc9-prime|g17-gen6|g19-gen6|g45-gen6)/i);
assert.doesNotMatch(sessionAuthority, /if\s*\([^)]*(?:mc9-prime|g17-gen6|g19-gen6|g45-gen6)/i);

console.log("PASS Episode 58 Gate 2: MC9 PRIME and Glock Gen6 are governed data with zero product-specific production routing");
