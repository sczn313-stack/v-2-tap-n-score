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

assert.equal(cohort.targets.length, 21, "batch must contain exactly 21 targets");
assert.equal((launcher.match(/class="review-card"/g) || []).length, 21, "launcher must contain exactly 21 cards");
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
  assert.equal(targets.length, 3, `${category} must contain exactly three targets`);
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
  assert.match(zeroingLoader, new RegExp(`${target.targetProfileId}:[\\s\\S]*?/scale-batch-assets/target-${target.ordinal}\\.`), `zeroing review image handoff ${target.ordinal}`);
}

assert.match(reviewServer, /founder-scale-batch-1-review\.html/);
assert.match(reviewServer, /founder-scale-batch-1-review-loader\.js/);
assert.match(reviewServer, /founder-scale-batch-1-zeroing-loader\.js/);
assert.equal((reviewServer.match(/\["\/scale-batch-assets\/target-(?:0[1-9]|1\d|2[01])\./g) || []).length, 21, "review server exposes 21 exact representations");
assert.match(matrix, /scaleBatchReviewQuery/);
assert.match(matrix, /!queryTargetProfileId && window\.SCZN3SmartTargetIdentity/);
assert.match(matrix, /target_profile_id: queryTargetProfileId\.toLowerCase\(\)/);
assert.match(matrix, /backendSession && backendSession\.target && backendSession\.target\.targetId/);
assert.match(matrix, /JSON\.stringify\(useStandardSetup/);
assert.doesNotMatch(productionScoringRoad, /founder-scale-batch-1-review-loader/);
assert.doesNotMatch(productionZeroingRoad, /founder-scale-batch-1-zeroing-loader/);

console.log("PASS Scale Batch #1: 21 targets, 7 categories, 3/category, >=2 printers/category, 12 printers, shared scoring/zeroing roads, exact review-only image handoffs");
