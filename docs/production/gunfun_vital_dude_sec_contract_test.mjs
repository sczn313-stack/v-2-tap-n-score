import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const sources = await Promise.all([
  "platform_contracts.js", "sec_adapter_model.js", "sec_dispatch.js", "sec_v1.js", "sec_framework.js", "gunfun_vital_dude_sec.js"
].map(name => readFile(new URL(name, root), "utf8")));
const context = { window: {} };
vm.createContext(context);
sources.forEach(source => vm.runInContext(source, context));

const pkg = {
  ok: true,
  status: "supported_analysis_ready",
  authoritySource: "backend-authoritative",
  missionFamily: "smartEvidenceCapture",
  missionId: "GUNFUN_22740_EVIDENCE_CAPTURE_V1",
  resultPackageType: "smartEvidenceResult",
  target: {
    smartTargetId: "GUNFUN_22740_VITAL_DUDE",
    variantId: "GUNFUN_22740_VITAL_DUDE_23X35",
    targetProfileId: "gunfun_22740_vital_dude",
    targetProfileVersion: "1",
    publisher: "GunFun",
    productName: "Vital Dude",
    sku: "22740"
  },
  imageEvidence: { sha256: "a".repeat(64), backendHashVerified: true, widthPx: 1200, heightPx: 1800 },
  impacts: [
    { impactId: "observation-001", xNorm: .25, yNorm: .4, evidenceMeaning: "shooter_recorded_visible_shot_observation" },
    { impactId: "observation-002", xNorm: .75, yNorm: .6, evidenceMeaning: "shooter_recorded_visible_shot_observation" }
  ],
  shooterDeclaredAimPoint: { xNorm: .5, yNorm: .5, declaredBy: "shooter", evidenceMeaning: "shooter_declared_aim_point", authorityScope: "session_evidence_only" },
  supportedAnalysis: { impactCount: 2 },
  reconciliation: { capturedObservationCount: 2, acceptedObservationCount: 2, countsMatch: true },
  ugo: { status: "image_plane_evidence_only", canonicalRegionMapping: "unavailable", semanticClassification: "unavailable", physicalMeasurement: "unavailable" },
  scoring: { status: "not_applicable", reason: "evidence_only_experience" },
  capabilityStates: { anatomicalClassification: "unavailable", medicalMeaning: "unavailable", tacticalMeaning: "unavailable", qualification: "not_applicable", missionRules: "not_applicable", correction: "not_applicable" },
  evidenceIdentity: "VITAL-DUDE-EVIDENCE-TEST"
};
const session = {
  sessionId: "sczn3-session-vital-dude-test",
  sessionLabel: "Session #001",
  sessionIdAuthority: "backend",
  createdAt: "2026-08-18T22:30:00Z",
  targetEvidenceImage: { dataUrl: "data:image/jpeg;base64,AA==", widthPx: 1200, heightPx: 1800 },
  authorityPackage: pkg,
  backendSessionAuthority: { target: { targetId: "gunfun_22740_vital_dude" }, missionIdentity: { missionFamily: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult" } },
  matrixSnapshot: { target_profile_id: "gunfun_22740_vital_dude", mission_family: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult" }
};
const adapter = context.window.SCZN3GunFunVitalDudeSEC;
const dispatch = context.window.SCZN3SECDispatch.resolve(session);
assert.equal(dispatch.adapter, context.window.SCZN3SECDispatch.ADAPTERS.GUNFUN_VITAL_DUDE);
assert.equal(adapter.matches(pkg), true);
assert.equal(adapter.impactCount(pkg), 2);
assert.deepEqual(JSON.parse(JSON.stringify(adapter.aimPoint(pkg))), { xNorm: .5, yNorm: .5 });
assert.equal(adapter.secAdapterViewModel(session).scoringPresentationFamily, "evidence-only");
const html = adapter.render({ session, package: pkg, mode: "live" });
assert.match(html, /Evidence Recorded/);
assert.match(html, />2<\/strong><small>shot observations/);
assert.match(html, /Shooter-declared aim point preserved/);
assert.match(html, /2 of 2 observations reconciled/);
assert.match(html, /Scoring<\/dt><dd>Not applicable/);
assert.match(html, /Canonical regions<\/dt><dd>Unavailable/);
assert.match(html, /Anatomical, medical, or tactical meaning<\/dt><dd>Unavailable/);
assert.match(html, /data-scoring-presentation-family="evidence-only"/);
assert.match(html, /data-sec-adapter-id="gunfun-vital-dude-evidence"/);
assert.doesNotMatch(html, /points|pass|fail|penalty|correction vector|group size|zone performance/i);

const evidence = adapter.vaultEvidenceModel(session, pkg);
assert.equal(evidence.markers.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(evidence.aimPoint)), { xPercent: 50, yPercent: 50, label: "Aim" });
assert.deepEqual(JSON.parse(JSON.stringify(adapter.vaultResultSummary(pkg))), {
  status: "unavailable", primaryLabel: "EVIDENCE RECORDED", objectiveLabel: "No score applies", evidenceLabel: "2 shot observations"
});
const reopened = adapter.render({ session: { ...session, savedToSEC: true }, package: pkg, mode: "historical", preserved: true });
assert.match(reopened, /Shooter-declared aim point preserved/);
assert.match(reopened, /Back to Vault/);

const wrong = structuredClone(pkg); wrong.target.smartTargetId = "BAKER_SL_ST1";
assert.equal(adapter.matches(wrong), false);
const invented = structuredClone(pkg); invented.scoring = { status: "complete", total: 10 };
assert.equal(adapter.matches(invented), false);
const badAim = structuredClone(pkg); badAim.shooterDeclaredAimPoint.authorityScope = "target_geometry";
assert.match(adapter.render({ session: { ...session, authorityPackage: badAim }, package: badAim }), /Results unavailable/);

const [targetHtml, targetJs, records, buildSite, buildNetlify] = await Promise.all([
  readFile(new URL("t/gunfun/vital-dude/index.html", root), "utf8"),
  readFile(new URL("t/gunfun/vital-dude/target-page.js", root), "utf8"),
  readFile(new URL("records.html", root), "utf8"),
  readFile(new URL("production/build-site.mjs", root), "utf8"),
  readFile(new URL("production/build-netlify.mjs", root), "utf8")
]);
assert.match(targetHtml, /id="startExperience"/);
assert.match(targetHtml, /id="markAim"/);
assert.match(targetHtml, /Show Evidence Result/);
assert.match(targetJs, /shooterDeclaredAimPoint: state\.aimPoint/);
assert.match(targetJs, /SCZN3GunFunVitalDudeSEC\.matches/);
assert.match(targetJs, /api\/target\/gunfun\/vital-dude\/analyze/);
assert.match(records, /gunfun_vital_dude_sec\.js/);
assert.match(records, /ADAPTERS\.GUNFUN_VITAL_DUDE/);
for (const build of [buildSite, buildNetlify]) {
  assert.match(build, /t\/gunfun\/vital-dude\/index\.html/);
  assert.match(build, /gunfun_vital_dude_sec\.js/);
  assert.match(build, /E56-T08_SKU-22740\.jpg/);
}

console.log("PASS GunFun Vital Dude SEC, dispatch, target-page, preservation/reopen, and build contracts");
