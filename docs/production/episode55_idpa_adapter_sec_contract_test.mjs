import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const names = ["platform_contracts.js", "sec_adapter_model.js", "sec_dispatch.js", "sec_v1.js", "sec_framework.js", "baker_sl_st2_idpa_sec.js"];
const context = { window: {} }; context.window.window = context.window; context.window.location = { hostname: "127.0.0.1" }; vm.createContext(context);
for (const name of names) vm.runInContext(await readFile(name, "utf8"), context, { filename: name });

const pkg = {
  ok: true, status: "supported_analysis_ready", authoritySource: "backend-authoritative",
  missionFamily: "idpaTimedPractice", resultPackageType: "idpaTimeScoreResult",
  targetProfileId: "idpa_silhouette_sl_st2", targetProfileVersion: "1",
  target: { targetProfileId: "idpa_silhouette_sl_st2", targetProfileVersion: "1", smartTargetId: "BAKER_SL_ST2", variantId: "BAKER_SL_ST2_23X35_STANDARD_WHITE" },
  imageEvidence: { sha256: "photo-sha", backendHashVerified: true, targetIdentityVerifiedFromImage: true },
  impacts: [
    { impactId: "impact-001", sourceEvidencePoint: { xNorm: .3, yNorm: .4 }, canonicalPointInches: { x: 7, y: 12 }, classification: "down_one", pointsDown: 1 },
    { impactId: "impact-002", sourceEvidencePoint: { xNorm: .5, yNorm: .5 }, canonicalPointInches: { x: 11, y: 17 }, classification: "down_zero", pointsDown: 0 },
    { impactId: "impact-003", sourceEvidencePoint: { xNorm: .7, yNorm: .6 }, canonicalPointInches: { x: 16, y: 21 }, classification: "down_three", pointsDown: 3 }
  ],
  scoredSelection: { mode: "unlimited_best_hits", requiredImpactCount: 2, selectedImpactIds: ["impact-002", "impact-001"], excludedImpactIds: ["impact-003"], selectedClassifications: { down_zero: 1, down_one: 1, down_three: 0, outside: 0 } },
  scoring: { status: "complete", objective: "lowest_time_wins", reportedRawTime: "8.50", pointsDown: 1, pointsDownTime: "1.00", finalTime: "9.50", breakdown: [
    { classification: "down_zero", label: "0 down", count: 1, pointsDownValue: 0, pointsDownSubtotal: "0", timeSubtotal: "0.00" },
    { classification: "down_one", label: "-1", count: 1, pointsDownValue: 1, pointsDownSubtotal: "1", timeSubtotal: "1.00" },
    { classification: "down_three", label: "-3", count: 0, pointsDownValue: 3, pointsDownSubtotal: "0", timeSubtotal: "0.00" },
    { classification: "outside", label: "Outside", count: 0, pointsDownValue: 5, pointsDownSubtotal: "0", timeSubtotal: "0.00" }
  ] },
  reconciliation: { capturedImpactCount: 3, selectedImpactCount: 2, excludedImpactCount: 1, requiredImpactCount: 2, selectionReconciles: true, timeReconciles: true },
  authorityTrace: { classificationAuthority: "backend", calculationAuthority: "backend", ugoAuthorityId: "UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1", missionAuthorityId: "SCZN3_SL_ST2_TIMED_PAIR_7YD_V1", rulesAuthorityId: "IDPA_RULEBOOK_2026_2" }
};
const session = { sessionId: "episode55-idpa-review", sessionIdAuthority: "backend", sessionLabel: "Session #001", targetProfileId: "idpa_silhouette_sl_st2", targetProfileVersion: "1", createdAt: "2026-08-17T17:00:00-04:00", savedToSEC: true, targetEvidenceImage: { dataUrl: "data:image/jpeg;base64,AA==", sha256: "photo-sha" }, authorityPackage: pkg };
const renderer = context.window.SCZN3BakerSLST2IDPASEC;
const mapped = renderer.secAdapterViewModel(session);
assert.ok(mapped);
assert.equal(mapped.adapterId, "baker-sl-st2-idpa");
assert.equal(mapped.result.package, pkg, "adapter maps rather than recalculates authority");
assert.equal(mapped.scoringPresentationFamily, "lowest-score-wins");
assert.deepEqual(Array.from(mapped.semanticComponents, component => component.stage), ["evidence", "measurement", "execution", "validation", "preservation"]);
assert.equal(context.window.SCZN3SECDispatch.resolve(session).adapter, "baker-sl-st2-idpa");
assert.match(await readFile("m4_runtime.js", "utf8"), /supportedIdpaResult[\s\S]*BAKER_SL_ST2_IDPA[\s\S]*idpaTimeScoreResult/);
context.window.SCZN3M4 = {
  KEYS: { activeSession: "active" },
  read() { return session; },
  replaceSession(value) { return value; }
};
vm.runInContext(await readFile("m4_runtime.js", "utf8"), context, { filename: "m4_runtime.js" });
const preserved = context.window.SCZN3M4.preserveActiveSEC("", session);
assert.equal(preserved.savedToSEC, true, "registered backend IDPA result enters the shared preservation contract");
assert.equal(preserved.authorityPackage, pkg, "preservation does not rewrite authoritative result");

