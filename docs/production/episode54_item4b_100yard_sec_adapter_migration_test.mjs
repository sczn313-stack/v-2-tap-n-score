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

const pkg = {
  ok: true,
  resultPackageType: "zeroCorrectionResult",
  mission_family: "zeroingCorrection",
  authoritySource: "backend-authoritative",
  evidenceHash: "100-yard-evidence-hash-unchanged",
  target_profile_id: "baker_st_100yd_smart_zero",
  targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
  status: { hasCorrection: true, impactCount: 3 },
  renderCoordinates: {
    impacts: [
      { xPercent: 40, yPercent: 45 },
      { xPercent: 50, yPercent: 55 },
      { xPercent: 60, yPercent: 65 }
    ],
    aim: { xPercent: 50, yPercent: 50 },
    poib: { xPercent: 52, yPercent: 54 }
  },
  correction: { elevation: "4 clicks UP", windage: "2 clicks LEFT" }
};
const session = {
  sessionId: "item4b-100yard-session",
  sessionLabel: "Session #100",
  targetProfileId: "baker_st_100yd_smart_zero",
  targetProfileVersion: "BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL",
  targetEvidenceImage: { dataUrl: "data:image/png;base64,MTAwLXlhcmQ=", sha256: "100-yard-photo-hash-unchanged" },
  authorityPackage: pkg
};

const mapped = context.window.SCZN3TargetAdapters.createViewModel("baker-100yd-zeroing", { session });
assert.equal(mapped.ok, true, mapped.errors.join(","));
assert.equal(mapped.value.result.package, pkg, "the backend result package remains the exact adapter input");
assert.equal(mapped.value.session, session, "the authoritative session remains the exact adapter input");
assert.equal(mapped.value.scoringPresentationFamily, "zeroing-correction");
assert.deepEqual(Array.from(mapped.value.semanticComponents, component => component.stage), ["evidence", "measurement", "recommendation", "execution", "validation", "preservation"]);
assert.equal(mapped.value.targetProfileIdentity.targetProfileLabel, "100 Yard Bullseye");
assert.equal(mapped.value.targetProfileIdentity.missionLabel, "100 Yard Zero");
assert.equal(mapped.value.publisherIdentity.publisherId, "baker-targets");
assert.equal(mapped.value.productIdentity.productId, "ST-100YD-SMART");
assert.equal(session.authorityPackage.evidenceHash, "100-yard-evidence-hash-unchanged");
assert.equal(session.targetEvidenceImage.sha256, "100-yard-photo-hash-unchanged");
assert.deepEqual(session.authorityPackage.renderCoordinates.impacts, pkg.renderCoordinates.impacts);

assert.match(recordsSource, /const SCZN3Baker100YardSEC = \(\(\) => \{/);
assert.match(recordsSource, /registry\.createViewModel\(SEC_ADAPTER_ID, \{ session \}\)/);
assert.match(recordsSource, /SEC_ADAPTER_ID = "baker-100yd-zeroing"/);
assert.match(recordsSource, /return SCZN3SEC\.render\(\{/);
assert.match(recordsSource, /data-sec-adapter-id/);
assert.match(recordsSource, /data-scoring-presentation-family/);
assert.match(recordsSource, /data-target-profile-id/);
assert.match(recordsSource, /data-publisher-id/);
assert.match(recordsSource, /data-product-id/);
assert.match(recordsSource, /SCZN3Baker100YardSEC\.render\(session\)/);
assert.doesNotMatch(recordsSource, /function renderBaker100YardReferenceSec\(/, "the standalone 100 Yard SEC path is retired");

console.log("PASS Episode 54 Item 4B 100 Yard SEC adapter mapping preserves authority, identity, evidence, and shared-shell ownership");
