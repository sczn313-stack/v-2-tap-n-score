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

const release = window.SCZN3PlatformContracts.directionalAuthorityRelease;
const exactLegacy = {
  correction: { windageDirection: "RIGHT", elevationDirection: "UP" },
  clicks: { windageClicks: 4, elevationClicks: 4 },
  renderCoordinates: { vector: { start: { xPercent: 44, yPercent: 56 }, end: { xPercent: 50, yPercent: 50 } } },
  targetImageRegistrationEvidence: { registrationMethod: "exact_canonical_representation" }
};
assert.equal(release(exactLegacy).releasable, true, "exact canonical historical authority remains readable");

const unprovenEstimated = structuredClone(exactLegacy);
unprovenEstimated.targetImageRegistrationEvidence = {
  registrationMethod: "ugo_sift_homography_v1",
  orientationEvidence: { status: "unverified" }
};
assert.deepEqual(
  { ...release(unprovenEstimated) },
  { releasable: false, status: "withheld", reason: "target_orientation_unverified" },
  "an estimated result without proven orientation cannot reach presentation or preservation"
);

const unreconciledEstimated = structuredClone(unprovenEstimated);
unreconciledEstimated.targetImageRegistrationEvidence.orientationEvidence.status = "proven";
unreconciledEstimated.directionalReconciliation = { status: "mismatch" };
assert.equal(release(unreconciledEstimated).reason, "source_direction_reconciliation_failed");

const reconciledEstimated = structuredClone(unreconciledEstimated);
reconciledEstimated.directionalReconciliation = { status: "reconciled" };
reconciledEstimated.authorityAuditEnvelope = { releaseStatus: "released" };
assert.equal(release(reconciledEstimated).releasable, true, "proven orientation plus independent reconciliation releases the correction");

const staleFounderPackage = structuredClone(unprovenEstimated);
staleFounderPackage.authorityAuditEnvelope = {
  calculatedCorrection: { windageDirection: "LEFT", elevationDirection: "DOWN" },
  releaseStatus: "withheld"
};
staleFounderPackage.correction = null;
staleFounderPackage.clicks = null;
staleFounderPackage.renderCoordinates.vector = null;
assert.equal(release(staleFounderPackage).releasable, false, "withheld calculated data cannot be republished from the audit envelope");

const [shootSource, secSource, frameworkSource, recordsSource] = await Promise.all([
  readFile("shoot.html", "utf8"),
  readFile("sec.html", "utf8"),
  readFile("sec_framework.js", "utf8"),
  readFile("records.html", "utf8")
]);
assert.match(shootSource, /directionalAuthorityRelease\(backendAuthorityPackage\)/, "live results and SEC save use the shared release gate");
assert.match(shootSource, /directionalAuthorityRelease\(authorityPackage\)/, "click and vector accessors use the shared release gate");
assert.match(shootSource, /platform_contracts\.js\?v=episode60-directional-authority-rivet-1/, "the live shooter loads the cache-busted release contract");
assert.match(secSource, /directionalAuthorityRelease\(authorityPackage\)/, "SEC click presentation uses the shared release gate");
assert.match(secSource, /directionalAuthorityRelease\(authority\)\.releasable/, "SEC preservation refuses an unreconciled directional package");
assert.match(secSource, /sec_framework\.js\?v=episode60-directional-authority-rivet-1/, "SEC loads the cache-busted guarded presentation framework");
assert.match(frameworkSource, /directionalRelease\.releasable \? vector\(render\.vector\) : ""/, "SEC evidence vector uses the shared release gate");
assert.match(recordsSource, /directionalAuthorityRelease\(pkg\)\.releasable/, "Ballistic Vault vector uses the shared release gate");

console.log("PASS directional authority release guard withholds unproven or unreconciled photo results from live display, SEC, and Vault");
