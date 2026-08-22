import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const document = { readyState: "complete", querySelectorAll() { return []; } };
const storage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const window = { document, localStorage: storage, sessionStorage: storage };
window.window = window;
const context = { window, document, localStorage: storage, sessionStorage: storage, console };
vm.createContext(context);
vm.runInContext(await readFile("platform_contracts.js", "utf8"), context, { filename: "platform_contracts.js" });
vm.runInContext(await readFile("sec_adapter_model.js", "utf8"), context, { filename: "sec_adapter_model.js" });
vm.runInContext(await readFile("sec_dispatch.js", "utf8"), context, { filename: "sec_dispatch.js" });

const adapters = window.SCZN3TargetAdapters;
const families = adapters.scoringPresentationFamilies;
const expected = [
  ["m4-zeroing", "m4_25m_zero", "zeroingCorrection", "zeroCorrectionResult", families.ZEROING_CORRECTION, ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"]],
  ["baker-100yd-zeroing", "baker_st_100yd_smart_zero", "zeroingCorrection", "zeroCorrectionResult", families.ZEROING_CORRECTION, ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"]],
  ["gssf", "gssf_ac_1", "gssf", "gssfPaperPenaltyResult", families.LOWEST_SCORE_WINS, ["evidence", "measurement", "execution", "validation", "preservation"]],
  ["baker-sl-st1", "baker_sl_st1_practice", "smartEvidenceCapture", "smartEvidenceResult", families.HIGHEST_SCORE_WINS, ["evidence", "measurement", "validation", "preservation"]],
  ["gunfun-vital-dude-evidence", "gunfun_22740_vital_dude", "smartEvidenceCapture", "smartEvidenceResult", families.EVIDENCE_ONLY, ["evidence", "validation", "preservation"]],
  ["baker-sl-st2-idpa", "idpa_silhouette_sl_st2", "idpaTimedPractice", "idpaTimeScoreResult", families.LOWEST_SCORE_WINS, ["evidence", "measurement", "execution", "validation", "preservation"]],
  ["baker-gf-db-points", "baker_gf_db", "bakerFunGame", "bakerDartboardGameResult", families.HIGHEST_SCORE_WINS, ["evidence", "measurement", "validation", "preservation"]],
  ["baker-gf-db-numbers", "baker_gf_db", "bakerFunGame", "bakerDartboardGameResult", families.QUALIFICATION_PASS_FAIL, ["evidence", "measurement", "validation", "preservation"]],
  ["baker-gf-bp", "baker_gf_bp", "bakerFunGame", "bakerBowlingPinsResult", families.QUALIFICATION_PASS_FAIL, ["evidence", "measurement", "validation", "preservation"]],
  ["ez2c-dot-torture", "ez2c_dot_torture_17", "catalogFunGame", "dotTortureCourseResult", families.HIGHEST_SCORE_WINS, ["evidence", "measurement", "execution", "validation", "preservation"]],
  ["baker-gf-bb-c", "baker_gf_bb_c", "catalogFunGame", "bakerBilliardSequenceResult", families.QUALIFICATION_PASS_FAIL, ["evidence", "measurement", "execution", "validation", "preservation"]],
  ["baker-gf-battleship", "baker_gf_battleship", "catalogFunGame", "bakerBattleshipGameResult", families.QUALIFICATION_PASS_FAIL, ["evidence", "measurement", "execution", "validation", "preservation"]]
];

assert.equal(adapters.all().length, expected.length, "Baseline, IDPA, and catalog Fun inherited adapters are registered");
for (const [adapterId, targetProfileId, missionFamily, resultType, family, stages] of expected) {
  const adapter = adapters.get(adapterId);
  assert.ok(adapter, `${adapterId} is registered`);
  assert.equal(Object.isFrozen(adapter), true, `${adapterId} governed definition is immutable`);
  assert.equal(Object.isFrozen(adapter.contentModel), true, `${adapterId} content mapping is immutable`);
  assert.equal(adapters.validateSEC(adapter).ok, true);
  assert.equal(adapter.targetProfileRef.targetProfileId, targetProfileId);
  assert.equal(adapter.authorityReferences.result.packageType, resultType);
  assert.equal(adapter.authorityReferences.result.source, "backend-authoritative");
  assert.equal(adapter.scoringPresentationFamily, family);
  assert.deepEqual(Array.from(adapter.contentModel.components, entry => entry.stage), stages);
  assert.ok(adapter.contentModel.result, "Result is a cross-family model outside semantic stages");
  assert.equal(adapter.contentModel.components.some(entry => entry.stage === "result"), false);

  const profile = window.SCZN3TargetProfiles.identityRecord(targetProfileId);
  const resultPackage = { mission_family: missionFamily, resultPackageType: resultType, authoritySource: "backend-authoritative", untouched: { score: 174 }, ...(adapterId === "baker-gf-db-numbers" ? { result: { gameMode: "game_of_numbers" } } : {}) };
  const session = {
    sessionId: `preserved-${adapterId}`,
    targetProfileId: profile.targetProfileId,
    targetProfileVersion: profile.targetProfileVersion,
    authorityPackage: resultPackage,
    evidence: { coordinates: [{ x: 0.25, y: 0.5 }] }
  };
  const mapped = adapters.createViewModel(adapterId, { session });
  assert.equal(mapped.ok, true, `${adapterId} accepts preserved authoritative session/package data`);
  assert.equal(mapped.value.session, session, "adapter preserves authoritative session reference");
  assert.equal(mapped.value.result.package, resultPackage, "adapter preserves authoritative result-package reference");
  assert.equal(mapped.value.targetProfileIdentity.targetProfileLabel, profile.targetProfileLabel);
  assert.deepEqual(mapped.value.publisherIdentity, profile.publisherIdentity);
  assert.deepEqual(mapped.value.productIdentity, profile.productIdentity);
  assert.equal(mapped.value.scoringPresentationFamily, family);
  assert.equal(window.SCZN3SECDispatch.resolve(session).adapter, adapterId, `${adapterId} contract matches the existing dispatch identity without migrating it`);
}

const validOmission = structuredClone(adapters.get("baker-sl-st1"));
validOmission.adapterId = "valid-omission";
validOmission.contentModel.components = validOmission.contentModel.components.filter(entry => entry.stage !== "measurement");
assert.equal(adapters.validateSEC(validOmission).ok, true, "inapplicable components may be omitted");

const reordered = structuredClone(adapters.get("baker-sl-st1"));
reordered.adapterId = "reordered";
reordered.contentModel.components = [...reordered.contentModel.components].reverse();
assert.ok(adapters.validateSEC(reordered).errors.includes("semantic_order_invalid"), "applicable components may not be reordered");

const resultAsStage = structuredClone(adapters.get("baker-sl-st1"));
resultAsStage.adapterId = "result-stage";
resultAsStage.contentModel.components.splice(1, 0, { stage: "result", modelRef: "bad", authorityRef: "bad" });
assert.ok(adapters.validateSEC(resultAsStage).errors.includes("result_is_not_a_semantic_stage"));

for (const [key, value] of [
  ["outerShell", "<main>adapter shell</main>"],
  ["structuralCss", ".sec { display:grid }"],
  ["navigation", { href: "/" }],
  ["scoringFormula", "A * 10"],
  ["classify", () => "A"],
  ["qualificationDecision", "PASS"]
]) {
  const prohibited = structuredClone(adapters.get("baker-sl-st1"));
  prohibited.adapterId = `prohibited-${key}`;
  prohibited.contentModel.result[key] = value;
  const validation = adapters.validateSEC(prohibited);
  assert.equal(validation.ok, false, `${key} remains outside adapter ownership`);
}

const reservedQualification = structuredClone(adapters.get("baker-sl-st1"));
reservedQualification.adapterId = "reserved-qualification";
reservedQualification.scoringPresentationFamily = families.QUALIFICATION_PASS_FAIL;
assert.ok(adapters.validateSEC(reservedQualification).errors.includes("qualification_presentation_requires_backend_authority"));

const frontendClaim = adapters.createViewModel("baker-sl-st1", {
  session: { targetProfileId: "baker_sl_st1_practice", targetProfileVersion: "1" },
  resultSource: "frontend",
  resultPackage: { resultPackageType: "smartEvidenceResult", scoring: { total: 999 } }
});
assert.equal(frontendClaim.ok, false);
assert.ok(frontendClaim.errors.includes("frontend_result_authority_rejected"), "frontend result claims are rejected rather than mapped as authority");

const unprovenSuppliedPackage = adapters.createViewModel("baker-sl-st1", {
  session: { targetProfileId: "baker_sl_st1_practice", targetProfileVersion: "1" },
  resultPackage: { resultPackageType: "smartEvidenceResult", scoring: { total: 999 } }
});
assert.equal(unprovenSuppliedPackage.ok, false, "an externally supplied package must explicitly prove backend authority");
assert.ok(unprovenSuppliedPackage.errors.includes("frontend_result_authority_rejected"));

const wrongProfileVersion = adapters.createViewModel("baker-sl-st1", {
  session: {
    targetProfileId: "baker_sl_st1_practice",
    targetProfileVersion: "unapproved-version",
    authorityPackage: { resultPackageType: "smartEvidenceResult" }
  }
});
assert.equal(wrongProfileVersion.ok, false);
assert.ok(wrongProfileVersion.errors.includes("authoritative_target_profile_version_conflict"));

for (const legacyPackageField of ["authorityPackage", "backendAuthorityPackage", "ugeoAuthorityPackage", "m4AuthorityPackage"]) {
  const packageValue = { mission_family: "zeroingCorrection", resultPackageType: "zeroCorrectionResult", preserved: true };
  const preservedSession = {
    sessionId: `legacy-${legacyPackageField}`,
    targetProfileId: "m4_25m_zero",
    targetProfileVersion: "M4_TARGET_AUTHORITY_v1_ORIGINAL",
    [legacyPackageField]: packageValue
  };
  const mapped = adapters.createViewModel("m4-zeroing", { session: preservedSession });
  assert.equal(mapped.ok, true, `${legacyPackageField} remains readable without rewriting preserved SEC data`);
  assert.equal(mapped.value.result.package, packageValue);
}

const buildSite = await readFile("production/build-site.mjs", "utf8");
const buildNetlify = await readFile("production/build-netlify.mjs", "utf8");
assert.match(buildSite, /"sec_adapter_model\.js"/);
assert.match(buildNetlify, /"sec_adapter_model\.js"/);

console.log("PASS Episode 54 Item 3 governed SEC adapter model, four-target representation, authority boundary, and preserved-data compatibility");
