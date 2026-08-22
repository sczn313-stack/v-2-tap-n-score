import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const platformSource = await readFile("platform_contracts.js", "utf8");
const adapterSource = await readFile("sec_adapter_model.js", "utf8");
const recordsSource = await readFile("records.html", "utf8");
const context = { window: {} };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(platformSource, context, { filename: "platform_contracts.js" });
vm.runInContext(adapterSource, context, { filename: "sec_adapter_model.js" });

const hitClassifications = [
  { shot: 1, zone: "plusOne", xPx: 560, yPx: 680 },
  { shot: 2, zone: "plusThree", xPx: 600, yPx: 710 },
  { shot: 3, zone: "plusThree", xPx: 620, yPx: 730 }
];
const renderHits = [
  { shotId: 1, xPercent: 40, yPercent: 42 },
  { shotId: 2, xPercent: 45, yPercent: 47 },
  { shotId: 3, xPercent: 50, yPercent: 52 }
];
const pkg = {
  ok: true,
  resultPackageType: "gssfPaperPenaltyResult",
  authoritySource: "backend-authoritative",
  target_profile_id: "gssf_ac_1",
  targetProfileVersion: "1",
  evidenceHash: "gssf-evidence-hash-unchanged",
  totalPaperPenaltySeconds: 7,
  rawTimeSeconds: 7,
  finalTimeSeconds: 14,
  hitClassifications,
  renderCoordinates: { hits: renderHits }
};
const session = {
  sessionId: "item4c-gssf-session",
  sessionLabel: "Session #302",
  targetProfileId: "gssf_ac_1",
  targetProfileVersion: "1",
  targetEvidenceImage: { dataUrl: "data:image/png;base64,Z3NzZi1ldmlkZW5jZQ==", sha256: "gssf-photo-hash-unchanged" },
  authorityPackage: pkg
};

const mapped = context.window.SCZN3TargetAdapters.createViewModel("gssf", { session });
assert.equal(mapped.ok, true, mapped.errors.join(","));
assert.equal(mapped.value.result.package, pkg, "the backend result package remains the exact adapter input");
assert.equal(mapped.value.session, session, "the authoritative session remains the exact adapter input");
assert.equal(mapped.value.scoringPresentationFamily, "lowest-score-wins");
assert.deepEqual(Array.from(mapped.value.semanticComponents, component => component.stage), ["evidence", "measurement", "execution", "validation", "preservation"]);
assert.equal(mapped.value.targetProfileIdentity.targetProfileLabel, "GSSF Practice");
assert.equal(mapped.value.targetProfileIdentity.missionLabel, "");
assert.equal(mapped.value.publisherIdentity.publisherId, "gssf");
assert.equal(mapped.value.productIdentity.productId, "gssf_ac_1");
assert.equal(session.authorityPackage.evidenceHash, "gssf-evidence-hash-unchanged");
assert.equal(session.targetEvidenceImage.sha256, "gssf-photo-hash-unchanged");
assert.deepEqual(session.authorityPackage.hitClassifications, hitClassifications);
assert.deepEqual(session.authorityPackage.renderCoordinates.hits, renderHits);

assert.match(recordsSource, /const SCZN3GSSFSEC = \(\(\) => \{/);
assert.match(recordsSource, /SEC_ADAPTER_ID = "gssf"/);
assert.match(recordsSource, /registry\.createViewModel\(SEC_ADAPTER_ID, \{ session \}\)/);
assert.match(recordsSource, /return SCZN3SEC\.render\(\{/);
assert.match(recordsSource, /data-sec-adapter-id/);
assert.match(recordsSource, /data-scoring-presentation-family/);
assert.match(recordsSource, /data-target-profile-id/);
assert.match(recordsSource, /data-publisher-id/);
assert.match(recordsSource, /data-product-id/);
assert.match(recordsSource, /SCZN3GSSFSEC\.render\(session\)/);
assert.doesNotMatch(recordsSource, /function renderGssfM4ReferenceSec\(/, "the standalone GSSF SEC path is retired");

console.log("PASS Episode 54 Item 4C GSSF SEC adapter mapping preserves authority, identity, evidence, and shared-shell ownership");
