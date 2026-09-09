import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const cohort = JSON.parse(await readFile(
  "authority-evidence/platform/scale-batch-1-2026-09-08/SCALE_BATCH_1_COHORT.json",
  "utf8",
));
const launcher = await readFile("founder-scale-batch-1-review.html", "utf8");
const scoringLoader = await readFile("founder-scale-batch-1-review-loader.js", "utf8");
const zeroingLoader = await readFile("founder-scale-batch-1-zeroing-loader.js", "utf8");
const reviewServer = await readFile("production/m16a2_tstt_review_server.mjs", "utf8");
const matrix = await readFile("matrix.html", "utf8");
const productionScoringRoad = await readFile("target-experience.html", "utf8");
const productionZeroingRoad = await readFile("shoot.html", "utf8");
const zeroingSEC = await readFile("sec.html", "utf8");
const productionScoringRuntime = await readFile("target_execution_runtime.js", "utf8");
const appState = await readFile("app_state.js", "utf8");
const m4Runtime = await readFile("m4_runtime.js", "utf8");
const batchAuthority = await readFile("production/target_data_one_road_scale_review_server.py", "utf8");

assert.equal(cohort.targets.length, 22, "batch must contain exactly 22 targets");
assert.equal((launcher.match(/class="review-card"/g) || []).length, 22, "launcher must contain exactly 22 cards");
assert.equal(cohort.implementationResult.targetSpecificProductionImplementationsAdded, 0);
assert.equal(cohort.implementationResult.newShooterRoadsAdded, 0);
assert.deepEqual(cohort.implementationResult.missingReusableBehaviors, []);

const categories = new Map();
const publishers = new Set();
for (const target of cohort.targets) {
  const records = categories.get(target.category) || [];
  records.push(target);
  categories.set(target.category, records);
  publishers.add(target.publisher);
  assert.match(launcher, new RegExp(`TARGET #${target.ordinal}(?:<|\\b)`), `visible ordinal ${target.ordinal}`);
  assert.match(launcher, new RegExp(target.identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `visible source identity ${target.ordinal}`);
  await access(target.imagePath);
}
assert.equal(categories.size, 7, "seven requested categories");
for (const [category, targets] of categories) {
  assert.ok(targets.length >= 3, `${category} must contain at least three targets`);
  assert.ok(new Set(targets.map(target => target.publisher)).size >= 2, `${category} must span at least two printers`);
}
assert.equal(publishers.size, 12, "the complete batch must represent all 12 printers");

for (const target of cohort.targets.filter(target => target.runtimeType === "targetScoring")) {
  const contractPath = `backend/target_execution_contracts/contracts/${target.targetProfileId}_target_scoring_v1.json`;
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  assert.equal(contract.targetProfile.id, target.targetProfileId, `contract profile ${target.ordinal}`);
  assert.equal(contract.missionFamily, "targetScoring", `shared scoring mission ${target.ordinal}`);
  assert.equal(contract.executor.id, "declarative-target-score", `shared executor ${target.ordinal}`);
  assert.match(scoringLoader, new RegExp(`${target.targetProfileId}:[\\s\\S]*?/scale-batch-assets/target-${String(target.ordinal).padStart(2, "0")}\\.`), `review image handoff ${target.ordinal}`);
}

for (const target of cohort.targets.filter(target => target.runtimeType === "zeroingCorrection")) {
  assert.match(launcher, new RegExp(`target_profile_id=${target.targetProfileId}[\\s\\S]*?founderReview=scale-batch-1`), `zeroing launcher ${target.ordinal}`);
  const reviewImagePattern = target.ordinal === 22
    ? "/scale-batch-assets/target-22-runtime\\.png"
    : `/scale-batch-assets/target-${target.ordinal}\\.`;
  assert.match(zeroingLoader, new RegExp(`${target.targetProfileId}:[\\s\\S]*?${reviewImagePattern}`), `zeroing review image handoff ${target.ordinal}`);
}

assert.match(reviewServer, /founder-scale-batch-1-review\.html/);
assert.match(reviewServer, /founder-scale-batch-1-review-loader\.js/);
assert.match(reviewServer, /founder-scale-batch-1-zeroing-loader\.js/);
assert.equal((reviewServer.match(/\["\/scale-batch-assets\/target-(?:0[1-9]|1\d|2[0-2])\./g) || []).length, 22, "review server exposes 22 exact representations");
assert.match(reviewServer, /\["\/scale-batch-assets\/target-22-runtime\.png", "assets\/M4_M16_25M_ZERO_AUTHORITY_v1\.png"\]/, "Target #22 reuses the finished Universal registered image");
assert.match(matrix, /scaleBatchReviewQuery/);
assert.match(matrix, /!queryTargetProfileId && window\.SCZN3SmartTargetIdentity/);
assert.match(matrix, /target_profile_id: queryTargetProfileId\.toLowerCase\(\)/);
assert.match(matrix, /backendSession && backendSession\.target && backendSession\.target\.targetId/);
assert.match(matrix, /JSON\.stringify\(useStandardSetup/);
assert.doesNotMatch(productionScoringRoad, /founder-scale-batch-1-review-loader/);
assert.doesNotMatch(productionZeroingRoad, /founder-scale-batch-1-zeroing-loader/);
assert.match(productionScoringRuntime, /function targetScoringRows\(result\)/, "shared runtime consumes preserved region/object results");
assert.match(productionScoringRuntime, /aria-label="Target scoring detail"/, "SEC exposes target-defined scoring detail");
assert.match(productionScoringRuntime, /status: "complete"[\s\S]*?breakdown: rows\.map/, "Vault exposes the same target-defined scoring detail");
assert.match(productionScoringRoad, /sec_reopen_capability\.js/, "shared scoring road loads the existing SEC reopen capability");
assert.match(productionScoringRuntime, /SCZN3SECReopenAuthority\?\.remember\(response\)/, "shared scoring road preserves the backend-issued reopen capability");
assert.match(productionScoringRuntime, /authorizedHeaders\(sessionId\)/, "shared scoring exact reopen presents the backend-issued capability");
assert.match(batchAuthority, /from m4_authority\.authority_service import build_authority_package as build_m4_authority/, "Batch authority reuses existing M4\/M16 service");
assert.match(batchAuthority, /path in \{"\/api\/authority\/m4", "\/api\/authority\/m4\/"\}[\s\S]*?build_m4_authority\(payload\)/, "Batch authority exposes existing M4\/M16 endpoint");
assert.match(appState, /selectedEquipment\.adjustmentProfileId[\s\S]*selectedEquipment\.equipmentConfigurationId[\s\S]*selectedEquipment\.mechanicalAuthority/, "shared session state preserves backend-selected mechanical authority for every family target");
assert.match(zeroingSEC, /ZEROING_SEC_ADAPTERS[\s\S]*SPEEDWELL_M16A2_ZEROING[\s\S]*GUNFUN_32120_M16A2_ZEROING/, "shared zeroing SEC admits every existing family adapter without redispatch loops");
assert.match(m4Runtime, /zeroingAdapters[\s\S]*SPEEDWELL_M16A2_ZEROING[\s\S]*GUNFUN_32120_M16A2_ZEROING[\s\S]*supportedConfirmationResult/, "shared preservation admits confirmed sessions from every existing family adapter");

console.log("PASS Scale Batch #1: 22 targets, 7 categories, >=3/category, >=2 printers/category, 12 printers, shared scoring/zeroing roads, exact review-only image handoffs");
