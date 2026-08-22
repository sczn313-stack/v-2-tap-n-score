import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const files = await Promise.all([
  "platform_contracts.js",
  "sec_adapter_model.js",
  "sec_v1.js",
  "sec_framework.js",
  "sec_session_timeline.js",
  "baker_sl_st1_sec.js"
].map(file => readFile(file, "utf8")));
const context = { window: {} };
context.window.window = context.window;
vm.createContext(context);
files.forEach((source, index) => vm.runInContext(source, context, { filename: ["platform_contracts.js", "sec_adapter_model.js", "sec_v1.js", "sec_framework.js", "sec_session_timeline.js", "baker_sl_st1_sec.js"][index] }));

const pkg = {
  ok: true,
  status: "supported_analysis_ready",
  resultPackageType: "smartEvidenceResult",
  missionFamily: "smartEvidenceCapture",
  evidenceHash: "evidence-sha-unchanged",
  target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
  supportedAnalysis: { impactCount: 3 },
  impacts: [
    { impactId: "impact-1", xNorm: .2, yNorm: .3, sourceEvidencePoint: { xNorm: .21, yNorm: .31 }, zone: "A", zoneValue: 10 },
    { impactId: "impact-2", xNorm: .4, yNorm: .5, sourceEvidencePoint: { xNorm: .41, yNorm: .51 }, zone: "B", zoneValue: 9 },
    { impactId: "impact-3", xNorm: .6, yNorm: .7, sourceEvidencePoint: { xNorm: .61, yNorm: .71 }, zone: "C", zoneValue: 8 }
  ],
  productRegionDistribution: {
    status: "complete",
    zoneCounts: { A: 1, B: 1, C: 1, D: 0, outside: 0, indeterminate_boundary: 0 },
    classifiedImpactCount: 3,
    capturedImpactCount: 3,
    reconciliation: { countsMatchCapturedImpactCount: true }
  },
  scoring: {
    status: "complete",
    objective: "highest_score_wins",
    zoneValues: { A: 10, B: 9, C: 8, D: 7 },
    subtotals: { A: 10, B: 9, C: 8, D: 0 },
    total: 27
  },
  authorityTrace: {
    classificationAuthority: "backend",
    geometryAuthorityId: "UGO_BAKER_SL_ST1_23X35_V1",
    coordinateSystemId: "UGO_IMAGE_PLANE_TOP_LEFT_V1",
    scoringAuthorityId: "BAKER_SL_ST1_SCORING_V1"
  }
};
const session = {
  sessionId: "item4a-session",
  sessionLabel: "Session #004",
  targetProfileId: "baker_sl_st1_practice",
  targetProfileVersion: "1",
  savedToSEC: true,
  targetEvidenceImage: { dataUrl: "data:image/png;base64,AA==", sha256: "photo-sha-unchanged" },
  authorityPackage: pkg
};

const renderer = context.window.SCZN3BakerSLST1SEC;
const mapped = renderer.secAdapterViewModel(session, pkg);
assert.ok(mapped, "Baker content mapping consumes the registered SEC adapter");
assert.equal(mapped.adapterId, "baker-sl-st1");
assert.equal(mapped.result.package, pkg, "backend result package is passed by reference without recalculation");
assert.equal(mapped.session, session, "authoritative session is passed by reference without rewriting");
assert.equal(mapped.scoringPresentationFamily, "highest-score-wins");
assert.deepEqual(Array.from(mapped.semanticComponents, component => component.stage), ["evidence", "measurement", "validation", "preservation"]);
assert.equal(mapped.targetProfileIdentity.targetProfileLabel, "USPSA Practice Target");
assert.equal(mapped.publisherIdentity.publisherId, "baker-targets");
assert.equal(mapped.productIdentity.productId, "BAKER_SL_ST1");

const html = renderer.render({ session, package: pkg, mode: "historical" });
assert.match(html, /data-sec-shell="universal-v1"/, "SCZN3SEC owns the outer shell");
assert.match(html, /data-sec-adapter-id="baker-sl-st1"/);
assert.match(html, /data-scoring-presentation-family="highest-score-wins"/);
assert.match(html, /USPSA Practice Target/);
assert.match(html, /<span>Total Score<\/span><strong>27<\/strong><small>Highest score wins<\/small>/);
assert.equal((html.match(/class="sec-target-impact-marker"/g) || []).length, 3);
for (const [index, point] of pkg.impacts.entries()) {
  assert.match(html, new RegExp(`left:${point.sourceEvidencePoint.xNorm * 100}%;top:${point.sourceEvidencePoint.yNorm * 100}%[^>]*>${index + 1}<\\/span>`));
}
assert.equal(session.authorityPackage.scoring.total, 27);
assert.equal(session.authorityPackage.evidenceHash, "evidence-sha-unchanged");
assert.equal(session.targetEvidenceImage.sha256, "photo-sha-unchanged");

const rendererSource = await readFile("baker_sl_st1_sec.js", "utf8");
const targetPage = await readFile("t/baker/sl-st1/index.html", "utf8");
const recordsPage = await readFile("records.html", "utf8");
assert.match(rendererSource, /registry\.createViewModel\(SEC_ADAPTER_ID, \{ session \}\)/);
assert.match(rendererSource, /global\.SCZN3SEC\.render\(/);
assert.doesNotMatch(rendererSource, /global\.SCZN3SECComponents\s*=/, "Baker mapping does not claim shared component ownership");
assert.ok(targetPage.indexOf("sec_adapter_model.js") < targetPage.indexOf("baker_sl_st1_sec.js"), "live SEC loads the adapter registry before Baker mapping");
assert.ok(recordsPage.indexOf("sec_adapter_model.js") < recordsPage.indexOf("baker_sl_st1_sec.js"), "preserved SEC loads the adapter registry before Baker mapping");

console.log("PASS Episode 54 Item 4A SL-ST1 SEC migration preserves authority, identity, evidence, score, and shared-shell ownership");
