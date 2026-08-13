import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const secSource = await readFile(new URL("sec_v1.js", root), "utf8");
const dispatchSource = await readFile(new URL("sec_dispatch.js", root), "utf8");
const adapterSource = await readFile(new URL("baker_sl_st1_sec.js", root), "utf8");
const targetHtml = await readFile(new URL("t/baker/sl-st1/index.html", root), "utf8");
const targetJs = await readFile(new URL("t/baker/sl-st1/target-page.js", root), "utf8");
const records = await readFile(new URL("records.html", root), "utf8");
const runtime = await readFile(new URL("m4_runtime.js", root), "utf8");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(secSource, context);
vm.runInContext(dispatchSource, context);
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
assert.equal(context.window.SCZN3SECDispatch.resolve(session).adapter, context.window.SCZN3SECDispatch.ADAPTERS.BAKER_SL_ST1);
assert.deepEqual(Array.from(adapter.missingOptionalDetails(session), item => item.key), ["firearm", "ammunition", "distance", "shooter"]);
const html = adapter.render({ session, package: pkg, mode: "live" });
assert.match(html, /2 Impacts/);
assert.match(html, /Add firearm, ammunition, distance and shooter/);
assert.doesNotMatch(html, /Not recorded|founder_verification_pending|UGO|ATP|numeric score|SIGHT CORRECTION/i);
assert.doesNotMatch(html, /<span>Firearm<\/span>|<span>Ammunition<\/span>|<span>Distance<\/span>|<span>Shooter<\/span>/);
const dismissed = adapter.render({ session, package: pkg, mode: "live", detailsDismissed: true });
assert.doesNotMatch(dismissed, /data-baker-details-invitation/);
const historical = adapter.render({ session, package: pkg, mode: "historical" });
assert.doesNotMatch(historical, /Add Details|Not Now/);

assert.match(targetHtml, /baker_sl_st1_sec\.js/);
assert.match(targetHtml, /sec_dispatch\.js/);
assert.match(targetHtml, /id="continueToSec"/);
assert.match(targetJs, /authorityRequest\("prepare"/);
assert.match(targetJs, /authorityRequest\("start"/);
assert.match(targetJs, /createAuthoritativeSession/);
assert.match(targetJs, /saveTargetEvidenceImage/);
assert.match(targetJs, /authorityPackage: state\.result/);
assert.doesNotMatch(targetJs, /createSession\(/);
assert.match(records, /SCZN3BakerSLST1SEC\.render/);
assert.match(records, /ADAPTERS\.BAKER_SL_ST1/);
assert.match(runtime, /ADAPTERS\.BAKER_SL_ST1/);

console.log("PASS Baker SL-ST1 Phase 5 Universal SEC contract");