const html = renderer.render({ session, package: pkg, mode: "historical", preserved: true });
assert.match(html, /data-sec-shell="universal-v1"/);
assert.match(html, /data-sec-adapter-id="baker-sl-st2-idpa"/);
assert.match(html, /Silhouette Target \(IDPA\) • Timed Pair — 7 Yards/);
assert.match(html, /<span>Final Time<\/span><strong>9\.50<small>s<\/small><\/strong><b>Lowest time wins<\/b>/);
assert.match(html, /Reported Raw Time <strong>8\.50s<\/strong>/);
assert.match(html, /Points-Down Time <strong>1\.00s<\/strong>/);
assert.match(html, /1 × 1s<\/strong><b>1\.00s/);
assert.equal((html.match(/class="sec-target-impact-marker"/g) || []).length, 3);
assert.doesNotMatch(html, /official/i);

const vault = renderer.vaultResultSummary(pkg);
assert.equal(vault.primaryValue, "9.50");
assert.equal(vault.primaryUnit, "SECONDS");
assert.equal(vault.objectiveLabel, "LOWEST TIME WINS");
assert.equal(renderer.vaultEvidenceModel(session, pkg).markers.length, 3);
const idpaLowestScoreModel = renderer.vaultLowestScoreWinsModel(pkg);
const idpaLowestScorePanel = context.window.SCZN3SECComponents.LowestScoreWinsPanel(idpaLowestScoreModel);
assert.match(idpaLowestScorePanel, /data-lowest-score-wins-presentation="platform-v1"/);
assert.match(idpaLowestScorePanel, /<b>Raw Time<\/b><strong>8\.50s<\/strong>/, "shared presenter preserves readable raw-time spacing");
assert.match(idpaLowestScorePanel, /<b>Points Down<\/b><strong>\+1\.00s<\/strong>/, "shared presenter preserves readable points-down spacing");

const recordsSource = await readFile("records.html", "utf8");
assert.match(recordsSource, /SCZN3SECComponents\.LowestScoreWinsPanel\(lowestScoreModel \|\| \{\}\)/, "Vault delegates lowest-score-wins presentation to one shared owner");
assert.match(recordsSource, /dispatch\.adapter === SCZN3SECDispatch\.ADAPTERS\.GSSF[\s\S]*gssfLowestScoreWinsVaultModel\(pkg\)/, "GSSF supplies data to the shared lowest-score-wins presenter");
assert.match(recordsSource, /dispatch\.adapter === SCZN3SECDispatch\.ADAPTERS\.BAKER_SL_ST2_IDPA[\s\S]*vaultLowestScoreWinsModel\(pkg\)/, "IDPA supplies data to the same shared lowest-score-wins presenter");
assert.match(recordsSource, /\$\{lowestScoreTarget \? "TARGET EVIDENCE" : "BEFORE"\}/, "completed lowest-score-wins evidence is never labeled BEFORE");
assert.doesNotMatch(recordsSource, /isGssfAuthorityPackage\(pkg\)\s*\?\s*vaultScoringPanel/, "GSSF no longer bypasses shared presentation ownership");

const targetPage = await readFile("t/baker/sl-st2/index.html", "utf8");
const workflow = await readFile("t/baker/sl-st2/target-page.js", "utf8");
const idpaSecSource = await readFile("baker_sl_st2_idpa_sec.js", "utf8");
const secFrameworkCss = await readFile("sec-framework.css", "utf8");
assert.match(targetPage, /data-sczn3-workspace="platform-v1"/);
assert.match(targetPage, /smart_target_workspace\.js/);
assert.doesNotMatch(targetPage, /sl-st1\/target-page\.css|baker-sl-st1-sec\.css/, "IDPA does not borrow workspace or SEC presentation from another target");
assert.match(workflow, /SCZN3SmartTargetWorkspace\.create/);
assert.match(workflow, /SCZN3Actions\.begin/);
assert.doesNotMatch(workflow, /pointsDown\s*[+*=]|finalTime\s*=/, "frontend does not calculate points or final time");
assert.match(idpaSecSource, /sec-evidence-result-layout/);
assert.match(idpaSecSource, /sec-target-evidence-frame/);
assert.doesNotMatch(idpaSecSource, /sec-baker-(?:performance-stage|target-evidence|evidence|impact)/, "IDPA consumes neutral SEC Framework presentation classes");
assert.match(secFrameworkCss, /\.sec-evidence-result-layout\{/);
assert.match(secFrameworkCss, /\.sec-target-evidence-frame\{/);
assert.match(secFrameworkCss, /\.sec-target-impact-marker\{/);
assert.doesNotMatch(idpaSecSource, /quantity\s*\*|raw\s*\+|pointsDownTime\s*\+/, "SEC renders backend breakdown without scoring arithmetic");

console.log("PASS Episode 55 IDPA adapter, inherited SEC, evidence, result, Vault, and frontend-authority boundary");
