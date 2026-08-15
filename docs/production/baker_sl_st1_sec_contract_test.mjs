import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const secSource = await readFile(new URL("sec_v1.js", root), "utf8");
const timelineSource = await readFile(new URL("sec_session_timeline.js", root), "utf8");
const dispatchSource = await readFile(new URL("sec_dispatch.js", root), "utf8");
const adapterSource = await readFile(new URL("baker_sl_st1_sec.js", root), "utf8");
const adapterCss = await readFile(new URL("baker-sl-st1-sec.css", root), "utf8");
const universalSecCss = await readFile(new URL("sec-universal.css", root), "utf8");
const targetHtml = await readFile(new URL("t/baker/sl-st1/index.html", root), "utf8");
const targetJs = await readFile(new URL("t/baker/sl-st1/target-page.js", root), "utf8");
const records = await readFile(new URL("records.html", root), "utf8");
const runtime = await readFile(new URL("m4_runtime.js", root), "utf8");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(secSource, context);
vm.runInContext(dispatchSource, context);
vm.runInContext(timelineSource, context);
vm.runInContext(adapterSource, context);
const adapter = context.window.SCZN3BakerSLST1SEC;
const pkg = {
  ok: true,
  status: "supported_analysis_ready",
  resultPackageType: "smartEvidenceResult",
  missionFamily: "smartEvidenceCapture",
  target: { smartTargetId: "BAKER_SL_ST1", variantId: "BAKER_SL_ST1_23X35_STANDARD_WHITE" },
  supportedAnalysis: { impactCount: 2 },
  impacts: [{ impactId: "impact-001", xNorm: .2, yNorm: .3 }, { impactId: "impact-002", xNorm: .6, yNorm: .7 }],
  scoring: { status: "unavailable" }
};
const session = {
  sessionId: "session-test",
  sessionLabel: "Session #001",
  createdAt: "2026-08-11T12:00:00Z",
  targetEvidenceImage: { dataUrl: "data:image/png;base64,AA==" },
  authorityPackage: pkg,
  backendSessionAuthority: {
    target: { targetId: "BAKER_SL_ST1" },
    missionIdentity: { missionFamily: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult" }
  },
  matrixSnapshot: { target_profile_id: "BAKER_SL_ST1", mission_family: "smartEvidenceCapture", resultPackageType: "smartEvidenceResult" }
};

assert.equal(adapter.matches(pkg), true);
assert.equal(adapter.impactCount(pkg), 2);
const vaultEvidence = adapter.vaultEvidenceModel(session, pkg);
assert.equal(vaultEvidence.status, "complete");
assert.equal(vaultEvidence.markers.length, 2);
assert.deepEqual(vaultEvidence.markers.map(marker => marker.label), ["1", "2"]);
assert.deepEqual(vaultEvidence.markers.map(marker => [marker.xPercent, marker.yPercent]), pkg.impacts.map(impact => [impact.xNorm * 100, impact.yNorm * 100]));
const registeredPhotoPackage = structuredClone(pkg);
registeredPhotoPackage.impacts[0].sourceEvidencePoint = { xNorm: .31, yNorm: .41 };
const registeredPhotoEvidence = adapter.vaultEvidenceModel(session, registeredPhotoPackage);
assert.deepEqual([registeredPhotoEvidence.markers[0].xPercent, registeredPhotoEvidence.markers[0].yPercent], [31, 41]);
const invalidVaultPackage = structuredClone(pkg);
invalidVaultPackage.impacts[0].xNorm = 1.2;
assert.equal(adapter.vaultEvidenceModel(session, invalidVaultPackage), null);
assert.equal(context.window.SCZN3SECDispatch.resolve(session).adapter, context.window.SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST1);
assert.deepEqual(Array.from(adapter.missingOptionalDetails(session), item => item.key), ["firearm", "ammunition", "distance", "shooter"]);
const html = adapter.render({ session, package: pkg, mode: "live" });
assert.match(html, /2 Bullet Holes/);
assert.match(html, /left:20%;top:30%[^>]*>1<\/span>/);
assert.match(html, /left:60%;top:70%[^>]*>2<\/span>/);
assert.match(html, /Add firearm, ammunition, distance and shooter/);
assert.doesNotMatch(html, /Not recorded|founder_verification_pending|UGO|ATP|numeric score|SIGHT CORRECTION/i);
assert.doesNotMatch(html, /<span>Firearm<\/span>|<span>Ammunition<\/span>|<span>Distance<\/span>|<span>Shooter<\/span>/);
const dismissed = adapter.render({ session, package: pkg, mode: "live", detailsDismissed: true });
assert.doesNotMatch(dismissed, /data-baker-details-invitation/);
const historical = adapter.render({ session, package: pkg, mode: "historical" });
assert.doesNotMatch(historical, /Add Details|Not Now/);

const scored = structuredClone(pkg);
scored.supportedAnalysis.impactCount = 4;
scored.impacts = [
  { impactId: "impact-001", xNorm: .5, yNorm: .15, zone: "A", zoneValue: 10 },
  { impactId: "impact-002", xNorm: .5, yNorm: .22, zone: "B", zoneValue: 9 },
  { impactId: "impact-003", xNorm: .3, yNorm: .47, zone: "C", zoneValue: 8 },
  { impactId: "impact-004", xNorm: .19, yNorm: .47, zone: "D", zoneValue: 7 }
];
scored.productRegionDistribution = {
  status: "complete",
  zoneCounts: { A: 1, B: 1, C: 1, D: 1, outside: 0, indeterminate_boundary: 0 },
  classifiedImpactCount: 4,
  capturedImpactCount: 4,
  reconciliation: { classifiedImpactCount: 4, unresolvedImpactCount: 0, capturedImpactCount: 4, countsMatchCapturedImpactCount: true }
};
scored.scoring = {
  status: "complete",
  objective: "highest_score_wins",
  zoneValues: { A: 10, B: 9, C: 8, D: 7 },
  subtotals: { A: 10, B: 9, C: 8, D: 7 },
  total: 34
};
scored.authorityTrace = {
  classificationAuthority: "backend",
  geometryAuthorityId: "UGO_BAKER_SL_ST1_23X35_V1",
  coordinateSystemId: "UGO_IMAGE_PLANE_TOP_LEFT_V1",
  scoringAuthorityId: "BAKER_SL_ST1_SCORING_V1"
};
assert.equal(adapter.scoringSummary(scored).total, 34);
assert.deepEqual(JSON.parse(JSON.stringify(adapter.vaultResultSummary(scored))), {
  status: "complete",
  primaryValue: "34",
  primaryUnit: "POINTS",
  objectiveLabel: "HIGHEST SCORE WINS",
  breakdown: [
    { label: "A", value: "1" },
    { label: "B", value: "1" },
    { label: "C", value: "1" },
    { label: "D", value: "1" }
  ],
  evidenceLabel: "4 bullet holes"
});
const scoredHtml = adapter.render({ session, package: scored, mode: "live" });
assert.match(scoredHtml, /34 Points/);
assert.match(scoredHtml, /aria-label="A: 1 times 10 equals 10"/);
assert.match(scoredHtml, /aria-label="B: 1 times 9 equals 9"/);
assert.match(scoredHtml, /aria-label="C: 1 times 8 equals 8"/);
assert.match(scoredHtml, /aria-label="D: 1 times 7 equals 7"/);
assert.match(scoredHtml, /Highest score wins/);
assert.match(scoredHtml, /<span>Total Score<\/span><strong>34<\/strong><small>Highest score wins<\/small>/);
assert.match(scoredHtml, /Zone Performance/);
assert.match(scoredHtml, /4<\/strong> numbered bullet holes <span aria-hidden="true">•<\/span> all accounted for/);
assert.match(scoredHtml, /sec-baker-performance-stage/);
assert.match(scoredHtml, /Target Evidence/);
assert.doesNotMatch(scoredHtml, /authoritative|backend|canonical|governed|result package/i);
assert.doesNotMatch(scoredHtml, /Recorded Bullet Holes/i);

const preservedSessions = [1, 2, 3].map(index => ({
  ...session,
  sessionId: `preserved-${index}`,
  sessionIdAuthority: "backend",
  savedToSEC: true,
  authorityPackage: structuredClone(scored)
}));
const preservedPayload = {
  ok: true,
  sessions: preservedSessions,
  artifacts: preservedSessions.map((item, index) => ({
    sessionId: item.sessionId,
    artifactSha256: `artifact-${index + 1}`,
    preservedAt: `2026-08-${String(index + 1).padStart(2, "0")}T12:00:00Z`
  }))
};
const timelineRecords = context.window.SCZN3SECSessionTimeline.preservedRecords(preservedPayload);
const timelineModel = adapter.sessionTimelineModel(timelineRecords, "preserved-3");
assert.deepEqual(Array.from(timelineModel.points, point => [point.sessionId, point.value]), [["preserved-1", 34], ["preserved-2", 34], ["preserved-3", 34]]);
assert.equal(timelineModel.points[2].current, true);
const timelineHtml = adapter.render({ session: preservedSessions[2], package: scored, mode: "historical", timelineRecords });
assert.match(timelineHtml, /Last 10 Scores/);
assert.match(timelineHtml, /records\.html\?session=preserved-1&amp;view=sec/);
assert.equal((timelineHtml.match(/class="sec-session-timeline-point/g) || []).length, 3);
const wrongVersion = structuredClone(preservedSessions[0]);
wrongVersion.sessionId = "wrong-version";
wrongVersion.authorityPackage.target.variantId = "BAKER_SL_ST1_OTHER";
const wrongVersionRecords = context.window.SCZN3SECSessionTimeline.preservedRecords({
  ok: true,
  sessions: [wrongVersion],
  artifacts: [{ sessionId: "wrong-version", artifactSha256: "artifact-wrong", preservedAt: "2026-08-04T12:00:00Z" }]
});
assert.equal(adapter.sessionTimelineModel(wrongVersionRecords).points.length, 0, "timeline isolates authoritative target identity and version");
const clientClaimOnly = structuredClone(preservedSessions[0]);
clientClaimOnly.sessionId = "client-claim";
clientClaimOnly.authorityPackage.scoring = { total: 999, status: "complete" };
const clientClaimRecords = context.window.SCZN3SECSessionTimeline.preservedRecords({
  ok: true,
  sessions: [clientClaimOnly],
  artifacts: [{ sessionId: "client-claim", artifactSha256: "artifact-client", preservedAt: "2026-08-05T12:00:00Z" }]
});
assert.equal(adapter.sessionTimelineModel(clientClaimRecords).points.length, 0, "timeline ignores invalid or client-only score claims");

const inconsistent = structuredClone(scored);
inconsistent.scoring.total = 99;
assert.equal(adapter.scoringSummary(inconsistent), null);
assert.deepEqual(JSON.parse(JSON.stringify(adapter.vaultResultSummary(inconsistent))), {
  status: "unavailable",
  primaryLabel: "SCORE UNAVAILABLE",
  objectiveLabel: "Open SEC for details",
  evidenceLabel: "4 bullet holes"
});
assert.doesNotMatch(adapter.render({ session, package: inconsistent, mode: "live" }), /99 Points|<span>Total Score<\/span>/);

const firstScoreboard = structuredClone(scored);
const scoreboardZones = ["A", "A", "A", "A", "A", "A", "C", "C", "C", "C", "C", "C", "C", "C", "C", "D", "D", "D", "D", "D", "D"];
firstScoreboard.supportedAnalysis.impactCount = scoreboardZones.length;
firstScoreboard.impacts = scoreboardZones.map((zone, index) => ({
  impactId: `scoreboard-${String(index + 1).padStart(2, "0")}`,
  xNorm: .2 + ((index % 5) * .1),
  yNorm: .2 + (Math.floor(index / 5) * .1),
  zone,
  zoneValue: { A: 10, B: 9, C: 8, D: 7 }[zone]
}));
firstScoreboard.productRegionDistribution = {
  status: "complete",
  zoneCounts: { A: 6, B: 0, C: 9, D: 6, outside: 0, indeterminate_boundary: 0 },
  classifiedImpactCount: 21,
  capturedImpactCount: 21,
  reconciliation: { classifiedImpactCount: 21, unresolvedImpactCount: 0, capturedImpactCount: 21, countsMatchCapturedImpactCount: true }
};
firstScoreboard.scoring = {
  status: "complete",
  objective: "highest_score_wins",
  zoneValues: { A: 10, B: 9, C: 8, D: 7 },
  subtotals: { A: 60, B: 0, C: 72, D: 42 },
  total: 174
};
const firstScoreboardHtml = adapter.render({ session, package: firstScoreboard, mode: "live" });
assert.match(firstScoreboardHtml, /<span>Total Score<\/span><strong>174<\/strong><small>Highest score wins<\/small>/);
assert.match(firstScoreboardHtml, /aria-label="A: 6 times 10 equals 60"/);
assert.match(firstScoreboardHtml, /aria-label="B: 0 times 9 equals 0"/);
assert.match(firstScoreboardHtml, /aria-label="C: 9 times 8 equals 72"/);
assert.match(firstScoreboardHtml, /aria-label="D: 6 times 7 equals 42"/);
assert.match(firstScoreboardHtml, /<strong>21<\/strong> numbered bullet holes/);
assert.equal((firstScoreboardHtml.match(/class="sec-baker-impact-marker"/g) || []).length, 21);
assert.doesNotMatch(firstScoreboardHtml, /Recorded Bullet Holes|trend|comparison|improvement recommendation|shooting DNA/i);

assert.match(adapterCss, /\.sec-baker-performance-stage\{[^}]*grid-template-columns:minmax\(0,1\.65fr\) minmax\(260px,\.85fr\)/, "desktop target evidence remains visually dominant beside score");
assert.match(adapterCss, /\.sec-baker-evidence-frame img\{[^}]*object-fit:contain/, "complete target evidence remains contained");
assert.match(universalSecCss, /data-sec-open-region="target"\]\{grid-template-rows:minmax\(0,1fr\) auto auto\}/, "universal shell preserves constrained Target, Session, and action rows");
assert.match(universalSecCss, /\.sec-session-record-fields>div\{[^}]*grid-template-columns:max-content minmax\(0,1fr\)[^}]*column-gap:10px/, "Session labels and values use readable universal spacing");
assert.match(targetJs, /button\.textContent = "SEC Preserved"/, "Save SEC confirms preservation in place");
assert.doesNotMatch(targetJs, /window\.location\.(?:href|assign)[\s\S]{0,160}records\.html/, "Save SEC does not navigate to the Vault");
assert.doesNotMatch(adapterCss, /\.sec-v1-(?:flow|region|target|session|actions)|\.sec-accordion-stage/, "Baker CSS does not control SEC shell geometry");
assert.match(adapterCss, /@media\(max-width:520px\)\{\.sec-baker-performance-stage,[^}]*grid-template-columns:minmax\(0,1fr\);grid-template-rows:auto minmax\(0,1fr\)/, "390px SEC presents score first and complete target evidence next");

assert.match(targetHtml, /baker_sl_st1_sec\.js/);
assert.match(targetHtml, /sec_session_timeline\.js/);
assert.match(targetHtml, /sec_dispatch\.js/);
assert.doesNotMatch(targetHtml, /id="continueToSec"|id="supportedResults"/);
assert.match(targetJs, /async function persistResultAndOpenSec\(processingId\)/);
assert.match(targetJs, /await persistResultAndOpenSec\(processingId\)/);
assert.match(targetJs, /authorityRequest\("prepare"/);
assert.match(targetJs, /authorityRequest\("start"/);
assert.match(targetJs, /createAuthoritativeSession/);
assert.match(targetJs, /saveTargetEvidenceImage/);
assert.match(targetJs, /authorityPackage: state\.result/);
assert.match(targetJs, /body:\s*JSON\.stringify\(\{ session: saved \}\)/, "Save SEC sends the exact preserved artifact to the durable backend store");
assert.match(targetJs, /SCZN3SECSessionTimeline\.preservedRecords\(payload\)/, "live timeline consumes backend preservation records");
assert.match(targetJs, /await renderSec\(preservedSession, \{ refreshTimeline: true \}\)/, "successful preservation refreshes Session 2");
assert.match(targetJs, /state\.preserved = true/);
assert.match(targetJs, /!state\.preserved && Boolean\(state\.imageEvidence \|\| state\.impacts\.length\)/);
assert.doesNotMatch(targetJs, /createSession\(/);
assert.match(records, /SCZN3BakerSLST1SEC\.render/);
assert.match(records, /ADAPTERS\.BAKER_SL_ST1/);
assert.match(records, /function resolveVaultResultSummary/);
assert.match(records, /SCZN3BakerSLST1SEC\.vaultResultSummary\(pkg\)/);
assert.match(records, /aria-label="Saved result"/);
assert.match(records, /aria-label="Score breakdown"/);
assert.match(records, /vault-record-summary--baker-scored/);
assert.match(runtime, /ADAPTERS\.BAKER_SL_ST1/);

console.log("PASS Baker SL-ST1 Phase 5 Universal SEC contract");
