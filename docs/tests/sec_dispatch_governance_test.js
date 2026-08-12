import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(docs, "sec_dispatch.js"), "utf8");
const context = { window: {}, URLSearchParams };
vm.runInNewContext(source, context, { filename: "sec_dispatch.js" });
const dispatch = context.window.SCZN3SECDispatch;

function session(targetProfileId, missionFamily, resultPackageType, extra = {}) {
  return {
    sessionId: `test-${targetProfileId}`,
    matrixSnapshot: { target_profile_id: targetProfileId, mission_family: missionFamily, resultPackageType },
    authorityPackage: { ok: true, target_profile_id: targetProfileId, mission_family: missionFamily, resultPackageType },
    ...extra
  };
}

const cases = [
  ["m4_25m_zero", "zeroingCorrection", "zeroCorrectionResult", dispatch.ADAPTERS.M4_ZEROING],
  ["baker_st_100yd_smart_zero", "zeroingCorrection", "zeroCorrectionResult", dispatch.ADAPTERS.BAKER_100YD_ZEROING],
  ["gssf_ac_1", "gssf", "gssfPaperPenaltyResult", dispatch.ADAPTERS.GSSF],
  ["dot_torture_ez2c_style_17", "marksmanshipTraining", "marksmanshipTrainingResult", dispatch.ADAPTERS.TRAINING],
  ["dot_torture_lite_ez2c", "marksmanshipTraining", "marksmanshipTrainingResult", dispatch.ADAPTERS.TRAINING],
  ["revolving_dot_torture_ez2c", "marksmanshipTraining", "marksmanshipTrainingResult", dispatch.ADAPTERS.TRAINING],
  ["st_001_universal_bullseye", "universalPractice", "universalPracticeAnalysisResult", dispatch.ADAPTERS.UNIVERSAL_PRACTICE]
];

for (const [target, mission, resultType, adapter] of cases) {
  assert.strictEqual(dispatch.resolve(session(target, mission, resultType)).adapter, adapter, `${target} must select ${adapter}`);
}

const session302 = session("gssf_ac_1", "gssf", "gssfPaperPenaltyResult", {
  sessionId: "session-302",
  officialMatchTimeSeconds: 7,
  officialFinalScoreSeconds: 14,
  savedToSEC: true,
  workflowStage: "preservation",
  preservationStatus: "saved",
  confirmationStatus: "Confirmed",
  correctionStatus: "backend-authority-calculated",
  correctionData: { status: "backend-authority-calculated", clicks: { elevation: 9, windage: 4 } },
  clicks: { elevation: 9, windage: 4 },
  m4AuthorityPackage: { status: { hasCorrection: true } },
  confirmationAuthorityPackage: { status: { hasCorrection: true } },
  confirmationImpactPoints: [{ x: 1, y: 1 }],
  confirmationEvidenceImage: { dataUrl: "data:image/png;base64,stale" }
});
assert.strictEqual(dispatch.resolve(session302).adapter, dispatch.ADAPTERS.GSSF, "Session #302 stale zeroing state must not override GSSF identity");
assert.match(dispatch.destinationFor(session302), /^records\.html\?session=session-302&view=sec$/, "Session #302 must reopen in the GSSF historical SEC");

const staleMatrix = [
  [session("m4_25m_zero", "zeroingCorrection", "zeroCorrectionResult", { officialMatchTimeSeconds: 9.2, officialFinalScoreSeconds: 12.2 }), dispatch.ADAPTERS.M4_ZEROING],
  [session("baker_st_100yd_smart_zero", "zeroingCorrection", "zeroCorrectionResult", { totalPaperPenaltySeconds: 7, officialFinalScoreSeconds: 14 }), dispatch.ADAPTERS.BAKER_100YD_ZEROING],
  [session("dot_torture_ez2c_style_17", "marksmanshipTraining", "marksmanshipTrainingResult", { correctionData: { status: "backend-authority-calculated" }, confirmationAuthorityPackage: {} }), dispatch.ADAPTERS.TRAINING],
  [session("st_001_universal_bullseye", "universalPractice", "universalPracticeAnalysisResult", { workflowStage: "preservation", confirmationAuthorityPackage: {} }), dispatch.ADAPTERS.UNIVERSAL_PRACTICE]
];
for (const [record, adapter] of staleMatrix) {
  assert.strictEqual(dispatch.resolve(record).adapter, adapter, `stale mission fields must not override ${adapter}`);
}

const conflict = session("gssf_ac_1", "gssf", "gssfPaperPenaltyResult");
conflict.backendSessionAuthority = { target: { targetId: "m4_25m_zero" }, missionIdentity: { missionFamily: "zeroingCorrection", resultPackageType: "zeroCorrectionResult" } };
assert.strictEqual(dispatch.resolve(conflict).adapter, dispatch.ADAPTERS.UNAVAILABLE, "contradictory authoritative identity must fail closed");
assert.strictEqual(dispatch.resolve(conflict).reason, "identity_conflict");

const unknown = session("unknown_target", "zeroingCorrection", "zeroCorrectionResult", {
  workflowStage: "preservation",
  confirmationAuthorityPackage: { status: { hasCorrection: true } },
  confirmationImpactPoints: [{ x: 1, y: 1 }]
});
assert.strictEqual(dispatch.resolve(unknown).adapter, dispatch.ADAPTERS.UNAVAILABLE, "unknown target must never inherit the zeroing renderer");

const records = fs.readFileSync(path.join(docs, "records.html"), "utf8");
const shoot = fs.readFileSync(path.join(docs, "shoot.html"), "utf8");
const sec = fs.readFileSync(path.join(docs, "sec.html"), "utf8");
const buildSite = fs.readFileSync(path.join(docs, "production", "build-site.mjs"), "utf8");
const buildNetlify = fs.readFileSync(path.join(docs, "production", "build-netlify.mjs"), "utf8");
for (const [name, html] of [["records", records], ["shoot", shoot], ["sec", sec]]) {
  assert(html.includes("sec_dispatch.js?v=universal-sec-dispatch-1"), `${name} must load the shared SEC dispatcher`);
}
assert(records.includes("SCZN3SECDispatch.destinationFor(session)"), "Vault links must use shared SEC dispatch");
assert(shoot.includes("SCZN3SECDispatch.destinationFor(saved)"), "post-save handoff must use shared SEC dispatch");
assert(sec.includes("SCZN3SECDispatch.resolve(candidate).adapter === SCZN3SECDispatch.ADAPTERS.M4_ZEROING"), "sec.html must reject non-M4 identities");
assert(buildSite.includes('"sec_dispatch.js"'), "server build must publish the shared SEC dispatcher");
assert(buildNetlify.includes('"sec_dispatch.js"'), "Netlify build must publish the shared SEC dispatcher");

console.log("PASS universal SEC dispatch governance and Session #302 stale-field regression");
